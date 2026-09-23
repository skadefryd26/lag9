import { describe, expect, it, vi } from "vitest";
import { hentTekst, type GatewayKall } from "../../../clients/aiGateway.js";
import { aktorInstruks } from "../prompts/aktor.js";
import { bjarneAvbrytelseInstruks, bjarneInstruks } from "../prompts/bjarne.js";
import { dramaInstruks } from "../prompts/drama.js";
import { forsvarerInstruks } from "../prompts/forsvarer.js";
import { rettsskriverInstruks } from "../prompts/rettsskriver.js";
import { finnPåSak, førRettssak } from "../services/rettssak.js";
import { validerDrama, validerSak } from "../services/validering.js";
import { STEG_REKKEFOLGE, STEG_REKKEFOLGE_MED_BJARNE_AVBRYTELSER } from "../types/kontrakt.js";

describe("validering", () => {
  it("avviser tom og for lang sak", () => {
    expect(validerSak("   ").ok).toBe(false);
    expect(validerSak(42).ok).toBe(false);
    expect(validerSak("x".repeat(2001)).ok).toBe(false);
    expect(validerSak("  Sykkelen ble stjålet  ")).toEqual({ ok: true, verdi: "Sykkelen ble stjålet" });
  });

  it("validerer et heltall 1–10 per rolle", () => {
    const gyldig = { aktor: 1, forsvarer: 5, dommer: 10, rettsskriver: 3 };
    expect(validerDrama(gyldig)).toEqual({ ok: true, verdi: gyldig });

    for (const ugyldig of [
      5,
      null,
      {},
      { ...gyldig, aktor: 0 },
      { ...gyldig, forsvarer: 11 },
      { ...gyldig, dommer: 5.5 },
      { ...gyldig, rettsskriver: "5" },
    ]) {
      expect(validerDrama(ugyldig).ok).toBe(false);
    }
  });
});

describe("dramaInstruks", () => {
  it("har tre tydelige nivåer og tar med tallet", () => {
    expect(dramaInstruks(1)).toMatch(/nøktern/);
    expect(dramaInstruks(5)).toMatch(/tingretten/);
    expect(dramaInstruks(10)).toMatch(/Innsigelse/);
    expect(dramaInstruks(1)).toContain("1 av 10");
    expect(dramaInstruks(5)).toContain("5 av 10");
    expect(dramaInstruks(10)).toContain("10 av 10");
    for (const nivå of [1, 5, 10]) {
      expect(dramaInstruks(nivå)).toContain("bare framføringen");
    }
  });
});

describe("karakterprompter", () => {
  it("holder de fire rollene på norsk og skiller rolleoppgaven deres", () => {
    const prompter = [
      aktorInstruks("innledning"),
      forsvarerInstruks("innledning"),
      bjarneInstruks(),
      rettsskriverInstruks(),
    ];

    expect(prompter.every((prompt) => prompt.includes("norsk bokmål"))).toBe(true);
    expect(aktorInstruks("innledning")).toContain("forsikringsselskapet");
    expect(forsvarerInstruks("innledning")).toContain("kundens side");
    expect(bjarneInstruks()).toContain("INNVILGES, AVSLÅS eller DELVIS INNVILGES");
    expect(rettsskriverInstruks()).toContain("2–4 setninger");
  });

  it("ber prosedyrene svare på riktig tidligere innlegg", () => {
    expect(aktorInstruks("prosedyre")).toContain("Forsvareren har allerede holdt sitt innledningsforedrag");
    expect(aktorInstruks("prosedyre")).toContain("gjengi dem presist");
    expect(aktorInstruks("prosedyre")).toContain("Ikke legg ord i munnen på forsvareren");
    expect(forsvarerInstruks("prosedyre")).toContain("Aktor har allerede svart på innledningen din");
  });

  it("gir Bjarne en egen, kort avbrytelsesinstruks", () => {
    const prompt = bjarneAvbrytelseInstruks();
    expect(prompt).toContain("bryter spontant inn");
    expect(prompt).toContain("slay");
    expect(prompt).toContain("no cap");
    expect(prompt).toContain("period");
    expect(prompt).toContain("you know that's right");
    expect(prompt).toContain("hodestups forelsket i Forsvareren");
    expect(prompt).toContain("bare etter Forsvarerens innlegg");
    expect(prompt).toContain("Ikke avsi dom");
  });

  it("gir Aktor en sta, belærende og slu personlighet", () => {
    const prompt = aktorInstruks("innledning");
    expect(prompt).toContain("«Karen»-type");
    expect(prompt).toContain("sta og kverulerende");
    expect(prompt).toContain("privilegert");
    expect(prompt).toContain("utspekulert og taktisk");
    expect(prompt).toContain("Dramanivået styrer hvor tydelig og teatralsk");
  });

  it("gir Forsvareren en cocky, sjarmerende og ertende personlighet", () => {
    const prompt = forsvarerInstruks("prosedyre");
    expect(prompt).toContain("karismatisk, sjarmerende og eplekjekk");
    expect(prompt).toContain("liker å erte aktor");
    expect(prompt).toContain("Kom igjen a dommer, dette her er bare tull");
    expect(prompt).toContain("ikke bruk den replikken i hvert innlegg");
    expect(prompt).toContain("Dramanivået styrer hvor tydelig cocky, ertende og teatralsk");
    expect(prompt).toContain("Ikke forvrenge argumentene");
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

    const drama = { aktor: 2, forsvarer: 5, dommer: 9, rettsskriver: 3 };
    const innlegg = [];
    for await (const i of førRettssak("Trampoline på Tesla", drama, gateway)) innlegg.push(i);

    expect(innlegg.map((i) => i.steg)).toEqual(STEG_REKKEFOLGE);
    expect(innlegg.map((i) => i.rolle)).toEqual(["aktor", "forsvarer", "aktor", "forsvarer", "dommer"]);
    expect(kall[0]?.input).toContain("Trampoline på Tesla");
    expect(kall[0]?.input).not.toContain("svar 1");
    expect(kall[2]?.input).toContain("svar 2");
    expect(kall[3]?.input).toContain("svar 3");
    expect(kall[4]?.input).toContain("svar 1");
    expect(kall[4]?.input).toContain("svar 4");
    expect(kall[2]?.instructions).toContain("Forsvareren har allerede holdt sitt innledningsforedrag");
    expect(kall[3]?.instructions).toContain("Aktor har allerede svart på innledningen din");
    expect(kall[4]?.instructions).toContain("Bjarne");
    expect(kall[0]?.instructions).toContain("2 av 10");
    expect(kall[1]?.instructions).toContain("5 av 10");
    expect(kall[1]?.instructions).not.toContain("2 av 10");
    expect(kall[2]?.instructions).toContain("2 av 10");
    expect(kall[3]?.instructions).toContain("5 av 10");
    expect(kall[3]?.instructions).not.toContain("2 av 10");
    expect(kall[4]?.instructions).toContain("9 av 10");
  });

  it("setter inn to forelskede Bjarne-innlegg etter Forsvarerens innlegg på dommernivå 10", async () => {
    const kall: { instructions: string; input: string }[] = [];
    const gateway: GatewayKall = async (a) => {
      kall.push(a);
      return `svar ${kall.length}`;
    };
    const drama = { aktor: 2, forsvarer: 5, dommer: 10, rettsskriver: 3 };
    const innlegg = [];
    for await (const i of førRettssak("En oppdiktet skadesak", drama, gateway)) innlegg.push(i);

    expect(innlegg.map((i) => i.steg)).toEqual(STEG_REKKEFOLGE_MED_BJARNE_AVBRYTELSER);
    expect(innlegg.filter((i) => i.rolle === "dommer")).toHaveLength(3);
    expect(kall).toHaveLength(7);
    for (const [indeks, forrigeSvar] of [
      [2, "svar 2"],
      [5, "svar 5"],
    ] as const) {
      expect(kall[indeks]?.instructions).toContain("bryter spontant inn");
      expect(kall[indeks]?.instructions).toContain("forelsket i Forsvareren");
      expect(kall[indeks]?.input).toContain(forrigeSvar);
    }
  });

  it("stopper når forespørselen avbrytes", async () => {
    const avbryt = new AbortController();
    const gateway = vi.fn<GatewayKall>(async () => {
      avbryt.abort();
      return "svar";
    });
    const innlegg = [];
    for await (
      const i of førRettssak("sak", { aktor: 5, forsvarer: 5, dommer: 5, rettsskriver: 5 }, gateway, avbryt.signal)
    ) {
      innlegg.push(i);
    }
    expect(innlegg).toHaveLength(1);
    expect(gateway).toHaveBeenCalledTimes(1);
  });

  it("rettsskriveren får dramanivået", async () => {
    const gateway = vi.fn<GatewayKall>(async () => "En sak");
    await expect(finnPåSak(9, gateway)).resolves.toBe("En sak");
    expect(gateway.mock.calls[0]?.[0].instructions).toContain("9 av 10");
  });
});
