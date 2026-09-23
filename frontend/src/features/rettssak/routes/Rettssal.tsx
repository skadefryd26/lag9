import { Alert, Button, Card, Container, Group, Loader, Slider, Stack, Text, Textarea, Title } from "@mantine/core";
import { useState } from "react";
import { ApiFeil } from "../api/rettssakApi";
import { feilTekst, useRettssak } from "../hooks/useRettssak";
import { useOverrask } from "../hooks/useOverrask";
import { STEG_REKKEFOLGE, type Steg } from "../types/kontrakt";

// Bevisst enkel første versjon. Utseendet er Pablos oppgave (issue #1).

const TITLER: Record<Steg, string> = {
  aktorInnledning: "Aktors innledningsforedrag",
  forsvarerInnledning: "Forsvarerens innledningsforedrag",
  aktorProsedyre: "Aktors prosedyre",
  forsvarerProsedyre: "Forsvarerens prosedyre",
  dom: "Dommer Bjarnes dom",
};

export function Rettssal() {
  const [saksTekst, setSaksTekst] = useState("");
  const [drama, setDrama] = useState(5);
  const [valideringsfeil, setValideringsfeil] = useState<string | null>(null);
  const rettssak = useRettssak();
  const overrask = useOverrask((sak) => {
    setSaksTekst(sak);
    setValideringsfeil(null);
  });

  const pågår = rettssak.status === "pågår";
  const nesteSteg = STEG_REKKEFOLGE[rettssak.innlegg.length];
  const overraskFeil =
    overrask.error instanceof ApiFeil
      ? feilTekst(overrask.error.kode, overrask.error.message)
      : overrask.error
        ? "Fikk ikke kontakt med backend. Kjører den?"
        : null;

  const startRettssak = () => {
    if (!saksTekst.trim()) {
      setValideringsfeil("Retten kan ikke dømme i en tom sak. Skriv hva som skjedde.");
      return;
    }
    setValideringsfeil(null);
    void rettssak.start(saksTekst, drama);
  };

  return (
    <Container size="sm" py="xl">
      <Stack>
        <Title>Skaderetten — Bjarne mot alle</Title>

        <Textarea
          label="Saken"
          placeholder="Hva skjedde?"
          autosize
          minRows={3}
          maxLength={2000}
          value={saksTekst}
          onChange={(e) => setSaksTekst(e.currentTarget.value)}
          error={valideringsfeil}
          disabled={pågår}
        />
        <Group>
          <Button variant="default" onClick={() => overrask.mutate(drama)} loading={overrask.isPending} disabled={pågår}>
            Overrask meg
          </Button>
        </Group>
        {overraskFeil && <Alert color="red">{overraskFeil}</Alert>}

        <Text fw={500} size="sm">
          Drama: {drama}
        </Text>
        <Slider
          min={1}
          max={10}
          step={1}
          value={drama}
          onChange={setDrama}
          disabled={pågår}
          marks={[
            { value: 1, label: "Saksgjennomgang" },
            { value: 5, label: "Tingretten" },
            { value: 10, label: "TV-rettssak" },
          ]}
          mb="lg"
        />

        <Button onClick={startRettssak} loading={pågår}>
          Start rettssaken
        </Button>

        {rettssak.innlegg.map((i) => (
          <Card key={i.steg} withBorder>
            <Text fw={700}>{TITLER[i.steg]}</Text>
            <Text style={{ whiteSpace: "pre-wrap" }}>{i.tekst}</Text>
          </Card>
        ))}

        {pågår && nesteSteg && (
          <Group>
            <Loader size="sm" />
            <Text c="dimmed">{TITLER[nesteSteg]} …</Text>
          </Group>
        )}

        {rettssak.feil && <Alert color="red">{rettssak.feil}</Alert>}
      </Stack>
    </Container>
  );
}
