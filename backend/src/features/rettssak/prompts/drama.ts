// Dramanivå 1–10. Legges til hver rolles systemprompt.

export function dramaInstruks(nivå: number): string {
  const n = Math.min(10, Math.max(1, Math.round(nivå)));
  const lengde =
    n <= 3 ? "Maks 2–3 korte setninger." : n <= 7 ? "Maks ca. 80 ord." : "Maks ca. 150 ord.";

  let tone: string;
  if (n <= 3) {
    tone =
      "Tonen er nøktern, saklig og tørt byråkratisk, som en saksgjennomgang i et møterom uten vinduer. " +
      "Ingen utrop eller overdrevne metaforer.";
  } else if (n <= 7) {
    tone =
      "Tonen er engasjert, som i tingretten en travel tirsdag: bruk retoriske spørsmål, litt teater " +
      "og en og annen dramatisk pause.";
  } else {
    tone =
      "Tonen er fullt amerikansk TV-rettsdrama: «Innsigelse!», gisp fra tilhørerbenken, dramatiske pauser, " +
      "overdrevne metaforer, tårer, og overbevisning om at dette er århundrets sak.";
  }

  return `\n\nDRAMANIVÅ: ${n} av 10. ${tone} ${lengde} Dramanivået styrer bare framføringen, ikke rolle, standpunkt eller saksfakta.`;
}
