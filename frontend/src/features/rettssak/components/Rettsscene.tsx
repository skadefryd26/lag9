import { useEffect, useState } from "react";
import type { Innlegg } from "../hooks/useRettssak";
import type { Rolle } from "../types/kontrakt";
import { Aktor, Forsvarer } from "./Karakterer";
import "./rettsscene.css";

const GLOD: Record<Rolle, string> = { aktor: "#e04848", forsvarer: "#4a7bff", dommer: "#f0c94a" };
const NAVN: Record<Rolle, string> = { aktor: "Aktor", forsvarer: "Forsvarer", dommer: "Dommer Bjarne" };
const TEGN_PER_SEKUND = 70;
const PAUSE_ETTER_REPLIKK_MS = 3500;

type Props = {
  innlegg: Innlegg[];
  titler: Record<Innlegg["steg"], string>;
  /** Rollen som står for tur mens AI-en jobber, ellers null. */
  nesteRolle: Rolle | null;
};

// Spiller av innleggene ett og ett, med skrivemaskineffekt, selv om de kommer raskere fra backend.
export function Rettsscene({ innlegg, titler, nesteRolle }: Props) {
  const [indeks, setIndeks] = useState(0);
  const [vist, setVist] = useState(0);
  const [lengstSett, setLengstSett] = useState(0);
  const [automatisk, setAutomatisk] = useState(false);

  // Ny rettssak: start avspillingen på nytt.
  useEffect(() => {
    if (innlegg.length === 0) {
      setIndeks(0);
      setVist(0);
      setLengstSett(0);
    }
  }, [innlegg.length]);

  const aktivt: Innlegg | undefined = innlegg[indeks];
  const ferdigSkrevet = aktivt ? vist >= aktivt.tekst.length : false;

  // Skrivemaskin.
  useEffect(() => {
    if (!aktivt || ferdigSkrevet) return;
    const t = setInterval(() => setVist((v) => v + 2), 2000 / TEGN_PER_SEKUND);
    return () => clearInterval(t);
  }, [aktivt, ferdigSkrevet]);

  const gåTil = (ny: number) => {
    if (ny < 0 || ny >= innlegg.length) return;
    setIndeks(ny);
    // Replikker vi har sett før, vises hele med en gang. Nye skrives ut.
    setVist(ny <= lengstSett ? Number.MAX_SAFE_INTEGER : 0);
    setLengstSett((l) => Math.max(l, ny));
  };
  const harForrige = indeks > 0;
  const harNeste = indeks < innlegg.length - 1;

  // Automatisk modus: gå videre når replikken er ferdig og neste har kommet.
  useEffect(() => {
    if (!automatisk || !ferdigSkrevet || !harNeste) return;
    const t = setTimeout(() => gåTil(indeks + 1), PAUSE_ETTER_REPLIKK_MS);
    return () => clearTimeout(t);
  });

  // Piltaster.
  useEffect(() => {
    const tast = (e: KeyboardEvent) => {
      const mål = e.target as HTMLElement | null;
      if (mål && (mål.tagName === "TEXTAREA" || mål.tagName === "INPUT")) return;
      if (e.key === "ArrowRight") {
        if (aktivt && !ferdigSkrevet) setVist(aktivt.tekst.length);
        else gåTil(indeks + 1);
      } else if (e.key === "ArrowLeft") gåTil(indeks - 1);
    };
    window.addEventListener("keydown", tast);
    return () => window.removeEventListener("keydown", tast);
  });

  const snakker = aktivt && !ferdigSkrevet ? aktivt.rolle : null;
  // Den neste «tenker» bare når alt som har kommet, er ferdig vist.
  const tenker = !snakker && !harNeste ? nesteRolle : null;
  const fokus = snakker ?? tenker ?? aktivt?.rolle ?? null;
  const erDom = aktivt?.steg === "dom";

  const plass = (rolle: Rolle, figur: React.ReactNode) => {
    const klasser = ["plass", rolle];
    if (snakker === rolle) klasser.push("taler");
    else if (fokus === rolle) klasser.push("fokus");
    if (tenker === rolle) klasser.push("tenker");
    if (rolle === "forsvarer" && snakker === "aktor") klasser.push("reagerer");
    if (rolle === "aktor" && snakker === "forsvarer") klasser.push("reagerer");
    if (rolle === "dommer" && erDom) klasser.push("klubbe");

    return (
      <div className={klasser.join(" ")} style={{ ["--glod" as string]: GLOD[rolle] }}>
        {tenker === rolle && (
          <div className="boble tanke" aria-hidden>
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </div>
        )}
        {rolle === "dommer" && erDom && (
          <span className="klubbe-ikon" aria-hidden>
            🔨
          </span>
        )}
        {figur}
        <div className="benk" />
        <div className="navneskilt">{NAVN[rolle]}</div>
      </div>
    );
  };

  return (
    <div>
      <div className="scene" aria-label="Rettssalen">
        {erDom && <div className="blits" />}
        {plass("aktor", <Aktor className="figur" />)}
        {plass("dommer", <img src="/bjarne.svg" alt="Dommer Bjarne" className="figur" />)}
        {plass("forsvarer", <Forsvarer className="figur" />)}
      </div>

      {aktivt && (
        <div
          key={aktivt.steg}
          className={`replikk ${aktivt.rolle}`}
          style={{ ["--glod" as string]: GLOD[aktivt.rolle] }}
          onClick={() => setVist(aktivt.tekst.length)}
          title={ferdigSkrevet ? undefined : "Klikk for å vise hele"}
          aria-live="polite"
        >
          <div className="replikk-hode">
            <strong>{NAVN[aktivt.rolle]}</strong> · {titler[aktivt.steg]}
            {innlegg.length > 1 && (
              <span className="replikk-teller">
                {indeks + 1}/{innlegg.length}
              </span>
            )}
          </div>
          <div className="replikk-tekst">
            {aktivt.tekst.slice(0, vist)}
            {!ferdigSkrevet && <span className="markor">▍</span>}
          </div>
        </div>
      )}

      {aktivt && (
        <div className="kontroller">
          <button type="button" onClick={() => gåTil(indeks - 1)} disabled={!harForrige}>
            ◀ Forrige
          </button>
          <label className="auto">
            <input type="checkbox" checked={automatisk} onChange={(e) => setAutomatisk(e.currentTarget.checked)} />
            Automatisk
          </label>
          <button
            type="button"
            className={ferdigSkrevet && harNeste ? "klar" : undefined}
            onClick={() => (ferdigSkrevet ? gåTil(indeks + 1) : setVist(aktivt.tekst.length))}
            disabled={ferdigSkrevet && !harNeste}
          >
            {!ferdigSkrevet ? "Vis hele ⏩" : harNeste ? "Neste ▶" : nesteRolle ? `Venter på ${NAVN[nesteRolle].toLowerCase()} …` : "Slutt"}
          </button>
        </div>
      )}
    </div>
  );
}
