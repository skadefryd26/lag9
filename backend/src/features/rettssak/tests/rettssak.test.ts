import { describe, expect, it, vi } from "vitest";
import { hentTekst, type GatewayKall } from "../../../clients/aiGateway.js";
import { dramaInstruks } from "../prompts/drama.js";
import { finnPåSak, førRettssak } from "../services/rettssak.js";
import { validerDrama, validerSak } from "../services/validering.js";
import { STEG_REKKEFOLGE } from "../types/kontrakt.js";

describe("validering", () => {
  it("avviser tom og for lang sak", () => {
    expect(validerSak("   ").ok).toBe(false);
    expect(validerSak(42).ok).toBe(false);
    expect(validerSak("x".repeat(2001)).ok).toBe(false);
    expect(validerSak("  Sykkelen ble stjålet  ")).toEqual({ ok: true, verdi: "Sykkelen ble stjålet" });
  });

  it("godtar bare heltall 1–10 som drama", () => {
    for (const ugyldig of [0, 11, 5.5, "5", undefined]) expect(validerDrama(ugyldig).ok).toBe(false);
    expect(validerDrama(1).ok).toBe(true);
    expect(validerDrama(10).ok).toBe(true);
  });
});

describe("dramaInstruks", () => {
  it("har tre tydelige nivåer og tar med tallet", () => {
    expect(dramaInstruks(2)).toMatch(/nøktern/);
    expect(dramaInstruks(5)).toMatch(/tingretten/);
    expect(dramaInstruks(9)).toMatch(/Innsigelse/);
    expect(dramaInstruks(1)).toContain("1 av 10");
    expect(dramaInstruks(3)).toContain("3 av 10");
  });
});

describe("hentTekst", () => {
  it("slår sammen output_text og hopper over annet", () => {
    const tekst = hentTekst({
      output: [
        { type: "reasoning" },
        { type: "message", content: [{ type: "output_text", text: "Hei " }, { type: "refusal" }, { type: "output_text", text: "retten" }] },
      ],
    });
    expect(tekst).toBe("Hei retten");
  });
});

describe("førRettssak", () => {
  it("gir fem innlegg i riktig rekkefølge, og senere innlegg ser tidligere", async () => {
    const kall: { instructions: string; input: string }[] = [];
    const gateway: GatewayKall = async (a) => {
      kall.push(a);
      return `svar ${kall.length}`;
    };

    const innlegg = [];
    for await (const i of førRettssak("Trampoline på Tesla", 7, gateway)) innlegg.push(i);

    expect(innlegg.map((i) => i.steg)).toEqual(STEG_REKKEFOLGE);
    expect(innlegg.map((i) => i.rolle)).toEqual(["aktor", "forsvarer", "aktor", "forsvarer", "dommer"]);
    expect(kall[0]?.input).toContain("Trampoline på Tesla");
    expect(kall[0]?.input).not.toContain("svar 1");
    expect(kall[4]?.input).toContain("svar 1");
    expect(kall[4]?.input).toContain("svar 4");
    expect(kall[4]?.instructions).toContain("Bjarne");
    expect(kall.every((k) => k.instructions.includes("7 av 10"))).toBe(true);
  });

  it("stopper når forespørselen avbrytes", async () => {
    const avbryt = new AbortController();
    const gateway = vi.fn<GatewayKall>(async () => {
      avbryt.abort();
      return "svar";
    });
    const innlegg = [];
    for await (const i of førRettssak("sak", 5, gateway, avbryt.signal)) innlegg.push(i);
    expect(innlegg).toHaveLength(1);
    expect(gateway).toHaveBeenCalledTimes(1);
  });

  it("rettsskriveren får dramanivået", async () => {
    const gateway = vi.fn<GatewayKall>(async () => "En sak");
    await expect(finnPåSak(3, gateway)).resolves.toBe("En sak");
    expect(gateway.mock.calls[0]?.[0].instructions).toContain("3 av 10");
  });
});
