import { describe, expect, it } from "vitest";
import type { Competence } from "./domain";
import { classer, fusionner } from "./recherche-floue";

const c = (id: string, libelle: string, synonymes = "", categorie = "Autre"): Competence => ({ id, libelle, synonymes, categorie, categorieId: "k" });
const liste = [
  c("m", "Mathématiques", "maths;algèbre;géométrie", "Soutien scolaire"),
  c("p", "Python", "programmation;code"),
  c("pt", "Pâtisserie", "gâteau;cake", "Cuisine et pâtisserie"),
  c("cc", "Cuisine camerounaise", "ndolé;poulet dg", "Cuisine et pâtisserie"),
  c("a", "Anglais", "english"),
  c("ph", "Photographie", "photo"),
];
const premier = (t: string) => classer(t, liste)[0]?.competence.id;

describe("recherche floue", () => {
  it("trouve par synonyme et par abréviation", () => {
    expect(premier("maths")).toBe("m");
    expect(premier("ndole")).toBe("cc");
    expect(premier("english")).toBe("a");
  });
  it("ignore accents et casse", () => {
    expect(premier("PATISSERIE")).toBe("pt");
    expect(premier("mathematiques")).toBe("m");
  });
  it("tolère les fautes de frappe", () => {
    expect(premier("pyhton")).toBe("p");
    expect(premier("anglias")).toBe("a");
    expect(premier("photograpie")).toBe("ph");
  });
  it("trouve par début de mot et par catégorie", () => {
    expect(premier("cuis")).toBe("cc");
    expect(classer("cuisine", liste).map((r) => r.competence.id)).toContain("pt");
  });
  it("ne renvoie rien d'absurde", () => {
    expect(classer("xqzw", liste)).toEqual([]);
    expect(classer("  ", liste)).toEqual([]);
  });
  it("ajoute les voisines par le sens après les correspondances de texte, sans doublon", () => {
    const flous = classer("patisserie", liste);
    const r = fusionner(flous, [{ id: "pt" }, { id: "cc" }, { id: "inconnu" }], liste);
    expect(r.map((x) => x.competence.id)).toEqual(["pt", "cc"]);
    expect(fusionner([], [{ id: "a" }], liste)[0].competence.id).toBe("a");
  });
});
