# Lag 9: Skaderetten — «Bjarne mot alle»

## Idé

En forsikringssak går til retten. Aktor-AI argumenterer for at kravet skal avslås, forsvarer-AI for at
det skal utbetales, og dommer Bjarne avsier dom. Brukeren stiller dramaskalaen (1–10) separat for
aktor, forsvarer, Bjarne og rettsskriveren: fra nøktern saksgjennomgang på 1 til TV-rettssal med
innsigelser og gisp fra tilhørerbenken på 10.

Saken kommer enten fra brukeren (tekstfelt) eller fra rettsskriveren-AI-en («Overrask meg»).

## Agent

**Dommer Bjarne.** Husets AI: svært kompetent, arrogant, lat, kaffeavhengig, faktisk hjelpsom.
Vri: han er satt til å være dommer mot sin vilje, klokka er 15:55 på en fredag, og han vil hjem.
Korte dommer, siterer paragrafer han har funnet på selv, og blir synlig irritert når advokatene
snakker for lenge — noe de alltid gjør på drama 10.

Øvrige roller: aktor, forsvarer, rettsskriver (finner på saker).

## Første versjon

Brukeren skriver en sak eller trykker «Overrask meg», stiller dramaskalaen for hver rolle og trykker
«Start rettssaken». Så kommer fem innlegg fram ett etter ett:

1. Aktors innledningsforedrag
2. Forsvarerens innledningsforedrag
3. Aktors prosedyre (svarer på forsvarerens innledning)
4. Forsvarerens prosedyre (svarer på aktors innlegg)
5. Bjarnes dom (refererer til det som ble sagt)

Dramanivået påvirker alle fem, og rettsskriveren.

## Arbeidsdeling

| Del | Hvem |
| --- | --- |
| Skjermen — rettssalen, tekstfelt, «Overrask meg», skyvebryter, fem innleggsblokker | Pablo |
| Karakterene — systemprompter for Bjarne, aktor, forsvarer, rettsskriver + dramanivåer | Maria |
| Backend og gateway — rettssak-endepunkt (5 kall, strømmet), «Overrask meg»-endepunkt | Kristian |
| Prøve det ut — testsaker, drama 1/5/10, sjekke at innleggene svarer hverandre | Joakim |

## Beslutninger

- Ikke en chat: ett skjema inn, en rettssak ut.
- Eget dramanivå for aktor, forsvarer, Bjarne og rettsskriveren, alle med standardnivå 5.
- Aktors nivå gjelder begge innleggene til aktor, forsvarerens nivå gjelder begge innleggene til forsvareren.
- Fem separate gateway-kall per rettssak, i rekkefølge, med tidligere innlegg som kontekst.
- Innleggene strømmes til skjermen ett og ett (NDJSON), ikke alt på en gang.
- All tekst i appen og fra agentene er på norsk. Alle saker er oppdiktet.

Full brief til kodeagentene: `.ai/startprompt.md`.
