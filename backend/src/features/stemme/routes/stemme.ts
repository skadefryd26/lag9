import { Router } from "express";

// Bjarnes ekte stemme via ElevenLabs. Nøkkelen ligger i .env.local (ELEVENLABS_API_KEY)
// og forlater aldri backend. Frontend får bare lyden (mp3).

const STEMME_ID = process.env.ELEVENLABS_VOICE_ID?.trim() || "OBiECllX7ojY6FFJbpk2";
const MODELL = "eleven_multilingual_v2";

type Intensitet = "mild" | "teatralsk" | "kaos";

// Lav stabilitet + høy stil = mer dramatisk og uforutsigbar.
const INNSTILLINGER: Record<Intensitet, { stability: number; similarity_boost: number; style: number }> = {
  mild: { stability: 0.75, similarity_boost: 0.8, style: 0.1 },
  teatralsk: { stability: 0.4, similarity_boost: 0.8, style: 0.55 },
  kaos: { stability: 0.15, similarity_boost: 0.75, style: 1.0 },
};

export function stemmeRouter() {
  const r = Router();

  r.get("/stemme/status", (_req, res) => {
    res.json({ tilgjengelig: Boolean(process.env.ELEVENLABS_API_KEY?.trim()) });
  });

  r.post("/stemme", async (req, res) => {
    const nøkkel = process.env.ELEVENLABS_API_KEY?.trim();
    if (!nøkkel) {
      res.status(503).json({ feil: { kode: "TOKEN_MANGLER", melding: "ElevenLabs-nøkkelen mangler." } });
      return;
    }
    const tekst = typeof req.body?.tekst === "string" ? req.body.tekst.trim().slice(0, 2500) : "";
    const intensitet: Intensitet = ["mild", "teatralsk", "kaos"].includes(req.body?.intensitet)
      ? req.body.intensitet
      : "teatralsk";
    if (!tekst) {
      res.status(400).json({ feil: { kode: "UGYLDIG_INPUT", melding: "Ingen tekst å lese opp." } });
      return;
    }

    try {
      const svar = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${STEMME_ID}?output_format=mp3_44100_128`,
        {
          method: "POST",
          headers: { "xi-api-key": nøkkel, "Content-Type": "application/json", Accept: "audio/mpeg" },
          body: JSON.stringify({ text: tekst, model_id: MODELL, voice_settings: INNSTILLINGER[intensitet] }),
        },
      );
      if (!svar.ok) {
        const detalj = (await svar.text()).slice(0, 300);
        console.error(`ElevenLabs svarte ${svar.status}: ${detalj}`);
        res.status(502).json({
          feil: {
            kode: svar.status === 401 ? "TOKEN_UTLOPT" : "GATEWAY_FEIL",
            melding: `ElevenLabs svarte med ${svar.status}.`,
          },
        });
        return;
      }
      res.setHeader("Content-Type", "audio/mpeg");
      res.send(Buffer.from(await svar.arrayBuffer()));
    } catch (err) {
      res.status(502).json({
        feil: { kode: "GATEWAY_FEIL", melding: `Fikk ikke kontakt med ElevenLabs: ${String(err)}` },
      });
    }
  });

  return r;
}
