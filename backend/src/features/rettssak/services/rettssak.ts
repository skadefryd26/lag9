import type { GatewayKall } from "../../../clients/aiGateway.js";
import { aktorInstruks } from "../prompts/aktor.js";
import { bjarneAvbrytelseInstruks, bjarneInstruks } from "../prompts/bjarne.js";
import { dramaInstruks } from "../prompts/drama.js";
import { forsvarerInstruks } from "../prompts/forsvarer.js";
import { rettsskriverInstruks } from "../prompts/rettsskriver.js";
import type { Drama, Rolle, Steg } from "../types/kontrakt.js";

type Innlegg = { steg: Steg; rolle: Rolle; tekst: string };

const TITLER: Record<Steg, string> = {
  aktorInnledning: "Aktors innledningsforedrag",
  forsvarerInnledning: "Forsvarerens innledningsforedrag",
  bjarneEtterForsvarerInnledning: "Bjarne bryter inn",
  aktorProsedyre: "Aktors prosedyre",
  forsvarerProsedyre: "Forsvarerens prosedyre",
  bjarneEtterForsvarerProsedyre: "Bjarne bryter inn",
  dom: "Dommer Bjarnes dom",
};

const AVBRYTELSER_ETTER: Partial<Record<Steg, Steg>> = {
  forsvarerInnledning: "bjarneEtterForsvarerInnledning",
  forsvarerProsedyre: "bjarneEtterForsvarerProsedyre",
};

const STEG: readonly {
  steg: Steg;
  rolle: Rolle;
  dramaRolle: keyof Drama;
  tittel: string;
  instruks: () => string;
}[] = [
  { steg: "aktorInnledning", rolle: "aktor", dramaRolle: "aktor", tittel: "Aktors innledningsforedrag", instruks: () => aktorInstruks("innledning") },
  { steg: "forsvarerInnledning", rolle: "forsvarer", dramaRolle: "forsvarer", tittel: "Forsvarerens innledningsforedrag", instruks: () => forsvarerInstruks("innledning") },
  { steg: "aktorProsedyre", rolle: "aktor", dramaRolle: "aktor", tittel: "Aktors prosedyre", instruks: () => aktorInstruks("prosedyre") },
  { steg: "forsvarerProsedyre", rolle: "forsvarer", dramaRolle: "forsvarer", tittel: "Forsvarerens prosedyre", instruks: () => forsvarerInstruks("prosedyre") },
  { steg: "dom", rolle: "dommer", dramaRolle: "dommer", tittel: "Dommer Bjarnes dom", instruks: bjarneInstruks },
];

export function byggInput(saksTekst: string, tidligere: readonly Innlegg[], nesteTittel: string): string {
  const referat = tidligere.map((i) => {
    const tittel = TITLER[i.steg];
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
      instructions: s.instruks() + dramaInstruks(drama[s.dramaRolle]),
      input: byggInput(saksTekst, tidligere, s.tittel),
    });
    const innlegg = { steg: s.steg, rolle: s.rolle, tekst };
    tidligere.push(innlegg);
    yield innlegg;

    const avbrytelsessteg = drama.dommer === 10 ? AVBRYTELSER_ETTER[s.steg] : undefined;
    if (!avbrytelsessteg) continue;
    if (signal?.aborted) return;

    const kommentar = await gateway({
      instructions: bjarneAvbrytelseInstruks() + dramaInstruks(drama.dommer),
      input: byggInput(saksTekst, tidligere, TITLER[avbrytelsessteg]),
    });
    const avbrytelse = { steg: avbrytelsessteg, rolle: "dommer" as const, tekst: kommentar };
    tidligere.push(avbrytelse);
    yield avbrytelse;
  }
}

export function finnPåSak(dramanivå: number, gateway: GatewayKall): Promise<string> {
  return gateway({
    instructions: rettsskriverInstruks() + dramaInstruks(dramanivå),
    input: "Finn på en ny sak til dagens rettsliste.",
  });
}
