import type { GatewayKall } from "../../../clients/aiGateway.js";
import { aktorInstruks } from "../prompts/aktor.js";
import { bjarneInstruks } from "../prompts/bjarne.js";
import { dramaInstruks } from "../prompts/drama.js";
import { forsvarerInstruks } from "../prompts/forsvarer.js";
import { rettsskriverInstruks } from "../prompts/rettsskriver.js";
import type { Drama, Rolle, Steg } from "../types/kontrakt.js";

type Innlegg = { steg: Steg; rolle: Rolle; tekst: string };

const STEG: readonly { steg: Steg; rolle: Rolle; tittel: string; instruks: () => string }[] = [
  { steg: "aktorInnledning", rolle: "aktor", tittel: "Aktors innledningsforedrag", instruks: () => aktorInstruks("innledning") },
  { steg: "forsvarerInnledning", rolle: "forsvarer", tittel: "Forsvarerens innledningsforedrag", instruks: () => forsvarerInstruks("innledning") },
  { steg: "aktorProsedyre", rolle: "aktor", tittel: "Aktors prosedyre", instruks: () => aktorInstruks("prosedyre") },
  { steg: "forsvarerProsedyre", rolle: "forsvarer", tittel: "Forsvarerens prosedyre", instruks: () => forsvarerInstruks("prosedyre") },
  { steg: "dom", rolle: "dommer", tittel: "Dommer Bjarnes dom", instruks: bjarneInstruks },
];

export function byggInput(saksTekst: string, tidligere: readonly Innlegg[], nesteTittel: string): string {
  const referat = tidligere.map((i) => {
    const tittel = STEG.find((s) => s.steg === i.steg)?.tittel ?? i.steg;
    return `### ${tittel}\n${i.tekst}`;
  });
  return [
    `## Saken\n${saksTekst}`,
    referat.length ? `## Rettsforhandlingene så langt\n${referat.join("\n\n")}` : "",
    `## Din tur: ${nesteTittel}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export async function* førRettssak(
  saksTekst: string,
  drama: Drama,
  gateway: GatewayKall,
  signal?: AbortSignal,
): AsyncGenerator<Innlegg> {
  const tidligere: Innlegg[] = [];
  for (const s of STEG) {
    if (signal?.aborted) return;
    const tekst = await gateway({
      instructions: s.instruks() + dramaInstruks(drama),
      input: byggInput(saksTekst, tidligere, s.tittel),
    });
    const innlegg = { steg: s.steg, rolle: s.rolle, tekst };
    tidligere.push(innlegg);
    yield innlegg;
  }
}

export function finnPåSak(drama: Drama, gateway: GatewayKall): Promise<string> {
  return gateway({
    instructions: rettsskriverInstruks() + dramaInstruks(drama),
    input: "Finn på en ny sak til dagens rettsliste.",
  });
}
