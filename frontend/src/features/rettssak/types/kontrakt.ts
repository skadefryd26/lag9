// Speiler backend/src/features/rettssak/types/kontrakt.ts. Endre begge samtidig.

export type Drama = {
  aktor: number;
  forsvarer: number;
  dommer: number;
  rettsskriver: number;
}; // hvert nivå er et heltall 1–10

export type Rolle = "aktor" | "forsvarer" | "dommer";

export type Steg =
  | "aktorInnledning"
  | "forsvarerInnledning"
  | "aktorProsedyre"
  | "forsvarerProsedyre"
  | "dom";

export const STEG_REKKEFOLGE: readonly Steg[] = [
  "aktorInnledning",
  "forsvarerInnledning",
  "aktorProsedyre",
  "forsvarerProsedyre",
  "dom",
] as const;

export type FeilKode = "UGYLDIG_INPUT" | "TOKEN_MANGLER" | "TOKEN_UTLOPT" | "GATEWAY_FEIL";

export type FeilRespons = { feil: { kode: FeilKode; melding: string } };

// POST /api/sak/overrask
export type OverraskRequest = { drama: Drama };
export type OverraskRespons = { saksTekst: string };

// POST /api/rettssak — svarer med application/x-ndjson, én RettssakHendelse per linje
export type RettssakRequest = { saksTekst: string; drama: Drama };

export type RettssakHendelse =
  | { type: "innlegg"; steg: Steg; rolle: Rolle; tekst: string }
  | { type: "ferdig" }
  | { type: "feil"; kode: FeilKode; melding: string };
