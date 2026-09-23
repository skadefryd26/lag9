import { Button, Text } from "@mantine/core";
import { useEffect, useRef, useState } from "react";

// Mikrofon til saksfeltet. Bruker nettleserens talegjenkjenning (Chrome/Edge).
// Merk: Chrome sender lyden til Google for gjenkjenning — bruk bare oppdiktede saker.

type Gjenkjenner = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function lagGjenkjenner(): Gjenkjenner | null {
  const w = window as unknown as { SpeechRecognition?: new () => Gjenkjenner; webkitSpeechRecognition?: new () => Gjenkjenner };
  const Klasse = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Klasse ? new Klasse() : null;
}

const FEIL: Record<string, string> = {
  "not-allowed": "Retten fikk ikke lov til å bruke mikrofonen. Tillat mikrofon i nettleseren.",
  "no-speech": "Retten hørte ingenting. Bjarne tolker taushet som en tilståelse.",
  network: "Talegjenkjenningen fikk ikke kontakt med nettet.",
};

export function Diktering({
  tekst,
  onTekst,
  disabled,
}: {
  tekst: string;
  onTekst: (t: string) => void;
  disabled?: boolean;
}) {
  const [lytter, setLytter] = useState(false);
  const [feil, setFeil] = useState<string | null>(null);
  const ref = useRef<Gjenkjenner | null>(null);
  const start = useRef("");
  const støttet = typeof window !== "undefined" && lagGjenkjenner() !== null;

  useEffect(() => () => ref.current?.stop(), []);

  if (!støttet) return null;

  const begynn = () => {
    const g = lagGjenkjenner();
    if (!g) return;
    g.lang = "nb-NO";
    g.continuous = true;
    g.interimResults = true;
    start.current = tekst.trim() ? `${tekst.trim()} ` : "";
    g.onresult = (e) => {
      let alt = "";
      for (let i = 0; i < e.results.length; i++) alt += e.results[i][0].transcript;
      onTekst((start.current + alt).slice(0, 2000));
    };
    g.onerror = (e) => setFeil(FEIL[e.error] ?? `Mikrofonen feilet (${e.error}).`);
    g.onend = () => setLytter(false);
    ref.current = g;
    setFeil(null);
    setLytter(true);
    g.start();
  };

  const stopp = () => ref.current?.stop();

  return (
    <>
      {lytter ? (
        <Button color="red.8" onClick={stopp} className="lytter-puls">
          🔴 Retten lytter … trykk for å stoppe
        </Button>
      ) : (
        <Button variant="outline" color="tre.7" onClick={begynn} disabled={disabled}>
          🎙️ Fortell saken
        </Button>
      )}
      {feil && (
        <Text c="red.8" size="sm">
          {feil}
        </Text>
      )}
    </>
  );
}
