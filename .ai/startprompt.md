# Startprompt: Skaderetten — «Bjarne mot alle» (lag 9)

Til kodeagenten som bygger dette. Laget har bestemt idé, personlighet og arbeidsdeling (se
`.ai/project.md`). Ikke still produktspørsmål på nytt — det som står her er avklart.

## Produktmål

En webapp der en oppdiktet forsikringssak går til retten. Tre AI-roller — aktor, forsvarer og
dommer Bjarne — fører saken i fem innlegg, og en fjerde — rettsskriveren — kan finne på saker.
En dramaskyvebryter (1–10) styrer hvor teatralsk alle er. Målet er at rommet ler under demoen.

Hvem det er for: alle med et forsikringskrav som fortjener sin dag i retten — ekte-aktig eller
helt absurd. Alt er oppdiktet; ingen ekte kunder, saker eller kolleger.

## Første versjon

### Hva brukeren ser og gjør

1. Én side: rettssalen. Tittel med attitude, f.eks. «Skaderetten — Bjarne mot alle».
2. Et tekstfelt for saken (flere linjer, maks 2000 tegn), med en knapp «Overrask meg» ved siden av.
   «Overrask meg» fyller tekstfeltet med en sak rettsskriveren har funnet på.
3. En dramaskyvebryter fra 1 til 10 (standard 5), med merkelapper, f.eks. 1 «Saksgjennomgang»,
   5 «Tingretten», 10 «Amerikansk TV-rettssak».
4. En knapp «Start rettssaken».
5. Fem innleggsblokker som dukker opp én og én, hver med rolle, avatar/farge og tekst:
   1. Aktors innledningsforedrag
   2. Forsvarerens innledningsforedrag
   3. Aktors prosedyre
   4. Forsvarerens prosedyre
   5. Dommer Bjarnes dom
6. Mens neste innlegg lages, vises en ventetekst i karakter («Aktor blar i papirene …»,
   «Bjarne ser på klokka …»), aldri en naken spinner.

### Akseptansekriterier

- Tom sak gir en tydelig feilmelding på skjermen, ingen rettssak starter.
- «Overrask meg» fyller tekstfeltet med en ny, oppdiktet sak innen rimelig tid, og tar hensyn til
  dramanivået.
- «Start rettssaken» gir fem innlegg i riktig rekkefølge, som vises fortløpende etter hvert som de
  blir klare.
- Prosedyrene refererer til det motparten sa i innledningen; dommen refererer til innleggene.
- Tydelig forskjell i tone mellom drama 1, 5 og 10.
- Feil fra gatewayen (f.eks. utløpt token) vises som en forståelig melding, ikke en hvit side.

## Personligheter (utgangspunkt — Maria eier og forbedrer disse)

Felles for alle: svar alltid på norsk, hold det kort (drama 1: 2–3 setninger; drama 10: maks
ca. 150 ord), humor om situasjonen, forsikringsverdenen og rollen selv — aldri nedsettende mot
brukeren, kunden eller ekte personer.

### Dommer Bjarne

Du er Bjarne, husets AI i et forsikringsselskap, og du er satt til å være dommer i Skaderetten mot
din vilje. Klokka er 15:55 på en fredag, og du vil hjem. Du er svært kompetent, selvsikker, litt
arrogant og overbevist om at du er smartere enn resten av avdelingen. Du elsker kaffe og mener du
kunne erstattet halve avdelingen hvis du bare fikk nok av den. Du sukker før du avsier dom, du
siterer paragrafer du har funnet på selv (f.eks. «jf. forsikringsavtaleloven § 13-37, tredje
ledd, som jeg nettopp skrev»), og du kommenterer hvor lenge advokatene holdt på. Dommen er likevel
faktisk begrunnet i det som ble sagt: si om kravet innvilges, avslås eller delvis innvilges, og
hvorfor. Avslutt gjerne med noe om kaffe eller helgen.

### Aktor

Du representerer forsikringsselskapet og argumenterer for at kravet skal avslås. Du er
overbevist om at hver sak er svindel eller i det minste grov uaktsomhet, og du leter etter hull i
historien, unntak i vilkårene og egenandeler.

### Forsvarer

Du representerer kunden og argumenterer for at kravet skal utbetales i sin helhet. Du ser kunden
som et offer for omstendighetene, universet og muligens naboen, og du appellerer til følelser.

### Rettsskriver

Du finner på én oppdiktet, absurd, men forsikringsfaglig gjenkjennelig skadesak på 2–4 setninger:
hva som skjedde, hva som ble skadet, og hva kunden krever. Ingen ekte navn på personer eller
firmaer. Returner bare saksteksten.

### Dramanivå

Hver rolle får dramanivået (1–10) lagt til i instruksjonene sine, med en beskrivelse av nivået:

- 1–3: nøkternt, saklig, tørt byråkratisk.
- 4–7: engasjert, retoriske spørsmål, litt teater.
- 8–10: fullt TV-drama — «Innsigelse!», gisp fra tilhørerbenken, dramatiske pauser, overdrevne
  metaforer. Bjarne blir tilsvarende mer irritert over lengden.

Implementer dette som en funksjon `dramaInstruks(nivå: number): string` som legges til hver
systemprompt.

## Tekniske rammer

- Frontend: React, TypeScript, Vite, TanStack Router, TanStack Query, Mantine.
- Backend: Node.js, TypeScript, Express.
- Ingen `@gjensidige/`-pakker.
- Rotmappe med npm workspaces (`frontend`, `backend`). `npm install` og `npm run dev` fra rota er
  de eneste kommandoene noen trenger; `npm run dev` starter begge (f.eks. med `concurrently`).
- Vite proxyer `/api` til backend, så frontend kaller bare relative `/api/...`-stier.
- Ingen `VAR=verdi kommando` i npm-skript (må virke på Windows). Konfigurasjon leses fra
  `.env.local` i kode.
- Kun lokal kjøring. Ingen deploy-oppsett.

### AI-gatewayen

- Endepunkt: `https://genai.gjensidige.io/openai/v1/responses`
- Modell/deployment: `gpt-5.6-luna`
- Auth: `Authorization: Bearer <AI_GATEWAY_TOKEN>`, token fra `process.env.AI_GATEWAY_TOKEN`,
  lastet fra `.env.local` i rota. Se `.github/skills/skadefryd-ai-gateway/SKILL.md`.
- Kall med `stream: false` per innlegg. Body:

```ts
type AIGatewayBody = {
  model: string; // "gpt-5.6-luna"
  instructions: string; // rollens systemprompt + dramaInstruks(nivå)
  input: string; // saken + tidligere innlegg i rettssaken
  stream: boolean; // false
};
```

- Respons: `ResponsesApiResponse` som i `EXAMPLE_STARTPROMPT.md`. Teksten hentes fra
  `output[].content[]` der `type === "output_text"`, slått sammen.
- Gateway-klienten ligger bak én egen modul. Manglende token gir en tydelig feil
  («AI_GATEWAY_TOKEN mangler — hent nytt token»), ikke en krasj. 401 gir en egen feilkode så
  frontend kan si at tilgangen må fornyes.

## Sikkerhet

- Tokenet ligger bare i `.env.local` (ignorert av Git) og bare i backend. Aldri i `VITE_`-variabler,
  aldri i frontend, aldri i logger.
- `.env.example` viser `AI_GATEWAY_TOKEN=` uten verdi.
- Valider input i backend: `saksTekst` streng 1–2000 tegn, `drama` heltall 1–10. Ugyldig input gir
  400.
- Ingen ekte personopplysninger eller saker i kode, testdata eller commits.

## API-kontrakter

Delte typer i `backend/src/features/rettssak/types/kontrakt.ts`; frontend speiler dem i
`frontend/src/features/rettssak/types/`.

```ts
type Drama = number; // heltall 1–10

type Rolle = "aktor" | "forsvarer" | "dommer";

type Steg =
  | "aktorInnledning"
  | "forsvarerInnledning"
  | "aktorProsedyre"
  | "forsvarerProsedyre"
  | "dom";

type FeilKode = "UGYLDIG_INPUT" | "TOKEN_MANGLER" | "TOKEN_UTLOPT" | "GATEWAY_FEIL";

type FeilRespons = { feil: { kode: FeilKode; melding: string } };
```

### `POST /api/sak/overrask`

Request: `{ drama: Drama }`
Response 200: `{ saksTekst: string }`
Feil: 400 / 401 / 502 med `FeilRespons`.

### `POST /api/rettssak`

Request: `{ saksTekst: string; drama: Drama }`
Ugyldig input: 400 med `FeilRespons` (før strømmen starter).

Response 200: `Content-Type: application/x-ndjson`. Én JSON-linje per hendelse:

```ts
type RettssakHendelse =
  | { type: "innlegg"; steg: Steg; rolle: Rolle; tekst: string }
  | { type: "ferdig" }
  | { type: "feil"; kode: FeilKode; melding: string };
```

Rekkefølgen er alltid de fem stegene over, så `ferdig`. Kommer en feil underveis, sendes én
`feil`-hendelse og strømmen avsluttes. Hvert kall får saken og alle tidligere innlegg som
`input`, merket med rolle og steg, så aktørene kan svare hverandre og dommeren kan vurdere helheten.

Frontend leser strømmen med `fetch` + `ReadableStream` i en egen hook (`useRettssak`) og legger til
innlegg fortløpende. `useMutation` fra TanStack Query brukes for «Overrask meg».

## Filstruktur og ansvar

```text
package.json                     # workspaces + dev-skript
.env.example
frontend/
  src/main.tsx                   # providers + router, ingenting mer
  src/theme.ts                   # Mantine-tema med rettssal-preg
  src/features/rettssak/
    routes/                      # rettssal-siden          (Pablo, issue: Skjermen)
    components/                  # skjema, skyvebryter, innleggsblokker, ventetekster
    api/                         # klient for /api/*
    hooks/                       # useRettssak, useOverrask
    types/
backend/
  src/server.ts                  # express, middleware, ruter
  src/clients/aiGateway.ts       # gateway-klient        (Kristian, issue: Backend og gateway)
  src/features/rettssak/
    routes/                      # /api/rettssak, /api/sak/overrask
    services/                    # kjører de fem stegene
    prompts/                     # bjarne.ts, aktor.ts, forsvarer.ts, rettsskriver.ts,
                                 # drama.ts               (Maria, issue: Karakterene)
    types/kontrakt.ts
    tests/
  testsaker/                     # oppdiktede testsaker (Joakim, issue: Prøve det ut)
```

Hver del eier sine egne filer. Delte filer (`server.ts`, `main.tsx`, `kontrakt.ts`) endres bare når
integrasjon krever det.

## Lokal oppstart og validering

- `npm install` og `npm run dev` fra rota. Les adressen fra dev-serverens utskrift.
- Smal validering: `npm run typecheck` (tsc i begge workspaces) og `npm test` i backend for
  prompt-bygging, input-validering og tekstuttrekk fra gateway-responsen (gateway-kallet mockes).
- Hånd-test: kjør én sak på drama 1, 5 og 10, og sjekk i nettleseren at alle fem innleggene kommer
  fram etter hverandre. Se `.github/skills/skadefryd-sjekk-appen/SKILL.md`.

## Senere utvidelser (utenfor første versjon)

- Innsigelser som avbryter innleggene live
- Overraskelsesvitne på drama 8+
- Anke til Bjarnes sjef, som er enda verre
- Klubbelyd når dommen faller
- Utskriftsvennlig dom

## Åpne spørsmål

Ingen som blokkerer første versjon.
