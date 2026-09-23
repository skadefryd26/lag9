import { Router, type Response } from "express";
import { GatewayFeil, type GatewayKall } from "../../../clients/aiGateway.js";
import { finnPåSak, førRettssak } from "../services/rettssak.js";
import { validerDrama, validerSak } from "../services/validering.js";
import type { FeilKode, FeilRespons, RettssakHendelse } from "../types/kontrakt.js";

function tilFeil(err: unknown): { kode: FeilKode; melding: string } {
  if (err instanceof GatewayFeil) return { kode: err.kode, melding: err.message };
  console.error("Uventet feil i rettssaken:", err);
  return { kode: "GATEWAY_FEIL", melding: "Noe gikk galt i rettssalen. Prøv igjen." };
}

function status(kode: FeilKode): number {
  if (kode === "UGYLDIG_INPUT") return 400;
  if (kode === "TOKEN_MANGLER" || kode === "TOKEN_UTLOPT") return 401;
  return 502;
}

function sendFeil(res: Response, kode: FeilKode, melding: string) {
  const body: FeilRespons = { feil: { kode, melding } };
  res.status(status(kode)).json(body);
}

export function rettssakRouter(gateway: GatewayKall): Router {
  const router = Router();

  router.post("/sak/overrask", async (req, res) => {
    const drama = validerDrama(req.body?.drama);
    if (!drama.ok) return sendFeil(res, "UGYLDIG_INPUT", drama.melding);
    try {
      res.json({ saksTekst: await finnPåSak(drama.verdi.rettsskriver, gateway) });
    } catch (err) {
      const f = tilFeil(err);
      sendFeil(res, f.kode, f.melding);
    }
  });

  router.post("/rettssak", async (req, res) => {
    const sak = validerSak(req.body?.saksTekst);
    if (!sak.ok) return sendFeil(res, "UGYLDIG_INPUT", sak.melding);
    const drama = validerDrama(req.body?.drama);
    if (!drama.ok) return sendFeil(res, "UGYLDIG_INPUT", drama.melding);

    const avbryt = new AbortController();
    res.on("close", () => avbryt.abort());

    res.status(200);
    res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    const send = (h: RettssakHendelse) => {
      if (!res.writableEnded) res.write(JSON.stringify(h) + "\n");
    };

    try {
      for await (const innlegg of førRettssak(sak.verdi, drama.verdi, gateway, avbryt.signal)) {
        send({ type: "innlegg", ...innlegg });
      }
      if (!avbryt.signal.aborted) send({ type: "ferdig" });
    } catch (err) {
      send({ type: "feil", ...tilFeil(err) });
    } finally {
      res.end();
    }
  });

  return router;
}
