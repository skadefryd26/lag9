import { Button, Group, SegmentedControl, Stack, Text } from "@mantine/core";
import { useEffect, useRef, useState } from "react";
import type { Innlegg } from "../hooks/useRettssak";
import type { Drama, Rolle } from "../types/kontrakt";

// Leser hele rettssaken høyt med nettleserens innebygde talesyntese. Ingen backend trengs.
// Stemmene finnes på Mac. Mangler en stemme (f.eks. på Windows), brukes norsk stemme med
// forvrengt tonehøyde i stedet.

export type Intensitet = "mild" | "teatralsk" | "kaos";

type Stemme = { navn: string[]; pitch: number; rate: number; intro: string };

// Hver part har tre nivåer, og hvert nivå følger partens egen drama-skyvebryter.
// Stemmene er valgt etter personligheten: aktor er en prippen «Karen», forsvareren er
// en cocky sjarmør, og Bjarne er en utslitt dommer som helst vil hjem.
const STEMMER: Record<Rolle, Record<Intensitet, Stemme>> = {
  aktor: {
    mild: { navn: ["Nora"], pitch: 1.15, rate: 1.05, intro: "Ærede rett. Med all respekt." },
    teatralsk: { navn: ["Karen", "Samantha", "Moira"], pitch: 1.25, rate: 1.15, intro: "Unnskyld meg, ærede rett! Det står faktisk i vilkårene." },
    kaos: { navn: ["Superstar", "Karen", "Zarvox"], pitch: 1.6, rate: 1.4, intro: "JEG VIL SNAKKE MED SJEFEN DIN! INNSIGELSE! MOT ALT!" },
  },
  forsvarer: {
    mild: { navn: ["Nora"], pitch: 0.95, rate: 1.0, intro: "Ærede rett." },
    teatralsk: { navn: ["Rocko", "Eddy", "Fred"], pitch: 0.9, rate: 1.1, intro: "Heisann, ærede rett! Dette blir lett." },
    kaos: { navn: ["Good News", "Jester", "Wobble"], pitch: 1.1, rate: 1.15, intro: "Kom igjen a dommer! Dette her er bare tull!" },
  },
  dommer: {
    mild: { navn: ["Nora"], pitch: 0.6, rate: 0.85, intro: "Sukk. Dommen." },
    teatralsk: { navn: ["Grandpa", "Ralph", "Reed"], pitch: 0.4, rate: 0.7, intro: "Hhhhhhhhh. Sukk. Må jeg virkelig? Greit. Dommen." },
    kaos: { navn: ["Cellos", "Bad News", "Organ"], pitch: 0.8, rate: 0.9, intro: "Hhhhhhhhhhhhhhhhh. Bjarne synger dommen. Hør godt etter." },
  },
};

const AVSLUTNING: Record<Intensitet, string> = {
  mild: "Retten er hevet.",
  teatralsk: "Retten er hevet. Hvor er kaffen min?",
  kaos: "RETTEN ER HEVET! KAFFE! NÅ! Bjarne går hjem.",
};

const NAVN: Record<Rolle, string> = { aktor: "Aktor", forsvarer: "Forsvarer", dommer: "Bjarne" };
const IKON: Record<Intensitet, string> = { mild: "😐 mild", teatralsk: "🎭 teatralsk", kaos: "🤪 helt av skaftet" };

// Lar bakgrunnsmusikken dempe seg mens opplesningen pågår, uansett hvilken stemme som brukes.
let opplesningPågår = false;
export const leserOpp = () => opplesningPågår;

export function intensitetFraDrama(drama: number): Intensitet {
  return drama <= 3 ? "mild" : drama <= 7 ? "teatralsk" : "kaos";
}

function vaskTekst(t: string) {
  return t.replace(/[*_#>`]/g, "").replace(/\s+/g, " ").trim();
}

function finnStemme(navn: string[]): SpeechSynthesisVoice | undefined {
  const alle = window.speechSynthesis.getVoices();
  for (const n of navn) {
    const treff = alle.find((v) => v.name === n || v.name.startsWith(`${n} (`));
    if (treff) return treff;
  }
  return alle.find((v) => /^(nb|no|nn)/i.test(v.lang)) ?? alle.find((v) => /^(da|sv)/i.test(v.lang));
}

function ytring(tekst: string, s: Stemme) {
  const u = new SpeechSynthesisUtterance(tekst);
  const stemme = finnStemme(s.navn);
  if (stemme) {
    u.voice = stemme;
    u.lang = stemme.lang;
  } else {
    u.lang = "nb-NO";
  }
  u.pitch = s.pitch;
  u.rate = s.rate;
  return u;
}

export function Opplesning({ innlegg, drama }: { innlegg: Innlegg[]; drama: Drama }) {
  const [leser, setLeser] = useState(false);
  const [bjarneEkte, setBjarneEkte] = useState(false);

  useEffect(() => {
    opplesningPågår = leser;
    return () => {
      opplesningPågår = false;
    };
  }, [leser]);
  const lydRef = useRef<HTMLAudioElement | null>(null);
  const rundeRef = useRef(0);
  const [overstyr, setOverstyr] = useState<Intensitet | "auto">("auto");
  const nivå = (rolle: Rolle): Intensitet => (overstyr === "auto" ? intensitetFraDrama(drama[rolle]) : overstyr);
  const intensitet = nivå("dommer");
  const støttet = typeof window !== "undefined" && "speechSynthesis" in window;


  useEffect(() => {
    if (!støttet) return;
    // Chrome laster stemmelista etter hvert. Be om den tidlig.
    window.speechSynthesis.getVoices();
    fetch("/api/stemme/status")
      .then((r) => r.json())
      .then((d: { tilgjengelig?: boolean }) => setBjarneEkte(Boolean(d.tilgjengelig)))
      .catch(() => setBjarneEkte(false));
    return () => {
      rundeRef.current++;
      window.speechSynthesis.cancel();
      lydRef.current?.pause();
    };
  }, [støttet]);

  if (!støttet || innlegg.length === 0) return null;

  const snakk = (u: SpeechSynthesisUtterance) =>
    new Promise<void>((ferdig) => {
      u.onend = () => ferdig();
      u.onerror = () => ferdig();
      window.speechSynthesis.speak(u);
    });

  // Bjarnes ekte stemme fra ElevenLabs (via backend). Faller tilbake til nettleserstemmen.
  const spillBjarne = async (tekst: string, avbrutt: () => boolean): Promise<boolean> => {
    if (!bjarneEkte) return false;
    try {
      const svar = await fetch("/api/stemme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tekst, intensitet }),
      });
      if (!svar.ok || avbrutt()) return false;
      const url = URL.createObjectURL(await svar.blob());
      const lyd = new Audio(url);
      lydRef.current = lyd;
      await new Promise<void>((ferdig) => {
        lyd.onended = () => ferdig();
        lyd.onerror = () => ferdig();
        lyd.onpause = () => ferdig();
        void lyd.play().catch(() => ferdig());
      });
      URL.revokeObjectURL(url);
      return true;
    } catch {
      return false;
    }
  };

  const start = async () => {
    window.speechSynthesis.cancel();
    const runde = ++rundeRef.current;
    const avbrutt = () => rundeRef.current !== runde;
    setLeser(true);
    for (const i of innlegg) {
      if (avbrutt()) return;
      const s = STEMMER[i.rolle][nivå(i.rolle)];
      const tekst = vaskTekst(i.tekst);
      if (i.rolle === "dommer" && (await spillBjarne(`${s.intro} ${tekst}`, avbrutt))) continue;
      if (avbrutt()) return;
      await snakk(ytring(s.intro, s));
      if (avbrutt()) return;
      await snakk(ytring(tekst, s));
    }
    if (avbrutt()) return;
    if (!(await spillBjarne(AVSLUTNING[intensitet], avbrutt))) {
      if (!avbrutt()) await snakk(ytring(AVSLUTNING[intensitet], STEMMER.dommer[intensitet]));
    }
    if (!avbrutt()) setLeser(false);
  };

  const stopp = () => {
    rundeRef.current++;
    window.speechSynthesis.cancel();
    lydRef.current?.pause();
    setLeser(false);
  };

  return (
    <Stack gap="xs">
      <Group justify="center" gap="sm">
        <Text c="gull.2" fw={700} size="sm">
          Stemmeintensitet:
        </Text>
        <SegmentedControl
          value={overstyr}
          onChange={(v) => setOverstyr(v as Intensitet | "auto")}
          disabled={leser}
          color="gull.6"
          data={[
            { value: "auto", label: "🎚️ Følg dramanivå" },
            { value: "mild", label: "😐 Mild" },
            { value: "teatralsk", label: "🎭 Teatralsk" },
            { value: "kaos", label: "🤪 Helt av skaftet" },
          ]}
        />
      </Group>
      <Text c="gull.1" size="xs" ta="center">
        {(["aktor", "forsvarer", "dommer"] as Rolle[])
          .map((r) => `${NAVN[r]}: ${IKON[nivå(r)]}`)
          .join("   ·   ")}
      </Text>
      {leser ? (
        <Button color="red.8" onClick={stopp} fullWidth>
          🤫 Stille i retten! (stopp opplesningen)
        </Button>
      ) : (
        <Button color="gull.6" onClick={() => void start()} fullWidth size="md">
          🔊 La Bjarne lese opp hele saken{bjarneEkte ? " (med ekte Bjarne-stemme)" : ""}
        </Button>
      )}
    </Stack>
  );
}
