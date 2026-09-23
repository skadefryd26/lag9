import { useEffect, type ReactNode } from "react";
import type { Innlegg } from "../hooks/useRettssak";
import type { Rolle } from "../types/kontrakt";
import { Bakgrunnsmusikk, type Musikk } from "./Bakgrunnsmusikk";
import { Rettsscene } from "./Rettsscene";

type Props = {
  åpen: boolean;
  onLukk: () => void;
  innlegg: Innlegg[];
  titler: Record<Innlegg["steg"], string>;
  nesteRolle: Rolle | null;
  musikk: Musikk;
  /** Vises under scenen, f.eks. opplesning, «retten er hevet» eller feil. */
  bunn?: ReactNode;
};

// Fullskjerms rettssal som åpner seg med teppe når rettssaken starter.
// Forblir montert når den lukkes, så avspillingen husker hvor den var.
export function Rettssalvisning({ åpen, onLukk, innlegg, titler, nesteRolle, musikk, bunn }: Props) {
  useEffect(() => {
    if (!åpen) return;
    const forrige = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const tast = (e: KeyboardEvent) => {
      if (e.key === "Escape") onLukk();
    };
    window.addEventListener("keydown", tast);
    return () => {
      document.body.style.overflow = forrige;
      window.removeEventListener("keydown", tast);
    };
  }, [åpen, onLukk]);

  return (
    <div
      className={`rettssalvisning ${åpen ? "apen" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Rettssalen"
      aria-hidden={!åpen}
    >
      {åpen && (
        <>
          <div className="teppe venstre" aria-hidden />
          <div className="teppe hoyre" aria-hidden />
        </>
      )}
      <div className="rettssalvisning-innhold">
        <div className="rettssalvisning-topp">
          <span className="rettssalvisning-tittel">⚖️ Skaderetten er satt</span>
          <div className="rettssalvisning-knapper">
            <Bakgrunnsmusikk musikk={musikk} kompakt />
            <button type="button" className="lukk" onClick={onLukk} title="Lukk rettssalen (Esc)">
              ✕
            </button>
          </div>
        </div>
        <Rettsscene innlegg={innlegg} titler={titler} nesteRolle={nesteRolle} aktiv={åpen} />
        {bunn && <div className="rettssalvisning-bunn">{bunn}</div>}
      </div>
    </div>
  );
}
