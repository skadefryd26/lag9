import { useCallback, useEffect, useRef, useState } from "react";
import { ApiFeil, strømRettssak } from "../api/rettssakApi";
import type { Drama, FeilKode, Rolle, Steg } from "../types/kontrakt";

export type Innlegg = { steg: Steg; rolle: Rolle; tekst: string };
export type Status = "klar" | "pågår" | "ferdig" | "feil";

export function feilTekst(kode: FeilKode, melding: string): string {
  if (kode === "TOKEN_MANGLER" || kode === "TOKEN_UTLOPT") {
    return "Bjarne får ikke kontakt med AI-en — tilgangsnøkkelen må fornyes. Si fra til kodeagenten.";
  }
  return melding;
}

export function useRettssak() {
  const [innlegg, setInnlegg] = useState<Innlegg[]>([]);
  const [status, setStatus] = useState<Status>("klar");
  const [feil, setFeil] = useState<string | null>(null);
  const kontroller = useRef<AbortController | null>(null);

  useEffect(() => () => kontroller.current?.abort(), []);

  const start = useCallback(async (saksTekst: string, drama: Drama) => {
    kontroller.current?.abort();
    const avbryt = new AbortController();
    kontroller.current = avbryt;
    setInnlegg([]);
    setFeil(null);
    setStatus("pågår");

    let avsluttet = false;
    try {
      await strømRettssak(
        saksTekst,
        drama,
        (h) => {
          if (h.type === "innlegg") setInnlegg((f) => [...f, { steg: h.steg, rolle: h.rolle, tekst: h.tekst }]);
          else if (h.type === "ferdig") {
            avsluttet = true;
            setStatus("ferdig");
          } else {
            avsluttet = true;
            setFeil(feilTekst(h.kode, h.melding));
            setStatus("feil");
          }
        },
        avbryt.signal,
      );
      if (!avsluttet && !avbryt.signal.aborted) {
        setFeil("Rettssaken ble avbrutt før dommen falt. Prøv igjen.");
        setStatus("feil");
      }
    } catch (err) {
      if (avbryt.signal.aborted) return;
      setFeil(
        err instanceof ApiFeil
          ? feilTekst(err.kode, err.message)
          : "Fikk ikke kontakt med backend. Kjører den?",
      );
      setStatus("feil");
    }
  }, []);

  return { innlegg, status, feil, start };
}
