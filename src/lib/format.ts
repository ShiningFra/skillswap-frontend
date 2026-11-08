import type { CompetenceOfferte, ProfilMembre } from "./domain";
import { estConfirmee } from "./domain";

export const normaliser = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

/** Prénom d'un pseudo, pour « Écrire à Kevin ». */
export const prenom = (pseudo: string) => pseudo.trim().split(/\s+/)[0] ?? pseudo;

export type Badge = "confirmee" | "preuve" | "declarative";

/** Un seul badge sur une fiche : confirmée (RG21), sinon preuve fournie (RG18), sinon déclarative. */
export function badgeCompetence(o: CompetenceOfferte): Badge {
  if (estConfirmee(o.sessionsNotees, o.noteMoyenne)) return "confirmee";
  return o.preuveFournie ?? Boolean(o.preuveUrl) ? "preuve" : "declarative";
}

/** L'offre mise en avant : celle de la compétence demandée, sinon la première ; absente pour qui ne fait que chercher. */
export const offreCorrespondante = (p: ProfilMembre, competenceId?: string): CompetenceOfferte | undefined =>
  p.offertes.find((o) => !competenceId || o.competenceId === competenceId) ?? p.offertes[0];

/** « Il y a 2 h », « Hier », puis le jour de la semaine, puis la date. */
export function ilYa(iso: string, maintenant = Date.now()): string {
  const ecart = Math.max(0, maintenant - new Date(iso).getTime());
  const h = Math.floor(ecart / 3_600_000);
  if (ecart < 60_000) return "À l'instant";
  if (h < 1) return `Il y a ${Math.floor(ecart / 60_000)} min`;
  if (h < 24) return `Il y a ${h} h`;
  const j = Math.floor(h / 24);
  if (j === 1) return "Hier";
  if (j < 7) return new Intl.DateTimeFormat("fr-FR", { weekday: "long" }).format(new Date(iso)).replace(/^./, (c) => c.toUpperCase());
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(new Date(iso));
}
