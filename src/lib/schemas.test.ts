import { describe, expect, it } from "vitest";
import { avisSchema, codeSmsSchema, declarationSchema, inscriptionSchema, localisationSchema, messageSchema, propositionSchema, signalementSchema, telephoneSchema } from "./schemas";
import { estConfirmee } from "./domain";

const inscriptionValide = { email: "amina@exemple.cm", pseudo: "Amina", motDePasse: "motdepasse12", majeur: true, cgu: true } as const;

describe("inscription (RG1)", () => {
  it("accepte une inscription complète", () => {
    expect(inscriptionSchema.safeParse(inscriptionValide).success).toBe(true);
  });
  it("refuse sans confirmation de majorité", () => {
    expect(inscriptionSchema.safeParse({ ...inscriptionValide, majeur: false }).success).toBe(false);
  });
  it("refuse sans CGU", () => {
    expect(inscriptionSchema.safeParse({ ...inscriptionValide, cgu: false }).success).toBe(false);
  });
  it("refuse un mot de passe trop court et une adresse invalide", () => {
    expect(inscriptionSchema.safeParse({ ...inscriptionValide, motDePasse: "court" }).success).toBe(false);
    expect(inscriptionSchema.safeParse({ ...inscriptionValide, email: "pas-un-email" }).success).toBe(false);
  });
});

describe("téléphone et code SMS (RG17)", () => {
  it("exige un numéro international", () => {
    expect(telephoneSchema.safeParse({ telephone: "+237670000000" }).success).toBe(true);
    expect(telephoneSchema.safeParse({ telephone: "670000000" }).success).toBe(false);
    expect(telephoneSchema.safeParse({ telephone: "+237 67 00" }).success).toBe(false);
  });
  it("exige un code à 6 chiffres", () => {
    expect(codeSmsSchema.safeParse({ code: "482917" }).success).toBe(true);
    expect(codeSmsSchema.safeParse({ code: "48291" }).success).toBe(false);
    expect(codeSmsSchema.safeParse({ code: "48a917" }).success).toBe(false);
  });
});

describe("localisation (RG5)", () => {
  it("le mode automatique exige le consentement", () => {
    expect(localisationSchema.safeParse({ mode: "AUTOMATIQUE", consentement: true }).success).toBe(true);
    expect(localisationSchema.safeParse({ mode: "AUTOMATIQUE", consentement: false }).success).toBe(false);
    expect(localisationSchema.safeParse({ mode: "AUTOMATIQUE" }).success).toBe(false);
  });
  it("le mode manuel exige une ville", () => {
    expect(localisationSchema.safeParse({ mode: "MANUELLE", ville: "Yaoundé" }).success).toBe(true);
    expect(localisationSchema.safeParse({ mode: "MANUELLE", ville: "" }).success).toBe(false);
  });
  it("le mode aucun n'exige rien", () => {
    expect(localisationSchema.safeParse({ mode: "AUCUNE" }).success).toBe(true);
  });
});

describe("déclaration de compétence (RG3, RG18)", () => {
  const base = { competenceId: "c1", sens: "OFFERTE", niveau: "AVANCE", format: "DISTANCE" } as const;
  it("accepte une compétence offerte avec preuve", () => {
    expect(declarationSchema.safeParse({ ...base, preuveUrl: "https://github.com/amina-k" }).success).toBe(true);
  });
  it("accepte une preuve vide", () => {
    expect(declarationSchema.safeParse({ ...base, preuveUrl: "" }).success).toBe(true);
  });
  it("refuse une preuve qui n'est pas un lien web", () => {
    expect(declarationSchema.safeParse({ ...base, preuveUrl: "javascript:alert(1)" }).success).toBe(false);
  });
  it("refuse une preuve sur une compétence recherchée", () => {
    expect(declarationSchema.safeParse({ ...base, sens: "RECHERCHEE", preuveUrl: "https://exemple.cm/a" }).success).toBe(false);
  });
});

describe("propositionSchema (RG16, RG20)", () => {
  const base = { creneauId: "c1", contrepartie: "TROC" as const };
  it("exige un lieu en présentiel", () => {
    const r = propositionSchema.safeParse({ ...base, format: "PRESENTIEL" });
    expect(r.success).toBe(false);
    expect(!r.success && r.error.issues[0].message).toBe("errors.lieu");
  });
  it("accepte un présentiel avec lieu public", () => {
    expect(propositionSchema.safeParse({ ...base, format: "PRESENTIEL", lieuType: "PUBLIC" }).success).toBe(true);
  });
  it("refuse un lieu pour une session à distance", () => {
    const r = propositionSchema.safeParse({ ...base, format: "DISTANCE", lieuType: "PUBLIC" });
    expect(r.success).toBe(false);
    expect(!r.success && r.error.issues[0].message).toBe("errors.lieuDistance");
  });
  it("exige une contrepartie", () => {
    expect(propositionSchema.safeParse({ creneauId: "c1", format: "DISTANCE" }).success).toBe(false);
  });
});

describe("messageSchema et estConfirmee", () => {
  it("refuse un message vide ou trop long", () => {
    expect(messageSchema.safeParse({ texte: "   " }).success).toBe(false);
    expect(messageSchema.safeParse({ texte: "a".repeat(1001) }).success).toBe(false);
    expect(messageSchema.safeParse({ texte: "Bonjour" }).success).toBe(true);
  });
  it("applique les seuils de RG21", () => {
    expect(estConfirmee(3, 4)).toBe(true);
    expect(estConfirmee(2, 5)).toBe(false);
    expect(estConfirmee(10, 3.9)).toBe(false);
  });
});

describe("avisSchema (RG11) et signalementSchema", () => {
  it("accepte une note de 1 à 5, même reçue en texte", () => {
    expect(avisSchema.parse({ note: "4" }).note).toBe(4);
  });
  it("refuse une note absente ou hors bornes", () => {
    expect(avisSchema.safeParse({ note: "0" }).success).toBe(false);
    expect(avisSchema.safeParse({ note: "6" }).success).toBe(false);
    expect(avisSchema.safeParse({}).success).toBe(false);
  });
  it("exige un motif connu", () => {
    expect(signalementSchema.safeParse({ motif: "SPAM" }).success).toBe(true);
    expect(signalementSchema.safeParse({ motif: "N_IMPORTE_QUOI" }).success).toBe(false);
  });
});
