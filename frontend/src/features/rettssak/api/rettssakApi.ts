import type {
  Drama,
  FeilKode,
  FeilRespons,
  OverraskRespons,
  RettssakHendelse,
} from "../types/kontrakt";

export class ApiFeil extends Error {
  constructor(
    public readonly kode: FeilKode,
    melding: string,
  ) {
    super(melding);
  }
}

async function tilFeil(svar: Response): Promise<ApiFeil> {
  try {
    const body = (await svar.json()) as FeilRespons;
    return new ApiFeil(body.feil.kode, body.feil.melding);
  } catch {
    return new ApiFeil("GATEWAY_FEIL", `Backend svarte med ${svar.status}. Kjører den?`);
  }
}

export async function hentOverraskendeSak(drama: Drama): Promise<string> {
  const svar = await fetch("/api/sak/overrask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ drama }),
  });
  if (!svar.ok) throw await tilFeil(svar);
  return ((await svar.json()) as OverraskRespons).saksTekst;
}

export async function strømRettssak(
  saksTekst: string,
  drama: Drama,
  påHendelse: (h: RettssakHendelse) => void,
  signal: AbortSignal,
): Promise<void> {
  const svar = await fetch("/api/rettssak", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ saksTekst, drama }),
    signal,
  });
  if (!svar.ok || !svar.body) throw await tilFeil(svar);

  const leser = svar.body.getReader();
  const dekoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await leser.read();
    if (done) break;
    buffer += dekoder.decode(value, { stream: true });
    let linjeslutt: number;
    while ((linjeslutt = buffer.indexOf("\n")) >= 0) {
      const linje = buffer.slice(0, linjeslutt).trim();
      buffer = buffer.slice(linjeslutt + 1);
      if (linje) påHendelse(JSON.parse(linje) as RettssakHendelse);
    }
  }
}
