import { Button, Group, SegmentedControl, Stack, Text } from "@mantine/core";
import { useEffect, useState } from "react";
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
  const [intensitet, setIntensitet] = useState<Intensitet>(intensitetFraDrama(drama));
  const støttet = typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => setIntensitet(intensitetFraDrama(drama)), [drama]);

  useEffect(() => {
    if (!støttet) return;
    // Chrome laster stemmelista etter hvert. Be om den tidlig.
    window.speechSynthesis.getVoices();
    return () => window.speechSynthesis.cancel();
  }, [støttet]);

  if (!støttet || innlegg.length === 0) return null;

  const start = () => {
    const tale = window.speechSynthesis;
    tale.cancel();
    const sett = STEMMER[intensitet];
    const kø: SpeechSynthesisUtterance[] = [];
    for (const i of innlegg) {
      kø.push(ytring(sett[i.rolle].intro, sett[i.rolle]));
      kø.push(ytring(vaskTekst(i.tekst), sett[i.rolle]));
    }
    const slutt = ytring(AVSLUTNING[intensitet], sett.dommer);
    slutt.onend = () => setLeser(false);
    slutt.onerror = () => setLeser(false);
    kø.push(slutt);
    setLeser(true);
    kø.forEach((u) => tale.speak(u));
  };

  const stopp = () => {
    window.speechSynthesis.cancel();
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
        <Button color="gull.6" onClick={start} fullWidth size="md">
          🔊 La Bjarne lese opp hele saken
        </Button>
      )}
    </Stack>
  );
}
