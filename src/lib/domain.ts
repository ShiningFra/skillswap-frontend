/**
 * Types du domaine, dérivés du schéma PostgreSQL (skillswap_schema.sql).
 * Chaque liste reprend le CHECK de la colonne correspondante : si le SQL change, ce fichier aussi.
 */

export const MODES_LOCALISATION = ["AUCUNE", "MANUELLE", "AUTOMATIQUE"] as const; // utilisateur.mode_localisation
export const SENS_COMPETENCE = ["OFFERTE", "RECHERCHEE"] as const; // declaration_competence.sens
export const NIVEAUX = ["DEBUTANT", "INTERMEDIAIRE", "AVANCE"] as const; // declaration_competence.niveau
export const FORMATS = ["PRESENTIEL", "DISTANCE", "LES_DEUX"] as const; // format (compétence, créneau, session)
export const TYPES_LIEU = ["PUBLIC", "ESPACE_PARTAGE", "DOMICILE"] as const; // session_echange.lieu_type (RG20)
export const CONTREPARTIES = ["TROC", "ARGENT_HORS_PLATEFORME", "GRATUIT"] as const; // session_echange.contrepartie (RG16)
export const STATUTS_SESSION = [
  "PROPOSEE",
  "ACCEPTEE",
  "REFUSEE",
  "EXPIREE",
  "ANNULEE",
  "REALISEE",
  "NON_REALISEE",
] as const;

export type ModeLocalisation = (typeof MODES_LOCALISATION)[number];
export type SensCompetence = (typeof SENS_COMPETENCE)[number];
export type Niveau = (typeof NIVEAUX)[number];
export type Format = (typeof FORMATS)[number];
export type TypeLieu = (typeof TYPES_LIEU)[number];
export type Contrepartie = (typeof CONTREPARTIES)[number];
export type StatutSession = (typeof STATUTS_SESSION)[number];

/** Seuils de la règle RG21 (compétence confirmée par l'usage), identiques à la vue SQL v_competence_confirmee. */
export const CONFIRMATION = { sessionsMin: 3, noteMoyenneMin: 4 } as const;

/** Limites de la règle RG17 (code SMS), identiques au schéma. */
export const CODE_SMS = { longueur: 6, validiteMinutes: 10, essaisMax: 5 } as const;

export interface Categorie {
  id: string;
  libelle: string;
}

export interface Competence {
  id: string;
  libelle: string;
  categorieId: string;
  /** Nom de la catégorie, pour « Informatique, code · À distance ». */
  categorie?: string;
  /** Autres noms de la compétence, séparés par des points-virgules (« maths;algèbre »), utilisés par la recherche. */
  synonymes?: string;
}

export interface DeclarationCompetence {
  competenceId: string;
  sens: SensCompetence;
  niveau: Niveau;
  format: Format;
  description?: string;
  /** RG18 : lien vers une réalisation, seulement pour une compétence offerte. */
  preuveUrl?: string;
}

/** RG21 : une compétence offerte est « confirmée » à partir de 3 sessions notées 4 sur 5 en moyenne. */
export function estConfirmee(sessionsNotees: number, noteMoyenne: number): boolean {
  return sessionsNotees >= CONFIRMATION.sessionsMin && noteMoyenne >= CONFIRMATION.noteMoyenneMin;
}

/** Compétence offerte telle qu'elle apparaît sur le profil d'un autre membre. */
export interface CompetenceOfferte {
  competenceId: string;
  niveau: Niveau;
  format: Format;
  preuveUrl?: string;
  /** Vrai quand une preuve existe, même si le lien n'est connu que sur le profil complet (fiche de recherche). */
  preuveFournie?: boolean;
  sessionsNotees: number;
  noteMoyenne: number;
}

export interface Avis {
  auteur: string;
  note: 1 | 2 | 3 | 4 | 5;
  commentaire: string;
}

export interface Creneau {
  id: string;
  /** Date lisible, déjà formatée par le serveur (fuseau du membre). */
  libelle: string;
  format: Format;
}

/**
 * Profil public d'un membre. Il ne contient jamais le téléphone, l'e-mail ni les coordonnées :
 * seule une distance arrondie est exposée (RG4, ES8, ES9).
 */
export interface ProfilMembre {
  id: string;
  pseudo: string;
  ville?: string;
  distanceKm?: number;
  telephoneVerifie: boolean;
  noteMoyenne?: number;
  nbAvis: number;
  offertes: CompetenceOfferte[];
  recherchees: string[];
  avis: Avis[];
  creneaux: Creneau[];
}

export interface Message {
  id: string;
  deMoi: boolean;
  texte: string;
}

export interface ResumeConversation {
  id: string;
  membre: Pick<ProfilMembre, "id" | "pseudo">;
  dernierMessage: string;
  /** Messages reçus pas encore lus dans cette conversation. */
  nonLus?: number;
}

/** signalement.motif (ck_signalement_motif). */
export const MOTIFS_SIGNALEMENT = ["FAUX_PROFIL", "COMPORTEMENT_INAPPROPRIE", "SPAM", "AUTRE"] as const;
export type MotifSignalement = (typeof MOTIFS_SIGNALEMENT)[number];

/** Session vue par le membre connecté. */
export interface SessionEchange {
  id: string;
  membre: Pick<ProfilMembre, "id" | "pseudo">;
  competenceId: string;
  creneauLibelle: string;
  /** Instant de la session (ISO). Absent en mode simulé, où l'heure est supposée passée. */
  dateHeure?: string;
  format: "PRESENTIEL" | "DISTANCE";
  lieuType?: TypeLieu;
  /** Lien de visioconférence d'une session à distance acceptée, saisi librement par l'un des deux membres. */
  lien?: string;
  contrepartie: Contrepartie;
  statut: StatutSession;
  proposeParMoi: boolean;
  mesConfirmation: boolean;
  saConfirmation: boolean;
  /** RG19 : qui ne s'est pas présenté, pour une session NON_REALISEE. */
  absent?: "moi" | "autre";
  /** RG11 : un seul avis par auteur et par session. */
  avisDonne: boolean;
}

export type TypeNotification = "NOUVEAU_MESSAGE" | "NOUVELLE_SUGGESTION" | "SESSION_PROPOSEE" | "SESSION_ACCEPTEE" | "SESSION_REFUSEE" | "RAPPEL_AVIS" | "AVERTISSEMENT_ABSENCE" | "SUSPENSION" | "AVERTISSEMENT" | "LIEN_SESSION";

export interface Notification {
  id: string;
  type: TypeNotification;
  contenu: string;
  creeLe: string;
  lue: boolean;
  /** Chemin de l'écran concerné (conversation, session), fourni par le serveur. */
  lien?: string | null;
}

/** Écran d'administration. */
export interface IndicateursAdmin {
  sessionsRealisees30j: number;
  conversations30j: number;
  tauxConcretisation: number | null;
  competencesOffertes: number;
  competencesConfirmees: number;
  signalementsOuverts: number;
}
export interface SignalementAdmin {
  id: string;
  motif: MotifSignalement;
  gravite: "HAUTE" | "MOYENNE" | "BASSE";
  statut: "OUVERT" | "EN_COURS";
  creeLe: string;
  ciblePseudo: string;
  nbSignaleurs: number;
}
export interface SignalementAdminDetail {
  id: string;
  motif: MotifSignalement;
  description: string | null;
  creeLe: string;
  ciblePseudo: string;
  cibleStatut: "ACTIF" | "SUSPENDU";
  auteurPseudo: string;
  historique: { sessionsRealisees: number; absences: number; signalementsRecus: number; signaleursDistincts: number; noteMoyenne: number | null };
}
export type DecisionModeration = "AVERTIR" | "SUSPENDRE" | "REJETER";

/** Fonctionnalités que l'administration peut mettre « en révision » (même liste que l'API). */
export const CLES_PARAMETRES = [
  "verification_telephone",
  "inscriptions",
  "propositions_competences",
  "recherche_semantique",
  "sessions_distance",
  "notifications_push",
] as const;
export type CleParametre = (typeof CLES_PARAMETRES)[number];

export interface Parametre {
  cle: CleParametre;
  actif: boolean;
  /** Message affiché aux membres quand la fonctionnalité est en révision (optionnel). */
  message: string | null;
  modifieLe?: string;
}
