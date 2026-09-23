import { Alert, Button, Card, Container, Group, Loader, Slider, Stack, Text, Textarea, Title } from "@mantine/core";
import { useState } from "react";
import { ApiFeil } from "../api/rettssakApi";
import { feilTekst, useRettssak } from "../hooks/useRettssak";
import { useOverrask } from "../hooks/useOverrask";
import { STEG_REKKEFOLGE, type Drama, type Steg } from "../types/kontrakt";

// Bevisst enkel første versjon. Utseendet er Pablos oppgave (issue #1).

const TITLER: Record<Steg, string> = {
  aktorInnledning: "Aktors innledningsforedrag",
  forsvarerInnledning: "Forsvarerens innledningsforedrag",
  aktorProsedyre: "Aktors prosedyre",
  forsvarerProsedyre: "Forsvarerens prosedyre",
  dom: "Dommer Bjarnes dom",
};

const DRAMA_ROLLER: readonly { rolle: keyof Drama; navn: string }[] = [
  { rolle: "aktor", navn: "Aktor" },
  { rolle: "forsvarer", navn: "Forsvarer" },
  { rolle: "dommer", navn: "Dommer Bjarne" },
  { rolle: "rettsskriver", navn: "Rettsskriver («Overrask meg»)" },
];

export function Rettssal() {
  const [saksTekst, setSaksTekst] = useState("");
  const [drama, setDrama] = useState<Drama>({
    aktor: 5,
    forsvarer: 5,
    dommer: 5,
    rettsskriver: 5,
  });
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

        <Stack gap="sm">
          <Text fw={500} size="sm">
            Velg dramaskala for hver rolle: 1 = saksgjennomgang, 5 = tingrett, 10 = TV-rettssak
          </Text>
          {DRAMA_ROLLER.map(({ rolle, navn }) => (
            <Stack key={rolle} gap={4}>
              <Text size="sm">
                {navn}: {drama[rolle]}
              </Text>
              <Slider
                aria-label={`Dramanivå for ${navn}`}
                min={1}
                max={10}
                step={1}
                value={drama[rolle]}
                onChange={(verdi) => setDrama((gjeldende) => ({ ...gjeldende, [rolle]: verdi }))}
                disabled={pågår}
                marks={[
                  { value: 1, label: "1" },
                  { value: 5, label: "5" },
                  { value: 10, label: "10" },
                ]}
              />
            </Stack>
          ))}
        </Stack>

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
