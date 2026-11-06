import { describe, expect, it } from "vitest";
import { badgeCompetence, ilYa, normaliser, prenom } from "./format";

const base = { competenceId: "c", niveau: "AVANCE", format: "LES_DEUX", sessionsNotees: 0, noteMoyenne: 0 } as const;

describe("badgeCompetence", () => {
  it("confirmée à 3 sessions notées 4 en moyenne (RG21)", () => {
    expect(badgeCompetence({ ...base, sessionsNotees: 3, noteMoyenne: 4 })).toBe("confirmee");
    expect(badgeCompetence({ ...base, sessionsNotees: 3, noteMoyenne: 3.9 })).toBe("declarative");
  });
  it("preuve fournie quand un lien existe, même si seul l'indicateur est connu (RG18)", () => {
    expect(badgeCompetence({ ...base, preuveUrl: "https://exemple.cm" })).toBe("preuve");
    expect(badgeCompetence({ ...base, preuveFournie: true })).toBe("preuve");
    expect(badgeCompetence(base)).toBe("declarative");
  });
});

describe("ilYa", () => {
  const maintenant = new Date("2026-11-04T12:00:00Z").getTime();
  const avant = (h: number) => new Date(maintenant - h * 3_600_000).toISOString();
  it("exprime l'ancienneté en langage courant", () => {
    expect(ilYa(avant(0.01), maintenant)).toBe("À l'instant");
    expect(ilYa(avant(0.5), maintenant)).toBe("Il y a 30 min");
    expect(ilYa(avant(2), maintenant)).toBe("Il y a 2 h");
    expect(ilYa(avant(26), maintenant)).toBe("Hier");
    expect(ilYa(avant(24 * 3), maintenant)).toBe("Dimanche");
  });
});

describe("textes", () => {
  it("normalise sans accent ni casse", () => expect(normaliser("  Cuisine Camerounaise é ")).toBe("cuisine camerounaise e"));
  it("prend le prénom", () => expect(prenom("Kevin Mbarga")).toBe("Kevin"));
});
