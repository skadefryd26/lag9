import { Button, Group, SegmentedControl, Stack, Text } from "@mantine/core";
import { useEffect, useRef, useState } from "react";
import type { Innlegg } from "../hooks/useRettssak";
import type { Rolle } from "../types/kontrakt";

// Leser hele rettssaken høyt med nettleserens innebygde talesyntese. Ingen backend trengs.
// Stemmene finnes på Mac. Mangler en stemme (f.eks. på Windows), brukes norsk stemme med
// forvrengt tonehøyde i stedet.

export type Intensitet = "mild" | "teatralsk" | "kaos";

type Stemme = { navn: string[]; pitch: number; rate: number; intro: string };

const STEMMER: Record<Intensitet, Record<Rolle, Stemme>> = {
  mild: {
    aktor: { navn: ["Nora"], pitch: 1.2, rate: 1.05, intro: "Ærede rett." },
    forsvarer: { navn: ["Nora"], pitch: 0.9, rate: 0.95, intro: "Ærede rett." },
    dommer: { navn: ["Nora"], pitch: 0.6, rate: 0.85, intro: "Sukk. Dommen." },
  },
  teatralsk: {
    aktor: { navn: ["Rocko", "Eddy"], pitch: 1.3, rate: 1.2, intro: "Ærede rett! Hør her!" },
    forsvarer: { navn: ["Grandma", "Shelley", "Flo"], pitch: 1.1, rate: 0.9, intro: "Åhh, ærede rett, tenk på stakkaren." },
    dommer: { navn: ["Grandpa", "Reed"], pitch: 0.4, rate: 0.7, intro: "Hhhhhhhhh. Sukk. Må jeg virkelig? Greit. Dommen." },
  },
  kaos: {
    aktor: { navn: ["Superstar", "Jester", "Zarvox"], pitch: 1.5, rate: 1.35, intro: "ÆREDE RETT! INNSIGELSE! MOT ALT!" },
    forsvarer: { navn: ["Wobble", "Bubbles", "Trinoids"], pitch: 1.2, rate: 1.0, intro: "Å nei, å nei, å nei, ærede rett!" },
    dommer: { navn: ["Cellos", "Organ", "Bad News"], pitch: 0.8, rate: 0.9, intro: "Hhhhhhhhhhhhhhhhh. Bjarne synger dommen. Hør godt etter." },
  },
};

const AVSLUTNING: Record<Intensitet, string> = {
  mild: "Retten er hevet.",
  teatralsk: "Retten er hevet. Hvor er kaffen min?",
  kaos: "RETTEN ER HEVET! KAFFE! NÅ! Bjarne går hjem.",
};

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

export function Opplesning({ innlegg, drama }: { innlegg: Innlegg[]; drama: number }) {
  const [leser, setLeser] = useState(false);
  const [bjarneEkte, setBjarneEkte] = useState(false);
  const lydRef = useRef<HTMLAudioElement | null>(null);
  const rundeRef = useRef(0);
  const [intensitet, setIntensitet] = useState<Intensitet>(intensitetFraDrama(drama));
  const støttet = typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => setIntensitet(intensitetFraDrama(drama)), [drama]);

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
    const sett = STEMMER[intensitet];
    setLeser(true);
    for (const i of innlegg) {
      if (avbrutt()) return;
      const s = sett[i.rolle];
      const tekst = vaskTekst(i.tekst);
      if (i.rolle === "dommer" && (await spillBjarne(`${s.intro} ${tekst}`, avbrutt))) continue;
      if (avbrutt()) return;
      await snakk(ytring(s.intro, s));
      if (avbrutt()) return;
      await snakk(ytring(tekst, s));
    }
    if (avbrutt()) return;
    if (!(await spillBjarne(AVSLUTNING[intensitet], avbrutt))) {
      if (!avbrutt()) await snakk(ytring(AVSLUTNING[intensitet], sett.dommer));
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
          value={intensitet}
          onChange={(v) => setIntensitet(v as Intensitet)}
          disabled={leser}
          color="gull.6"
          data={[
            { value: "mild", label: "😐 Mild" },
            { value: "teatralsk", label: "🎭 Teatralsk" },
            { value: "kaos", label: "🤪 Helt av skaftet" },
          ]}
        />
      </Group>
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
