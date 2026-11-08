import type { Competence } from "./domain";
import { normaliser } from "./format";

/** Sans accents ni ponctuation : « Pâtisserie, gâteaux » → « patisserie gateaux ». */
const nettoyer = (s: string) => normaliser(s).replace(/[^a-z0-9]+/g, " ").trim();
const mots = (s: string) => nettoyer(s).split(" ").filter(Boolean);

/** Distance de Damerau-Levenshtein (une inversion de deux lettres compte pour une faute), bornée par `max`. */
export function distance(a: string, b: string, max = 3): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const d: number[][] = [];
  for (let i = 0; i <= a.length; i++) {
    d[i] = [i];
    for (let j = 1; j <= b.length; j++) {
      if (i === 0) {
        d[i][j] = j;
        continue;
      }
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}

/** Fautes tolérées selon la longueur du mot tapé : aucune sous 4 lettres, une jusqu'à 6, deux au-delà. */
const tolerance = (n: number) => (n < 4 ? 0 : n <= 6 ? 1 : 2);

/** Note d'un mot tapé face à un mot du catalogue : 100 identique, 80 début de mot, 60 contenu, 40-50 faute de frappe. */
function noteMot(q: string, m: string): number {
  if (q === m) return 100;
  if (m.startsWith(q) && q.length >= 2) return 80;
  if (q.length >= 3 && m.includes(q)) return 60;
  const tol = tolerance(q.length);
  if (tol > 0) {
    const d = distance(q, m, tol);
    if (d <= tol) return 50 - 5 * d;
    if (m.length > q.length) {
      const dp = distance(q, m.slice(0, q.length), tol);
      if (dp <= tol) return 40 - 5 * dp;
    }
  }
  return 0;
}

export interface Proche {
  competence: Competence;
  /** 0 à 100 : plus c'est haut, plus c'est proche. */
  score: number;
}

/**
 * Classe le catalogue par proximité avec le texte tapé : libellé, synonymes (« maths » → Mathématiques),
 * catégorie, avec tolérance aux accents, à la casse et aux fautes de frappe. Chaque mot tapé doit trouver un écho.
 */
export function classer(terme: string, liste: Competence[], limite = 8): Proche[] {
  const qs = mots(terme);
  if (qs.length === 0) return [];
  const brut = nettoyer(terme);
  const resultats: Proche[] = [];
  for (const c of liste) {
    const libelle = nettoyer(c.libelle);
    const synonymes = (c.synonymes ?? "").split(";").map(nettoyer).filter(Boolean);
    let score = 0;
    if (libelle === brut) score = 110;
    else if (synonymes.includes(brut)) score = 100;
    else {
      const motsLib = libelle.split(" ");
      const motsSyn = synonymes.flatMap((s) => s.split(" "));
      const motsCat = mots(c.categorie ?? "");
      let total = 0;
      let ok = true;
      for (const q of qs) {
        const n = Math.max(
          ...motsLib.map((m) => noteMot(q, m)),
          ...motsSyn.map((m) => noteMot(q, m) - 10),
          ...motsCat.map((m) => noteMot(q, m) - 45),
          0,
        );
        if (n <= 0) {
          ok = false;
          break;
        }
        total += n;
      }
      if (ok) score = total / qs.length;
      if (ok && libelle.startsWith(brut)) score += 10;
    }
    if (score > 0) resultats.push({ competence: c, score });
  }
  return resultats.sort((a, b) => b.score - a.score || a.competence.libelle.localeCompare(b.competence.libelle, "fr")).slice(0, limite);
}

/**
 * Résultats de la recherche tolérante, complétés par les voisines « par le sens » (« faire des gâteaux » → Pâtisserie)
 * que seul le serveur sait trouver. Une correspondance de texte passe toujours devant une voisine sémantique.
 */
export function fusionner(flous: Proche[], sens: { id: string }[], liste: Competence[], limite = 8): Proche[] {
  const vus = new Set(flous.map((r) => r.competence.id));
  const extras: Proche[] = [];
  sens.forEach((v, rang) => {
    const c = liste.find((x) => x.id === v.id);
    if (c && !vus.has(c.id)) extras.push({ competence: c, score: 55 - rang });
  });
  return [...flous, ...extras].slice(0, limite);
}
