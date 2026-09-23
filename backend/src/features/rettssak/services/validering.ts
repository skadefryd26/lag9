import type { Drama } from "../types/kontrakt.js";

export type Resultat<T> = { ok: true; verdi: T } | { ok: false; melding: string };

function erObjekt(verdi: unknown): verdi is Record<string, unknown> {
  return typeof verdi === "object" && verdi !== null && !Array.isArray(verdi);
}

function erDramanivå(verdi: unknown): verdi is number {
  return typeof verdi === "number" && Number.isInteger(verdi) && verdi >= 1 && verdi <= 10;
}

export function validerDrama(verdi: unknown): Resultat<Drama> {
  if (!erObjekt(verdi)) {
    return { ok: false, melding: "Velg et dramanivå fra 1 til 10 for hver rolle." };
  }

  const aktor = verdi.aktor;
  const forsvarer = verdi.forsvarer;
  const dommer = verdi.dommer;
  const rettsskriver = verdi.rettsskriver;
  if (
    !erDramanivå(aktor) ||
    !erDramanivå(forsvarer) ||
    !erDramanivå(dommer) ||
    !erDramanivå(rettsskriver)
  ) {
    return { ok: false, melding: "Hvert dramanivå må være et helt tall fra 1 til 10." };
  }

  return { ok: true, verdi: { aktor, forsvarer, dommer, rettsskriver } };
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
