// Buet tittel med dobbel omriss-skrift, som graverte bokstaver.
export function BuetTittel() {
  return (
    <svg
      viewBox="0 0 800 260"
      role="img"
      aria-label="Bjarne mot alle. Retten er satt. Dommeren har egentlig gått for dagen."
      style={{ width: "100%", maxWidth: 800, display: "block", margin: "0 auto" }}
    >
      <defs>
        <path id="bue-tittel" d="M 20 215 Q 400 -45 780 215" />
        <path id="bue-under" d="M 70 250 Q 400 20 730 250" />
      </defs>
      <g
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="84" fontWeight="400"
        letterSpacing="3"
        paintOrder="stroke"
      >
        {/* Ytre omriss (tykt, gull) */}
        <text fill="none" stroke="#e6cc5f" strokeWidth="9" strokeLinejoin="round">
          <textPath href="#bue-tittel" startOffset="50%" textAnchor="middle">
            Bjarne mot alle
          </textPath>
        </text>
        {/* Mørk kjerne gir dobbel linje */}
        <text fill="#26160c" stroke="#26160c" strokeWidth="4" strokeLinejoin="round">
          <textPath href="#bue-tittel" startOffset="50%" textAnchor="middle">
            Bjarne mot alle
          </textPath>
        </text>
        {/* Tynn gravert linje inni */}
        <text fill="none" stroke="#fdf8e6" strokeWidth="1.2">
          <textPath href="#bue-tittel" startOffset="50%" textAnchor="middle">
            Bjarne mot alle
          </textPath>
        </text>
      </g>
      <text
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="22" fontWeight="400" fontStyle="italic"
        fill="#f5ede6"
        letterSpacing="1"
        style={{ filter: "drop-shadow(1px 1px 0 #000)" }}
      >
        <textPath href="#bue-under" startOffset="50%" textAnchor="middle">
          Retten er satt. Dommeren har egentlig gått for dagen.
        </textPath>
      </text>
    </svg>
  );
}
