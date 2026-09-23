import { useId } from "react";

// Inline-SVG slik at munn og hode kan animeres med CSS (.munn, .hode, .oyne).
// Samme viewBox og stil som public/bjarne.svg.

type Props = { className?: string; style?: React.CSSProperties };

export function Aktor({ className, style }: Props) {
  const id = useId().replace(/:/g, "");
  const g = (n: string) => `${n}-${id}`;
  return (
    <svg viewBox="0 0 400 460" role="img" aria-label="Karikatur av aktor, en streng kvinnelig statsadvokat" className={className} style={style}>
      <title>Aktor</title>
      <defs>
        <radialGradient id={g("hud")} cx="45%" cy="38%" r="65%">
          <stop offset="0" stopColor="#f6d2bd" />
          <stop offset="0.6" stopColor="#e6ae90" />
          <stop offset="1" stopColor="#b97c5e" />
        </radialGradient>
        <linearGradient id={g("kappe")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1d1d22" />
          <stop offset="1" stopColor="#050507" />
        </linearGradient>
        <linearGradient id={g("haar")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5a3b22" />
          <stop offset="1" stopColor="#2a190c" />
        </linearGradient>
        <radialGradient id={g("kinn")} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#d9534f" stopOpacity="0.45" />
          <stop offset="1" stopColor="#d9534f" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Kappe */}
      <path d="M36 460 C46 370 112 334 200 332 C288 334 354 370 364 460 Z" fill={`url(#${g("kappe")})`} />
      <path d="M150 350 L200 460 L250 350" fill="#8b1e1e" opacity="0.9" />
      <path d="M160 332 L200 368 L240 332 L228 326 L200 348 L172 326 Z" fill="#f7f5f0" stroke="#cfc8bb" strokeWidth="2" />
      <path d="M190 362 L186 412 Q192 416 198 412 L198 364 Z" fill="#f7f5f0" stroke="#cfc8bb" strokeWidth="2" />
      <path d="M202 364 L202 412 Q208 416 214 412 L210 362 Z" fill="#f7f5f0" stroke="#cfc8bb" strokeWidth="2" />

      {/* Papirbunke under armen */}
      <g transform="rotate(-8 90 400)">
        <rect x="46" y="372" width="96" height="64" rx="3" fill="#fbf7ec" stroke="#b9ad92" strokeWidth="2" />
        <rect x="50" y="366" width="96" height="64" rx="3" fill="#fffdf6" stroke="#b9ad92" strokeWidth="2" />
        <path d="M60 382 H132 M60 394 H126 M60 406 H134 M60 418 H112" stroke="#8b1e1e" strokeWidth="3" strokeLinecap="round" />
        <text x="98" y="378" fontSize="10" fontWeight="700" fill="#8b1e1e" textAnchor="middle">§§§</text>
      </g>

      {/* Pekefinger */}
      <g className="aktor-arm">
        <path d="M300 460 C300 420 320 380 336 350" stroke={`url(#${g("kappe")})`} strokeWidth="46" strokeLinecap="round" fill="none" />
        <ellipse cx="340" cy="332" rx="22" ry="20" fill={`url(#${g("hud")})`} stroke="#9c6446" strokeWidth="2" />
        <path d="M344 316 L352 262 Q356 252 362 262 L358 318 Z" fill={`url(#${g("hud")})`} stroke="#9c6446" strokeWidth="2" />
      </g>

      <g className="hode">
        {/* Stram knute bak */}
        <circle cx="200" cy="58" r="34" fill={`url(#${g("haar")})`} />
        <path d="M176 52 Q200 36 224 52" stroke="#7a5534" strokeWidth="3" fill="none" opacity="0.7" />
        <rect x="168" y="84" width="64" height="8" rx="4" fill="#8b1e1e" />
        {/* Hals */}
        <path d="M176 296 L178 336 Q200 346 222 336 L224 296 Z" fill="#d49a7c" />
        {/* Hår bak ansiktet – bob */}
        <path d="M118 180 C104 96 156 70 200 70 C244 70 296 96 282 180 C286 236 276 270 262 286 L240 250 L160 250 L138 286 C124 270 114 236 118 180 Z" fill={`url(#${g("haar")})`} />
        {/* Ansikt – smalt og spisst */}
        <path d="M134 176 C134 104 164 82 200 82 C236 82 266 104 266 176 C266 244 242 300 200 310 C158 300 134 244 134 176 Z" fill={`url(#${g("hud")})`} stroke="#9c6446" strokeWidth="2" />
        {/* Øredobber */}
        <circle cx="132" cy="226" r="7" fill="#c9a227" stroke="#7a5f10" strokeWidth="2" />
        <circle cx="268" cy="226" r="7" fill="#c9a227" stroke="#7a5f10" strokeWidth="2" />
        {/* Pannelugg, skarp sideskill */}
        <path d="M130 170 C126 110 160 84 204 86 C240 88 268 108 272 150 C252 118 222 104 196 110 C170 118 146 138 130 170 Z" fill={`url(#${g("haar")})`} />
        <path d="M204 88 C196 108 180 126 150 146" stroke="#7a5534" strokeWidth="3" fill="none" opacity="0.7" />
        {/* Kinn */}
        <ellipse cx="160" cy="236" rx="20" ry="12" fill={`url(#${g("kinn")})`} />
        <ellipse cx="240" cy="236" rx="20" ry="12" fill={`url(#${g("kinn")})`} />
        {/* Skarpe, formede bryn */}
        <path d="M144 158 Q164 142 188 160" stroke="#2a190c" strokeWidth="6" strokeLinecap="round" fill="none" />
        <path d="M256 158 Q236 142 212 160" stroke="#2a190c" strokeWidth="6" strokeLinecap="round" fill="none" />
        {/* Øyne med vipper */}
        <g className="oyne">
          <ellipse cx="166" cy="186" rx="12" ry="9" fill="#fff" />
          <ellipse cx="234" cy="186" rx="12" ry="9" fill="#fff" />
          <circle cx="168" cy="187" r="6" fill="#3a5a3c" />
          <circle cx="232" cy="187" r="6" fill="#3a5a3c" />
          <path d="M152 182 Q166 172 180 182 M152 182 L146 176 M158 178 L154 171 M220 182 Q234 172 248 182 M248 182 L254 176 M242 178 L246 171" stroke="#1d1d22" strokeWidth="3" strokeLinecap="round" fill="none" />
        </g>
        {/* Kattøye-briller */}
        <g fill="rgba(200,230,255,0.15)" stroke="#8b1e1e" strokeWidth="5" strokeLinejoin="round">
          <path d="M140 176 Q142 166 158 168 L182 170 Q192 172 190 186 Q186 206 164 206 Q142 204 140 188 Z" />
          <path d="M260 176 Q258 166 242 168 L218 170 Q208 172 210 186 Q214 206 236 206 Q258 204 260 188 Z" />
        </g>
        <path d="M190 182 Q200 176 210 182" stroke="#8b1e1e" strokeWidth="4" fill="none" />
        <path d="M140 174 L130 164 M260 174 L270 164" stroke="#8b1e1e" strokeWidth="5" strokeLinecap="round" />
        {/* Nese */}
        <path d="M200 198 Q196 228 190 240 Q200 246 210 240" fill="none" stroke="#9c6446" strokeWidth="3" strokeLinecap="round" />
        {/* Munn – rød leppestift, stramt */}
        <g className="munn" style={{ transformOrigin: "200px 272px" }}>
          <path d="M176 270 Q188 262 200 267 Q212 262 224 270 Q200 288 176 270 Z" fill="#b3122b" stroke="#6e0a1a" strokeWidth="2" />
          <path d="M180 270 Q200 272 220 270" stroke="#5a0814" strokeWidth="2" fill="none" />
        </g>
      </g>
    </svg>
  );
}

export function Forsvarer({ className, style }: Props) {
  const id = useId().replace(/:/g, "");
  const g = (n: string) => `${n}-${id}`;
  return (
    <svg viewBox="0 0 400 460" role="img" aria-label="Karikatur av forsvareren, en selvsikker toppadvokat" className={className} style={style}>
      <title>Forsvarer</title>
      <defs>
        <radialGradient id={g("hud")} cx="45%" cy="38%" r="65%">
          <stop offset="0" stopColor="#f3cdb1" />
          <stop offset="0.6" stopColor="#dca283" />
          <stop offset="1" stopColor="#b07252" />
        </radialGradient>
        <linearGradient id={g("dress")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#23293a" />
          <stop offset="1" stopColor="#0b0e16" />
        </linearGradient>
        <linearGradient id={g("haar")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4a3526" />
          <stop offset="1" stopColor="#1c120a" />
        </linearGradient>
        <radialGradient id={g("stubb")} cx="50%" cy="30%" r="70%">
          <stop offset="0.5" stopColor="#5a4a3e" stopOpacity="0" />
          <stop offset="1" stopColor="#5a4a3e" stopOpacity="0.3" />
        </radialGradient>
      </defs>

      {/* Dress – slank, med breie skuldre */}
      <path d="M30 460 C40 366 110 332 200 330 C290 332 360 366 370 460 Z" fill={`url(#${g("dress")})`} />
      {/* Skjorte */}
      <path d="M170 330 L200 460 L230 330 Z" fill="#fbfbfd" />
      {/* Vest */}
      <path d="M178 360 L200 460 L222 360 L212 350 L200 400 L188 350 Z" fill="#2c3346" />
      {/* Tynt slips */}
      <path d="M194 340 L206 340 L210 350 L204 420 L200 428 L196 420 L190 350 Z" fill="#101624" />
      {/* Peak-jakkeslag */}
      <path d="M170 330 L150 350 L128 340 L168 420 L196 460 L178 360 Z" fill="#1a2030" stroke="#3a4560" strokeWidth="2" />
      <path d="M230 330 L250 350 L272 340 L232 420 L204 460 L222 360 Z" fill="#1a2030" stroke="#3a4560" strokeWidth="2" />
      {/* Brystlommetørkle */}
      <path d="M270 396 L282 380 L290 394 L300 382 L304 400 Z" fill="#f4f6ff" stroke="#1e3f8b" strokeWidth="2" />
      <path d="M262 402 H310" stroke="#3a4560" strokeWidth="3" />
      {/* Blå mansjettknapp-glimt */}
      <circle cx="96" cy="440" r="5" fill="#4a7bff" />

      <g className="hode">
        <path d="M172 296 L172 334 Q200 346 228 334 L228 296 Z" fill="#c98f70" />
        {/* Ansikt – kraftig kjeve */}
        <path d="M128 176 C128 102 162 76 200 76 C238 76 272 102 272 176 C272 250 250 300 200 310 C150 300 128 250 128 176 Z" fill={`url(#${g("hud")})`} stroke="#8e5a3e" strokeWidth="2" />
        <path d="M128 176 C128 250 150 300 200 310 C250 300 272 250 272 176" fill={`url(#${g("stubb")})`} />
        <ellipse cx="126" cy="190" rx="12" ry="22" fill="#d99c7c" stroke="#8e5a3e" strokeWidth="2" />
        <ellipse cx="274" cy="190" rx="12" ry="22" fill="#d99c7c" stroke="#8e5a3e" strokeWidth="2" />
        {/* Bakoverstrøket hår med sideskill */}
        <path d="M124 164 C112 90 160 44 216 50 C268 56 292 96 278 162 C272 126 256 108 236 100 C210 92 170 96 150 110 C136 122 128 140 124 164 Z" fill={`url(#${g("haar")})`} />
        <path d="M160 70 Q210 52 262 76 M150 88 Q214 66 272 100 M168 60 L158 102" stroke="#7a5a42" strokeWidth="3" fill="none" opacity="0.8" />
        {/* Bryn – ett løftet */}
        <path d="M144 158 Q164 150 186 158" stroke="#1c120a" strokeWidth="8" strokeLinecap="round" fill="none" />
        <path className="bryn-loft" d="M214 146 Q236 130 258 142" stroke="#1c120a" strokeWidth="8" strokeLinecap="round" fill="none" />
        {/* Øyne – halvlukkede, selvsikre */}
        <g className="oyne">
          <ellipse cx="166" cy="182" rx="13" ry="8" fill="#fff" />
          <ellipse cx="236" cy="180" rx="13" ry="9" fill="#fff" />
          <circle cx="167" cy="183" r="6" fill="#2f4f7a" />
          <circle cx="237" cy="181" r="6" fill="#2f4f7a" />
          <path d="M152 178 Q166 172 180 178" stroke="#8e5a3e" strokeWidth="4" fill="none" />
        </g>
        {/* Nese */}
        <path d="M200 190 Q196 226 190 238 Q200 246 212 238" fill="none" stroke="#8e5a3e" strokeWidth="4" strokeLinecap="round" />
        {/* Smil – skjevt smirk */}
        <g className="munn" style={{ transformOrigin: "204px 268px" }}>
          <path d="M170 266 Q206 280 240 256" stroke="#6b2a22" strokeWidth="6" strokeLinecap="round" fill="none" />
          <path d="M238 252 Q246 256 242 264" stroke="#8e5a3e" strokeWidth="3" fill="none" />
        </g>
        {/* Kjevelinje-kløft */}
        <path d="M196 296 Q200 302 204 296" stroke="#8e5a3e" strokeWidth="3" fill="none" />
      </g>
    </svg>
  );
}
