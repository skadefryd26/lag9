import {
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Group,
  Loader,
  Paper,
  Slider,
  Stack,
  Text,
  Textarea,
  Title,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { ApiFeil } from "../api/rettssakApi";
import { Diktering } from "../components/Diktering";
import { Opplesning } from "../components/Opplesning";
import { feilTekst, useRettssak } from "../hooks/useRettssak";
import { useOverrask } from "../hooks/useOverrask";
import { STEG_REKKEFOLGE, type Drama, type Rolle, type Steg } from "../types/kontrakt";

const TITLER: Record<Steg, string> = {
  aktorInnledning: "Aktors innledningsforedrag",
  forsvarerInnledning: "Forsvarerens innledningsforedrag",
  aktorProsedyre: "Aktors prosedyre",
  forsvarerProsedyre: "Forsvarerens prosedyre",
  dom: "Dommer Bjarnes dom",
};

const ROLLER: Record<Rolle, { navn: string; ikon: string; farge: string; kant: string }> = {
  aktor: { navn: "Aktor", ikon: "⚔️", farge: "red.9", kant: "#8b1e1e" },
  forsvarer: { navn: "Forsvarer", ikon: "🛡️", farge: "blue.9", kant: "#1e3f8b" },
  dommer: { navn: "Dommer Bjarne", ikon: "☕", farge: "gull.7", kant: "#c9a227" },
};

// Ventetekster i karakter, per steg.
const VENTETEKSTER: Record<Steg, string[]> = {
  aktorInnledning: ["Aktor retter på slipset …", "Aktor blar dramatisk i papirene …"],
  forsvarerInnledning: ["Forsvareren ser rørt ut over egen argumentasjon …", "Forsvareren øver på et sukk …"],
  aktorProsedyre: ["Aktor finner fram flere paragrafer …", "Aktor peker anklagende mot ingenting …"],
  forsvarerProsedyre: ["Forsvareren tørker en tåre …", "Forsvareren vurderer å rope «innsigelse» …"],
  dom: ["Bjarne ser på klokka. Den er 15:57 …", "Bjarne henter påfyll før dommen …", "Bjarne sukker tungt fra dommerbenken …"],
};

const DRAMA_MERKER = [
  { value: 1, label: "1" },
  { value: 5, label: "5" },
  { value: 10, label: "10" },
];

const DRAMA_ROLLER: readonly { rolle: keyof Drama; navn: string }[] = [
  { rolle: "aktor", navn: "Aktor" },
  { rolle: "forsvarer", navn: "Forsvarer" },
  { rolle: "dommer", navn: "Dommer Bjarne" },
  { rolle: "rettsskriver", navn: "Rettsskriver («Overrask meg»)" },
];

function Ventetekst({ steg }: { steg: Steg }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    setI(0);
    const t = setInterval(() => setI((n) => n + 1), 2500);
    return () => clearInterval(t);
  }, [steg]);
  const tekster = VENTETEKSTER[steg];
  return (
    <Group gap="sm">
      <Loader size="sm" color="gull.4" />
      <Text c="gull.2" fs="italic">
        {tekster[i % tekster.length]}
      </Text>
    </Group>
  );
}

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
        ? "Rettsskriveren svarer ikke. Kjører backend?"
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
    <Box
      mih="100vh"
      style={{
        backgroundColor: "#26160c",
        backgroundImage:
          "linear-gradient(rgba(38,22,12,0.6), rgba(38,22,12,0.85)), url('/rettssal.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center top",
      }}
    >
      <Container size="md" py="xl">
        <Stack gap="lg">
          <Stack
            gap={4}
            align="center"
            justify="center"
            mih={260}
            p="xl"
            style={{
              borderRadius: 8,
              border: "3px solid #c9a227",
              boxShadow: "0 8px 30px rgba(0,0,0,0.6)",
              background:
                "rgba(38,22,12,0.55)",
              backdropFilter: "blur(2px)",
            }}
          >
            <Text c="gull.4" tt="uppercase" fw={700} style={{ letterSpacing: 6 }}>
              ⚖️ Skaderetten ⚖️
            </Text>
            <Title order={1} c="gull.2" ta="center" style={{ textShadow: "2px 2px 0 #000" }}>
              Bjarne mot alle
            </Title>
            <Text c="tre.1" fs="italic" ta="center">
              Retten er satt. Dommeren har egentlig gått for dagen.
            </Text>
          </Stack>

          <Paper p="lg" withBorder style={{ background: "#f5ede6", borderColor: "#c9a227", borderWidth: 3 }}>
            <Stack>
              <Textarea
                label="Saken for retten"
                placeholder="Beskriv hva som skjedde. Retten har begrenset tålmodighet."
                autosize
                minRows={3}
                maxLength={2000}
                value={saksTekst}
                onChange={(e) => setSaksTekst(e.currentTarget.value)}
                error={valideringsfeil}
                disabled={pågår}
              />
              <Group>
                <Diktering
                  tekst={saksTekst}
                  onTekst={(t) => {
                    setSaksTekst(t);
                    setValideringsfeil(null);
                  }}
                  disabled={pågår}
                />
                <Button
                  variant="outline"
                  color="tre.7"
                  onClick={() => overrask.mutate(drama)}
                  loading={overrask.isPending}
                  disabled={pågår}
                >
                  📜 Overrask meg
                </Button>
              </Group>
              {overraskFeil && <Alert color="red">{overraskFeil}</Alert>}

              <Stack gap="sm">
                <Text fw={700} size="sm" c="tre.9">
                  Dramanivå for hver rolle
                </Text>
                {DRAMA_ROLLER.map(({ rolle, navn }) => {
                  const d = drama[rolle];
                  return (
                    <Stack key={rolle} gap={4}>
                      <Group justify="space-between">
                        <Text fw={700} size="sm" c="tre.9">
                          {navn}
                        </Text>
                        <Badge
                          size="lg"
                          variant="filled"
                          color={d >= 8 ? "red.8" : d >= 4 ? "tre.8" : "gray.7"}
                          styles={{ label: { color: "#fff" } }}
                        >
                          {d}/10 · {d >= 8 ? "🔥 TV-rettssak" : d >= 4 ? "🎭 Tingretten" : "😴 Saksgjennomgang"}
                        </Badge>
                      </Group>
                      <Box px="xl">
                        <Slider
                          aria-label={`Dramanivå for ${navn}`}
                          min={1}
                          max={10}
                          step={1}
                          value={d}
                          onChange={(verdi) => setDrama((gjeldende) => ({ ...gjeldende, [rolle]: verdi }))}
                          disabled={pågår}
                          color="tre.7"
                          marks={DRAMA_MERKER}
                          mb="xl"
                          styles={{ markLabel: { color: "#26160c", fontWeight: 700 } }}
                        />
                      </Box>
                    </Stack>
                  );
                })}
              </Stack>

              <Button size="lg" color="tre.8" onClick={startRettssak} loading={pågår} fullWidth>
                🔨 Start rettssaken
              </Button>
            </Stack>
          </Paper>

          {rettssak.innlegg.map((i) => {
            const r = ROLLER[i.rolle];
            const erDom = i.steg === "dom";
            return (
              <Card
                key={i.steg}
                withBorder
                shadow="md"
                p="lg"
                className="innlegg-inn"
                style={{
                  background: erDom ? "#fdf8e6" : "#f5ede6",
                  borderLeft: `8px solid ${r.kant}`,
                  ...(erDom ? { border: `3px solid ${r.kant}` } : {}),
                }}
              >
                <Group mb="sm" gap="sm">
                  <Avatar color={r.farge} radius="xl" size="lg">
                    {r.ikon}
                  </Avatar>
                  <Stack gap={0}>
                    <Text fw={700} size={erDom ? "xl" : "md"}>
                      {TITLER[i.steg]}
                    </Text>
                    <Badge color={r.farge} variant="light">
                      {r.navn}
                    </Badge>
                  </Stack>
                </Group>
                <Text style={{ whiteSpace: "pre-wrap" }}>{i.tekst}</Text>
              </Card>
            );
          })}

          {pågår && nesteSteg && <Ventetekst steg={nesteSteg} />}

          {rettssak.status === "ferdig" && (
            <>
              <Opplesning innlegg={rettssak.innlegg} drama={drama.dommer} />
              <Text c="gull.3" ta="center" fw={700}>
                Retten er hevet. Bjarne er allerede på vei hjem.
              </Text>
            </>
          )}

          {rettssak.feil && (
            <Alert color="red" title="Retten er midlertidig suspendert" variant="filled">
              {rettssak.feil}
            </Alert>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
