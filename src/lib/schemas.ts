import { z } from "zod";
import {
  CODE_SMS,
  CONTREPARTIES,
  FORMATS,
  MOTIFS_SIGNALEMENT,
  NIVEAUX,
  SENS_COMPETENCE,
  TYPES_LIEU,
  OPERATEURS,
  PORTEFEUILLE,
} from "./domain";

/**
 * Schémas de validation des formulaires. Les messages d'erreur sont des clés de traduction
 * (fichier messages/fr.json, section « errors »), jamais du texte en dur.
 */

/** Numéro au format international sans séparateur, comme le CHECK ck_utilisateur_tel. */
export const TELEPHONE = /^\+[0-9]{8,15}$/;

export const inscriptionSchema = z.object({
  email: z.email({ error: "errors.email" }),
  pseudo: z
    .string()
    .trim()
    .min(2, { error: "errors.pseudo" })
    .max(40, { error: "errors.pseudo" })
    .regex(/^[\p{L}\p{N}][\p{L}\p{N} ._'’-]*$/u, { error: "errors.pseudo" }),
  motDePasse: z
    .string()
    .min(10, { error: "errors.motDePasse" })
    .max(128, { error: "errors.motDePasse" }),
  // RG1 : majorité confirmée et CGU acceptées, sinon pas de compte.
  majeur: z.literal(true, { error: "errors.majeur" }),
  cgu: z.literal(true, { error: "errors.cgu" }),
});
export type InscriptionValues = z.infer<typeof inscriptionSchema>;

export const telephoneSchema = z.object({
  telephone: z.string().trim().regex(TELEPHONE, { error: "errors.telephone" }),
});
export type TelephoneValues = z.infer<typeof telephoneSchema>;

export const codeSmsSchema = z.object({
  code: z
    .string()
    .regex(new RegExp(`^[0-9]{${CODE_SMS.longueur}}$`), {
      error: "errors.code",
    }),
});
export type CodeSmsValues = z.infer<typeof codeSmsSchema>;

/**
 * RG5 : des coordonnées n'existent qu'en mode AUTOMATIQUE, avec un consentement actif ;
 * le mode MANUELLE exige une ville.
 */
export const localisationSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("AUCUNE") }),
  z.object({
    mode: z.literal("MANUELLE"),
    ville: z
      .string()
      .trim()
      .min(2, { error: "errors.ville" })
      .max(80, { error: "errors.ville" }),
  }),
  z.object({
    mode: z.literal("AUTOMATIQUE"),
    consentement: z.literal(true, { error: "errors.consentement" }),
  }),
]);
export type LocalisationValues = z.infer<typeof localisationSchema>;

/** Lien de preuve (RG18) : http ou https uniquement, jamais « javascript: ». */
const lienWeb = z
  .string()
  .trim()
  .max(500, { error: "errors.lien" })
  .refine((v) => /^https?:\/\/\S+$/i.test(v), { error: "errors.lien" });

export const declarationSchema = z
  .object({
    competenceId: z.string().min(1, { error: "errors.competence" }),
    sens: z.enum(SENS_COMPETENCE),
    niveau: z.enum(NIVEAUX),
    format: z.enum(FORMATS),
    description: z.string().trim().max(500).optional(),
    preuveUrl: z.union([lienWeb, z.literal("")]).optional(),
  })
  // RG18 : une preuve n'a de sens que sur une compétence offerte.
  .refine((v) => !v.preuveUrl || v.sens === "OFFERTE", {
    error: "errors.preuveSeulementOfferte",
    path: ["preuveUrl"],
  });
export type DeclarationValues = z.infer<typeof declarationSchema>;

export const messageSchema = z.object({
  texte: z
    .string()
    .trim()
    .min(1, { error: "errors.message" })
    .max(1000, { error: "errors.message" }),
});
export type MessageValues = z.infer<typeof messageSchema>;

/**
 * Proposition de session. RG20 : un lieu n'a de sens qu'en présentiel, et il est obligatoire alors ;
 * RG16 : la contrepartie est toujours choisie.
 */
export const propositionSchema = z
  .object({
    creneauId: z.string().min(1, { error: "errors.creneau" }),
    /** Obligatoire seulement quand l'autre membre offre plusieurs compétences (RG8) : l'écran la demande alors. */
    competenceId: z.string().optional(),
    format: z.enum(["PRESENTIEL", "DISTANCE"]),
    lieuType: z.enum(TYPES_LIEU).optional(),
    contrepartie: z.enum(CONTREPARTIES, { error: "errors.contrepartie" }),
    /** FCFA entiers, exigé (et seulement alors) pour une session payée sur la plateforme. */
    prix: z
      .number({ error: "errors.prix" })
      .int({ error: "errors.prix" })
      .min(PORTEFEUILLE.prixMin, { error: "errors.prix" })
      .max(PORTEFEUILLE.prixMax, { error: "errors.prix" })
      .optional(),
  })
  .superRefine((v, ctx) => {
    if ((v.contrepartie === "ARGENT_PLATEFORME") !== (v.prix !== undefined))
      ctx.addIssue({ code: "custom", path: ["prix"], message: "errors.prix" });
    if (v.format === "PRESENTIEL" && !v.lieuType)
      ctx.addIssue({
        code: "custom",
        path: ["lieuType"],
        message: "errors.lieu",
      });
    if (v.format === "DISTANCE" && v.lieuType)
      ctx.addIssue({
        code: "custom",
        path: ["lieuType"],
        message: "errors.lieuDistance",
      });
  });
export type PropositionValues = z.infer<typeof propositionSchema>;

/** Avis (RG11) : note de 1 à 5, commentaire facultatif. La note arrive en texte depuis un champ radio. */
export const avisSchema = z.object({
  note: z.coerce
    .number({ error: "errors.note" })
    .int({ error: "errors.note" })
    .min(1, { error: "errors.note" })
    .max(5, { error: "errors.note" }),
  commentaire: z
    .string()
    .trim()
    .max(500, { error: "errors.commentaire" })
    .optional(),
});
export type AvisValues = z.input<typeof avisSchema>;
export type AvisSortie = z.output<typeof avisSchema>;

export const signalementSchema = z.object({
  motif: z.enum(MOTIFS_SIGNALEMENT, { error: "errors.motif" }),
  description: z
    .string()
    .trim()
    .max(500, { error: "errors.commentaire" })
    .optional(),
});
export type SignalementValues = z.infer<typeof signalementSchema>;

/** Modification du profil. La ville ne s'applique qu'en localisation manuelle (le serveur l'ignore sinon). */
export const profilSchema = z.object({
  pseudo: z
    .string()
    .trim()
    .min(2, { error: "errors.pseudo" })
    .max(40, { error: "errors.pseudo" })
    .regex(/^[\p{L}\p{N}][\p{L}\p{N} ._'’-]*$/u, { error: "errors.pseudo" }),
  bio: z.string().trim().max(500, { error: "errors.bio" }).optional(),
  ville: z.string().trim().max(80, { error: "errors.ville" }).optional(),
});
export type ProfilValues = z.infer<typeof profilSchema>;

export const motDePasseSchema = z
  .object({
    actuel: z.string().min(1, { error: "errors.invalide" }),
    nouveau: z
      .string()
      .min(10, { error: "errors.motDePasse" })
      .max(128, { error: "errors.motDePasse" }),
    confirmation: z.string(),
  })
  .refine((v) => v.nouveau === v.confirmation, {
    error: "errors.confirmation",
    path: ["confirmation"],
  });
export type MotDePasseValues = z.infer<typeof motDePasseSchema>;

/** Créneau saisi dans l'heure locale du Cameroun (UTC+1, sans heure d'été). */
export const creneauSchema = z
  .object({
    date: z.string().min(1, { error: "errors.creneau" }),
    debut: z.string().min(1, { error: "errors.creneau" }),
    fin: z.string().min(1, { error: "errors.creneau" }),
    format: z.enum(FORMATS),
  })
  .refine((v) => v.fin > v.debut, { error: "errors.creneauFin", path: ["fin"] })
  .refine((v) => new Date(`${v.date}T${v.debut}:00+01:00`) > new Date(), {
    error: "errors.creneauPasse",
    path: ["date"],
  });
export type CreneauValues = z.infer<typeof creneauSchema>;

export const modificationCompetenceSchema = z.object({
  niveau: z.enum(NIVEAUX),
  format: z.enum(FORMATS),
  preuveUrl: z.union([lienWeb, z.literal("")]).optional(),
});
export type ModificationCompetenceValues = z.infer<
  typeof modificationCompetenceSchema
>;

export const emailSchema = z.object({
  email: z.email({ error: "errors.email" }).max(254, { error: "errors.email" }),
});
export type EmailValues = z.infer<typeof emailSchema>;

export const reinitialisationSchema = z
  .object({
    nouveau: z
      .string()
      .min(10, { error: "errors.motDePasse" })
      .max(128, { error: "errors.motDePasse" }),
    confirmation: z.string(),
  })
  .refine((v) => v.nouveau === v.confirmation, {
    error: "errors.confirmation",
    path: ["confirmation"],
  });
export type ReinitialisationValues = z.infer<typeof reinitialisationSchema>;

const montant = (min: number, max: number) =>
  z.number({ error: "errors.montant" }).int({ error: "errors.montant" }).min(min, { error: "errors.montant" }).max(max, { error: "errors.montant" });
/** Numéro Mobile Money camerounais : 9 chiffres commençant par 6, avec ou sans +237. */
const numero = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s.-]/g, "").replace(/^(\+|00)?237/, ""))
  .pipe(z.string().regex(/^6\d{8}$/, { error: "errors.numero" }));

export const rechargeSchema = z.object({
  montant: montant(PORTEFEUILLE.rechargeMin, PORTEFEUILLE.rechargeMax),
  operateur: z.enum(OPERATEURS, { error: "errors.invalide" }),
  numero,
});
export type RechargeValues = z.input<typeof rechargeSchema>;
export type RechargeSortie = z.output<typeof rechargeSchema>;

export const retraitSchema = rechargeSchema.extend({
  montant: montant(PORTEFEUILLE.retraitMin, PORTEFEUILLE.soldeMax),
  motDePasse: z.string().min(1, { error: "errors.invalide" }),
});
export type RetraitValues = z.input<typeof retraitSchema>;
export type RetraitSortie = z.output<typeof retraitSchema>;
