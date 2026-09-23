import type { FeilKode } from "../features/rettssak/types/kontrakt.js";

const ENDEPUNKT = "https://genai.gjensidige.io/openai/v1/responses";
const MODELL = "gpt-5.6-luna";

export class GatewayFeil extends Error {
  constructor(
    public readonly kode: Exclude<FeilKode, "UGYLDIG_INPUT">,
    melding: string,
  ) {
    super(melding);
    this.name = "GatewayFeil";
  }
}

export type GatewayKall = (args: { instructions: string; input: string }) => Promise<string>;

type ResponsesApiResponse = {
  output?: { type: string; content?: { type: string; text?: string }[] }[];
};

export function hentTekst(respons: ResponsesApiResponse): string {
  return (respons.output ?? [])
    .flatMap((o) => o.content ?? [])
    .filter((c) => c.type === "output_text" && typeof c.text === "string")
    .map((c) => c.text)
    .join("")
    .trim();
}

export const kallGateway: GatewayKall = async ({ instructions, input }) => {
  const token = process.env.AI_GATEWAY_TOKEN?.trim();
  if (!token) {
    throw new GatewayFeil("TOKEN_MANGLER", "AI_GATEWAY_TOKEN mangler — hent nytt token");
  }

  let svar: Response;
  try {
    svar = await fetch(ENDEPUNKT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ model: MODELL, instructions, input, stream: false }),
    });
  } catch (err) {
    const grunn = err instanceof Error ? err.message : String(err);
    throw new GatewayFeil("GATEWAY_FEIL", `Fikk ikke kontakt med AI-gatewayen: ${grunn}`);
  }

  if (svar.status === 401) {
    throw new GatewayFeil(
      "TOKEN_UTLOPT",
      "Tilgangen til AI-gatewayen har utløpt — hent nytt token",
    );
  }
  if (!svar.ok) {
    throw new GatewayFeil("GATEWAY_FEIL", `AI-gatewayen svarte med ${svar.status}`);
  }

  const tekst = hentTekst((await svar.json()) as ResponsesApiResponse);
  if (!tekst) {
    throw new GatewayFeil("GATEWAY_FEIL", "AI-gatewayen svarte uten tekst");
  }
  return tekst;
};
