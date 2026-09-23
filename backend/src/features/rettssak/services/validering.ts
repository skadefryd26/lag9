import type { Drama } from "../types/kontrakt.js";

export type Resultat<T> = { ok: true; verdi: T } | { ok: false; melding: string };

export function validerDrama(verdi: unknown): Resultat<Drama> {
  if (typeof verdi !== "number" || !Number.isInteger(verdi) || verdi < 1 || verdi > 10) {
    return { ok: false, melding: "Dramanivået må være et helt tall fra 1 til 10." };
  }
  return { ok: true, verdi };
}

export function validerSak(verdi: unknown): Resultat<string> {
  if (typeof verdi !== "string" || verdi.trim().length === 0) {
    return { ok: false, melding: "Retten kan ikke dømme i en tom sak. Skriv hva som skjedde." };
  }
  const sak = verdi.trim();
  if (sak.length > 2000) {
    return { ok: false, melding: "Saken er over 2000 tegn. Selv Bjarne har grenser." };
  }
  return { ok: true, verdi: sak };
}
