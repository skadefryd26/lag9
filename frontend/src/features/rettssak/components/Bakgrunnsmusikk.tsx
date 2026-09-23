import { Badge, Button, Group } from "@mantine/core";
import { useEffect, useRef, useState } from "react";
import type { Drama } from "../types/kontrakt";
import { leserOpp } from "./Opplesning";

// Bakgrunnsmusikk generert i nettleseren med Web Audio API. Ingen lydfiler.
// Intensitet 0–1 kommer fra summen av alle dramanivåene.
//   Lav:  Satie – Gymnopédie nr. 1 (piano, rolig, zen)
//   Høy:  Grieg – I Dovregubbens hall (akselererer, strykere, messing og pauker legges på)
// Begge verkene er falt i det fri.

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

type Spor = "melodi" | "bass" | "akkord";
type Hendelse = { pos: number; noter: readonly number[]; lengde: number; spor: Spor };
type Stykke = { navn: "satie" | "grieg"; takt: number; lengde: number; hendelser: readonly Hendelse[] };

// Posisjoner og lengder er i åttendedeler.
const m = (pos: number, note: number, lengde: number): Hendelse => ({ pos, noter: [note], lengde, spor: "melodi" });
const b = (pos: number, note: number, lengde: number): Hendelse => ({ pos, noter: [note], lengde, spor: "bass" });
const a = (pos: number, noter: number[], lengde: number): Hendelse => ({ pos, noter, lengde, spor: "akkord" });

// Gymnopédie nr. 1, 3/4-takt: vekslende Gmaj7 og Dmaj7 under melodien.
const SATIE: Stykke = {
  navn: "satie",
  takt: 6,
  lengde: 48,
  hendelser: [
    ...Array.from({ length: 8 }, (_, takt) =>
      takt % 2 === 0
        ? [b(takt * 6, 43, 6), a(takt * 6 + 2, [59, 62, 66], 4)]
        : [b(takt * 6, 38, 6), a(takt * 6 + 2, [57, 61, 66], 4)],
    ).flat(),
    m(2, 78, 2), m(4, 81, 2),
    m(6, 79, 2), m(8, 78, 2), m(10, 73, 2),
    m(12, 71, 2), m(14, 73, 2), m(16, 74, 2),
    m(18, 69, 6),
    m(24, 66, 24),
  ],
};

// I Dovregubbens hall, a-moll, 4/4-takt.
const GRIEG: Stykke = {
  navn: "grieg",
  takt: 8,
  lengde: 32,
  hendelser: [
    m(0, 57, 1), m(1, 59, 1), m(2, 60, 1), m(3, 62, 1), m(4, 64, 1), m(5, 60, 1), m(6, 64, 2),
    m(8, 63, 1), m(9, 59, 1), m(10, 63, 2), m(12, 62, 1), m(13, 58, 1), m(14, 62, 2),
    m(16, 57, 1), m(17, 59, 1), m(18, 60, 1), m(19, 62, 1), m(20, 64, 1), m(21, 60, 1), m(22, 64, 1), m(23, 69, 1),
    m(24, 67, 1), m(25, 64, 1), m(26, 60, 1), m(27, 64, 1), m(28, 67, 4),
    ...[0, 8, 16].flatMap((t) => [b(t, 45, 2), b(t + 2, 40, 2), b(t + 4, 45, 2), b(t + 6, 40, 2)]),
    b(24, 48, 2), b(26, 43, 2), b(28, 48, 2), b(30, 43, 2),
  ],
};

const GRENSE = 0.4; // under dette: Satie. Over: Grieg.

function velgStykke(i: number) {
  return i < GRENSE ? SATIE : GRIEG;
}

class Motor {
  private ctx = new AudioContext();
  private master = this.ctx.createGain();
  private demping = this.ctx.createGain();
  private buss = this.ctx.createGain();
  private stykke: Stykke;
  private pos = 0;
  private neste = 0;
  private timer: ReturnType<typeof setInterval>;

  constructor(private intensitet: number) {
    const { ctx } = this;
    void ctx.resume();
    this.master.gain.setValueAtTime(0.0001, ctx.currentTime);
    this.master.gain.exponentialRampToValueAtTime(0.6, ctx.currentTime + 1.5);
    this.demping.connect(this.master).connect(ctx.destination);

    // Romklang: generert impulsrespons, gir "filmsal"-følelse.
    const rom = ctx.createConvolver();
    rom.buffer = this.impuls(2.8);
    const romGain = ctx.createGain();
    romGain.gain.value = 0.45;
    this.buss.connect(this.demping);
    this.buss.connect(rom).connect(romGain).connect(this.demping);

    this.stykke = velgStykke(intensitet);
    this.neste = ctx.currentTime + 0.1;
    this.timer = setInterval(() => this.planlegg(), 25);
  }

  settIntensitet(i: number) {
    this.intensitet = i;
  }

  demp(på: boolean) {
    this.demping.gain.setTargetAtTime(på ? 0.25 : 1, this.ctx.currentTime, 0.3);
  }

  stopp() {
    clearInterval(this.timer);
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(0.0001, t, 0.3);
    setTimeout(() => void this.ctx.close(), 1500);
  }

  // Grieg-andel 0–1 over grensen.
  private get j() {
    return Math.max(0, (this.intensitet - GRENSE) / (1 - GRENSE));
  }

  private åttendedel() {
    const bpm = this.stykke.navn === "satie" ? 60 + 20 * (this.intensitet / GRENSE) : 80 + 130 * this.j;
    return 60 / bpm / 2;
  }

  private planlegg() {
    while (this.neste < this.ctx.currentTime + 0.2) {
      const tikk = this.åttendedel();
      for (const h of this.stykke.hendelser) if (h.pos === this.pos) this.spill(h, this.neste, tikk);
      if (this.stykke.navn === "grieg" && this.pos === 0 && this.j > 0.8) this.cymbal(this.neste);
      if (this.stykke.navn === "grieg" && this.j > 0.5 && this.pos % 2 === 0) {
        this.pauke(hz(this.pos % 4 === 0 ? 33 : 28), this.neste, 0.15 + 0.2 * this.j);
      }
      this.neste += tikk;
      this.pos = (this.pos + 1) % this.stykke.lengde;
      if (this.pos % this.stykke.takt === 0) {
        const ønsket = velgStykke(this.intensitet);
        if (ønsket !== this.stykke) {
          this.stykke = ønsket;
          this.pos = 0;
        }
      }
    }
  }

  private spill(h: Hendelse, t: number, tikk: number) {
    const varighet = h.lengde * tikk;
    if (this.stykke.navn === "satie") {
      const styrke = { melodi: 0.09, bass: 0.07, akkord: 0.035 }[h.spor];
      for (const n of h.noter) this.piano(hz(n), t, varighet, styrke);
      if (h.spor === "akkord") for (const n of h.noter) this.streng(hz(n), t, varighet, 0.012, 900);
      return;
    }
    const j = this.j;
    for (const n of h.noter) {
      const f = hz(n);
      if (h.spor === "bass") {
        this.pizz(f, t, 0.14);
        if (j > 0.4) this.streng(f / 2, t, varighet * 0.9, 0.03 * j, 600);
        continue;
      }
      this.pizz(f, t, 0.11 - 0.04 * j);
      if (j > 0.3) this.streng(f, t, varighet * 0.95, 0.045 * j, 1500 + 3000 * j);
      if (j > 0.3) this.streng(f * 2, t, varighet * 0.95, 0.02 * j, 2500 + 3000 * j);
      if (j > 0.65) this.messing(f / 2, t, varighet * 0.9, 0.08 * (j - 0.5));
    }
  }

  private konvolutt(g: GainNode, t: number, angrep: number, hold: number, slipp: number, styrke: number) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(styrke, t + angrep);
    g.gain.setValueAtTime(styrke, t + angrep + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t + angrep + hold + slipp);
  }

  private osc(type: OscillatorType, f: number, t: number, slutt: number, ut: AudioNode, detune = 0) {
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.value = f;
    o.detune.value = detune;
    o.connect(ut);
    o.start(t);
    o.stop(slutt + 0.05);
  }

  private piano(f: number, t: number, varighet: number, styrke: number) {
    const g = this.ctx.createGain();
    const slipp = varighet + 1.5;
    this.konvolutt(g, t, 0.005, 0, slipp, styrke);
    g.connect(this.buss);
    this.osc("sine", f, t, t + slipp, g);
    const overtone = this.ctx.createGain();
    overtone.gain.value = 0.25;
    overtone.connect(g);
    this.osc("triangle", f * 2, t, t + slipp, overtone);
  }

  private pizz(f: number, t: number, styrke: number) {
    const g = this.ctx.createGain();
    this.konvolutt(g, t, 0.004, 0, 0.25, styrke);
    g.connect(this.buss);
    this.osc("triangle", f, t, t + 0.3, g);
  }

  private streng(f: number, t: number, varighet: number, styrke: number, klang: number) {
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = klang;
    const g = this.ctx.createGain();
    this.konvolutt(g, t, Math.min(0.08, varighet / 3), Math.max(0, varighet - 0.08), 0.25, styrke);
    filter.connect(g).connect(this.buss);
    const slutt = t + varighet + 0.35;
    this.osc("sawtooth", f, t, slutt, filter, -8);
    this.osc("sawtooth", f, t, slutt, filter, 8);
  }

  private messing(f: number, t: number, varighet: number, styrke: number) {
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(300, t);
    filter.frequency.exponentialRampToValueAtTime(2800, t + 0.06);
    filter.frequency.exponentialRampToValueAtTime(1400, t + 0.3);
    const g = this.ctx.createGain();
    this.konvolutt(g, t, 0.03, Math.max(0, varighet - 0.03), 0.15, styrke);
    filter.connect(g).connect(this.buss);
    this.osc("sawtooth", f, t, t + varighet + 0.2, filter);
    this.osc("square", f * 1.001, t, t + varighet + 0.2, filter);
  }

  private pauke(f: number, t: number, styrke: number) {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.frequency.setValueAtTime(f * 1.6, t);
    o.frequency.exponentialRampToValueAtTime(f, t + 0.1);
    this.konvolutt(g, t, 0.004, 0, 0.9, styrke);
    o.connect(g).connect(this.buss);
    o.start(t);
    o.stop(t + 1);
  }

  private cymbal(t: number) {
    const kilde = this.ctx.createBufferSource();
    kilde.buffer = this.støy(2.5);
    const hp = this.ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 5000;
    const g = this.ctx.createGain();
    this.konvolutt(g, t, 0.005, 0, 2.2, 0.12);
    kilde.connect(hp).connect(g).connect(this.buss);
    kilde.start(t);
  }

  private støy(sekunder: number) {
    const lengde = Math.floor(this.ctx.sampleRate * sekunder);
    const buffer = this.ctx.createBuffer(1, lengde, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let n = 0; n < lengde; n++) data[n] = Math.random() * 2 - 1;
    return buffer;
  }

  private impuls(sekunder: number) {
    const lengde = Math.floor(this.ctx.sampleRate * sekunder);
    const buffer = this.ctx.createBuffer(2, lengde, this.ctx.sampleRate);
    for (let k = 0; k < 2; k++) {
      const data = buffer.getChannelData(k);
      for (let n = 0; n < lengde; n++) data[n] = (Math.random() * 2 - 1) * (1 - n / lengde) ** 3;
    }
    return buffer;
  }
}

function intensitetFraDrama(drama: Drama) {
  const sum = drama.aktor + drama.forsvarer + drama.dommer + drama.rettsskriver;
  return (sum - 4) / 36; // 4–40 → 0–1
}

function stemning(i: number) {
  if (i < 0.2) return "🧘 Zen · Satie";
  if (i < GRENSE) return "🍵 Rolig · Satie";
  if (i < 0.7) return "🎻 Spent · Grieg";
  return "🔥 Episk · Grieg";
}

export function Bakgrunnsmusikk({ drama }: { drama: Drama }) {
  const [på, setPå] = useState(false);
  const intensitet = intensitetFraDrama(drama);
  const motor = useRef<Motor | null>(null);
  const sisteIntensitet = useRef(intensitet);
  sisteIntensitet.current = intensitet;

  const støttet = typeof window !== "undefined" && "AudioContext" in window;

  useEffect(() => {
    if (!på) return;
    const mot = new Motor(sisteIntensitet.current);
    motor.current = mot;
    // Demp musikken mens Bjarne leser opp.
    const lytter = setInterval(() => mot.demp(leserOpp()), 300);
    return () => {
      clearInterval(lytter);
      mot.stopp();
      motor.current = null;
    };
  }, [på]);

  useEffect(() => {
    motor.current?.settIntensitet(intensitet);
  }, [intensitet]);

  if (!støttet) return null;

  return (
    <Group gap="sm">
      <Button variant={på ? "filled" : "outline"} color="tre.7" onClick={() => setPå((v) => !v)}>
        {på ? "🔇 Skru av musikk" : "🎵 Bakgrunnsmusikk"}
      </Button>
      {på && (
        <Badge size="lg" variant="light" color={intensitet >= 0.7 ? "red.8" : "tre.8"}>
          {stemning(intensitet)}
        </Badge>
      )}
    </Group>
  );
}
