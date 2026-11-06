/**
 * Accès aux données. Deux modes, choisis à la compilation :
 *  - réel : NEXT_PUBLIC_API_URL est défini (ex. http://localhost:3001), les appels vont à l'API NestJS
 *    avec le cookie de session (comptes, téléphone, localisation, compétences) ;
 *  - simulé : sinon, tout reste en mémoire.
 * En mode réel, recherche, profils, conversations, sessions, avis et signalements passent aussi par l'API.
 * Les erreurs portent une clé de traduction (section « errors » de messages/fr.json).
 */
import { CONFIRMATION } from "./domain";
import type {
  DecisionModeration,
  IndicateursAdmin,
  SignalementAdmin,
  SignalementAdminDetail,
  Notification,
  Categorie,
  Competence,
  CompetenceOfferte,
  DeclarationCompetence,
  Format,
  Message,
  ProfilMembre,
  ResumeConversation,
  SessionEchange,
} from "./domain";
import type {
  CreneauValues,
  DeclarationValues,
  InscriptionValues,
  ModificationCompetenceValues,
  MotDePasseValues,
  ProfilValues,
  AvisSortie,
  LocalisationValues,
  MessageValues,
  PropositionValues,
  SignalementValues,
} from "./schemas";

export class ApiError extends Error {
  constructor(public cle: string) {
    super(cle);
  }
}

const API = process.env.NEXT_PUBLIC_API_URL;
export const MODE_REEL = Boolean(API);

const PAGES_PUBLIQUES = [
  "/",
  "/connexion",
  "/inscription",
  "/mot-de-passe-oublie",
  "/reinitialisation",
];

/** Session absente, expirée ou fermée ailleurs : retour à la connexion, sauf sur les pages publiques. */
function retourConnexion() {
  if (
    typeof window === "undefined" ||
    PAGES_PUBLIQUES.includes(window.location.pathname)
  )
    return;
  window.location.assign("/connexion");
}

async function appel<T>(
  methode: "GET" | "POST" | "PUT" | "DELETE",
  chemin: string,
  corps?: unknown,
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API}${chemin}`, {
      method: methode,
      credentials: "include",
      headers:
        corps === undefined
          ? undefined
          : { "Content-Type": "application/json" },
      body: corps === undefined ? undefined : JSON.stringify(corps),
    });
  } catch {
    throw new ApiError("errors.reseau");
  }
  if (res.status === 204) return undefined as T;
  const data = (await res.json().catch(() => null)) as { cle?: string } | null;
  if (res.status === 401 && data?.cle === "errors.nonConnecte")
    retourConnexion();
  if (
    res.status === 403 &&
    data?.cle === "errors.mdpProvisoire" &&
    typeof window !== "undefined" &&
    window.location.pathname !== "/compte/mot-de-passe"
  )
    window.location.assign("/compte/mot-de-passe");
  if (!res.ok) throw new ApiError(data?.cle ?? "errors.generique");
  return data as T;
}

/** Position du navigateur, demandée seulement après le consentement explicite (RG5). */
function positionNavigateur(): Promise<{
  latitude: number;
  longitude: number;
}> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation)
      return reject(new ApiError("errors.positionRefusee"));
    navigator.geolocation.getCurrentPosition(
      (p) =>
        resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
      () => reject(new ApiError("errors.positionRefusee")),
      { timeout: 15000 },
    );
  });
}

const pause = (ms = 350) => new Promise((r) => setTimeout(r, ms));

/** Code accepté par la simulation. Le vrai code est envoyé par SMS et stocké haché côté serveur (RG17). */
export const CODE_DE_TEST = "123456";

export const CATEGORIES: Categorie[] = [
  { id: "cat-info", libelle: "Informatique, code, bureautique" },
  { id: "cat-cuisine", libelle: "Cuisine et pâtisserie" },
  { id: "cat-langues", libelle: "Langues" },
  { id: "cat-design", libelle: "Design, photo, vidéo" },
];

export const COMPETENCES: Competence[] = [
  { id: "comp-python", libelle: "Python", categorieId: "cat-info" },
  {
    id: "comp-cuisine-cm",
    libelle: "Cuisine camerounaise",
    categorieId: "cat-cuisine",
  },
  { id: "comp-anglais", libelle: "Anglais", categorieId: "cat-langues" },
  { id: "comp-photo", libelle: "Photographie", categorieId: "cat-design" },
];

const etat = {
  emails: new Set<string>(),
  /** RG17 : sans numéro vérifié, pas de conversation ni de session. */
  telephoneVerifie: false,
  declarations: [
    {
      competenceId: "comp-python",
      sens: "OFFERTE",
      niveau: "AVANCE",
      format: "DISTANCE",
      preuveUrl: "https://github.com/amina-k",
    },
    {
      competenceId: "comp-anglais",
      sens: "RECHERCHEE",
      niveau: "DEBUTANT",
      format: "LES_DEUX",
    },
  ] as DeclarationCompetence[],
};

export async function inscrire(
  valeurs: InscriptionValues,
): Promise<{ id: string }> {
  if (MODE_REEL) return appel("POST", "/auth/inscription", valeurs);
  await pause();
  const cle = valeurs.email.toLowerCase();
  if (etat.emails.has(cle)) throw new ApiError("errors.emailPris");
  etat.emails.add(cle);
  return { id: crypto.randomUUID() };
}

export async function connecter(valeurs: {
  email: string;
  motDePasse: string;
}): Promise<{ id: string }> {
  if (MODE_REEL) return appel("POST", "/auth/connexion", valeurs);
  await pause();
  if (!etat.emails.has(valeurs.email.toLowerCase()))
    throw new ApiError("errors.identifiants");
  return { id: crypto.randomUUID() };
}

export async function demanderCodeSms(telephone: string): Promise<void> {
  if (MODE_REEL) return appel("POST", "/telephone/code", { telephone });
  void telephone;
  await pause();
}

export async function verifierCodeSms(code: string): Promise<void> {
  if (MODE_REEL) {
    await appel("POST", "/telephone/verifier", { code });
    return;
  }
  await pause();
  if (code !== CODE_DE_TEST) throw new ApiError("errors.codeFaux");
  etat.telephoneVerifie = true;
}

export async function definirLocalisation(
  valeurs: LocalisationValues,
): Promise<void> {
  if (MODE_REEL) {
    // RG5 : la position n'est lue qu'après le consentement ; l'API ne la renvoie jamais.
    const corps =
      valeurs.mode === "AUTOMATIQUE"
        ? { ...valeurs, ...(await positionNavigateur()) }
        : valeurs;
    return appel("PUT", "/moi/localisation", corps);
  }
  void valeurs;
  await pause();
}

/** Catalogue de compétences : celui de l'API en mode réel, sinon la liste simulée. */
export async function listerCompetences(): Promise<Competence[]> {
  if (MODE_REEL) return appel("GET", "/competences");
  await pause(100);
  return COMPETENCES.map((c) => ({
    ...c,
    categorie: CATEGORIES.find((k) => k.id === c.categorieId)?.libelle,
  }));
}

export async function listerDeclarations(): Promise<DeclarationCompetence[]> {
  if (MODE_REEL) {
    const lignes = await appel<
      (Omit<DeclarationCompetence, "description" | "preuveUrl"> & {
        description: string | null;
        preuveUrl: string | null;
      })[]
    >("GET", "/moi/competences");
    return lignes.map((d) => ({
      ...d,
      description: d.description ?? undefined,
      preuveUrl: d.preuveUrl ?? undefined,
    }));
  }
  await pause(150);
  return [...etat.declarations];
}

export async function declarerCompetence(
  valeurs: DeclarationValues,
): Promise<void> {
  if (MODE_REEL) {
    await appel("POST", "/moi/competences", valeurs);
    return;
  }
  await pause();
  // RG3 : une compétence est soit offerte, soit recherchée, une seule fois par membre.
  if (etat.declarations.some((d) => d.competenceId === valeurs.competenceId))
    throw new ApiError("errors.dejaDeclaree");
  etat.declarations.push({
    competenceId: valeurs.competenceId,
    sens: valeurs.sens,
    niveau: valeurs.niveau,
    format: valeurs.format,
    description: valeurs.description,
    preuveUrl: valeurs.preuveUrl || undefined,
  });
}

/* ------------------------------------------------------------------ */
/* Lot 2 : recherche, profils, conversations, propositions de session. */
/* ------------------------------------------------------------------ */

const PROFILS: ProfilMembre[] = [
  {
    id: "m-kevin",
    pseudo: "Kevin Mbarga",
    ville: "Yaoundé",
    distanceKm: 3,
    telephoneVerifie: true,
    noteMoyenne: 4.8,
    nbAvis: 12,
    offertes: [
      {
        competenceId: "comp-anglais",
        niveau: "AVANCE",
        format: "LES_DEUX",
        preuveUrl: "https://youtube.com/@kevin-english",
        sessionsNotees: 9,
        noteMoyenne: 4.8,
      },
    ],
    recherchees: ["comp-python"],
    avis: [
      {
        auteur: "Marie",
        note: 5,
        commentaire:
          "Patient, à l'heure, et les exercices étaient adaptés à mon niveau.",
      },
      {
        auteur: "Patrick",
        note: 4,
        commentaire:
          "Très bon échange de compétences, rendez-vous au café comme prévu.",
      },
    ],
    creneaux: [
      { id: "cr-1", libelle: "Sam. 7 nov., 10 h", format: "PRESENTIEL" },
      { id: "cr-2", libelle: "Mar. 10 nov., 18 h", format: "DISTANCE" },
      { id: "cr-3", libelle: "Jeu. 12 nov., 18 h", format: "LES_DEUX" },
    ],
  },
  {
    id: "m-mireille",
    pseudo: "Mireille Tchoua",
    ville: "Yaoundé",
    distanceKm: 6,
    telephoneVerifie: true,
    noteMoyenne: 4.5,
    nbAvis: 2,
    offertes: [
      {
        competenceId: "comp-cuisine-cm",
        niveau: "AVANCE",
        format: "PRESENTIEL",
        sessionsNotees: 2,
        noteMoyenne: 4.5,
      },
    ],
    recherchees: ["comp-photo"],
    avis: [
      {
        auteur: "Julie",
        note: 5,
        commentaire: "Le ndolé comme à la maison, merci !",
      },
    ],
    creneaux: [
      { id: "cr-4", libelle: "Dim. 8 nov., 15 h", format: "PRESENTIEL" },
    ],
  },
  {
    id: "m-aicha",
    pseudo: "Aïcha Bello",
    telephoneVerifie: false,
    nbAvis: 0,
    offertes: [
      {
        competenceId: "comp-python",
        niveau: "INTERMEDIAIRE",
        format: "DISTANCE",
        sessionsNotees: 0,
        noteMoyenne: 0,
      },
    ],
    recherchees: ["comp-anglais"],
    avis: [],
    creneaux: [
      { id: "cr-5", libelle: "Mer. 11 nov., 19 h", format: "DISTANCE" },
    ],
  },
  {
    id: "m-patrick",
    pseudo: "Patrick Essomba",
    ville: "Douala",
    distanceKm: 210,
    telephoneVerifie: true,
    noteMoyenne: 3.7,
    nbAvis: 4,
    offertes: [
      {
        competenceId: "comp-photo",
        niveau: "INTERMEDIAIRE",
        format: "LES_DEUX",
        preuveUrl: "https://exemple.com/patrick",
        sessionsNotees: 4,
        noteMoyenne: 3.7,
      },
      {
        competenceId: "comp-anglais",
        niveau: "INTERMEDIAIRE",
        format: "DISTANCE",
        sessionsNotees: 1,
        noteMoyenne: 5,
      },
    ],
    recherchees: [],
    avis: [],
    creneaux: [],
  },
];

export interface CritereRecherche {
  competenceId?: string;
  format?: Format;
}

/** Les formats se recoupent : « les deux » convient à une recherche présentiel comme à distance. */
const compatible = (offert: Format, voulu?: Format) =>
  !voulu || voulu === "LES_DEUX" || offert === "LES_DEUX" || offert === voulu;

interface ResultatRecherche {
  id: string;
  pseudo: string;
  ville?: string;
  distanceKm?: number;
  telephoneVerifie: boolean;
  noteMoyenne?: number;
  nbAvis: number;
  offres: {
    competenceId: string;
    niveau: CompetenceOfferte["niveau"];
    format: Format;
    preuveFournie: boolean;
    confirmee: boolean;
  }[];
  reciproques: string[];
}

/** La recherche renvoie une fiche courte ; on la présente comme un profil dont seule l'offre trouvée est connue. */
function depuisRecherche(r: ResultatRecherche): ProfilMembre {
  const { offres, reciproques, ...base } = r;
  return {
    ...base,
    offertes: offres.map((offre) => ({
      competenceId: offre.competenceId,
      niveau: offre.niveau,
      format: offre.format,
      // La fiche courte indique seulement qu'une preuve existe ; le lien est sur le profil complet.
      preuveUrl: undefined,
      preuveFournie: offre.preuveFournie,
      sessionsNotees: offre.confirmee ? CONFIRMATION.sessionsMin : 0,
      noteMoyenne: offre.confirmee ? CONFIRMATION.noteMoyenneMin : 0,
    })),
    // Seules les compétences qui se recoupent avec les miennes sont connues à ce stade.
    recherchees: reciproques,
    avis: [],
    creneaux: [],
  };
}

export async function rechercherProfils({
  competenceId,
  format,
}: CritereRecherche): Promise<ProfilMembre[]> {
  if (MODE_REEL) {
    const q = new URLSearchParams();
    if (competenceId) q.set("competenceId", competenceId);
    if (format) q.set("format", format);
    const res = await appel<ResultatRecherche[]>(
      "GET",
      `/profils${q.size ? `?${q}` : ""}`,
    );
    return res.map(depuisRecherche);
  }
  await pause(200);
  return PROFILS.filter((p) =>
    p.offertes.some(
      (o) =>
        (!competenceId || o.competenceId === competenceId) &&
        compatible(o.format, format),
    ),
  ).sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
}

export async function obtenirProfil(id: string): Promise<ProfilMembre> {
  if (MODE_REEL) return appel("GET", `/profils/${id}`);
  await pause(150);
  const p = PROFILS.find((x) => x.id === id);
  if (!p) throw new ApiError("errors.introuvable");
  return p;
}

export const IDS_PROFILS = PROFILS.map((p) => p.id);

interface ConversationInterne {
  id: string;
  membreId: string;
  messages: Message[];
}
const conversations: ConversationInterne[] = [];

export async function ouvrirConversation(
  membreId: string,
): Promise<{ id: string }> {
  if (MODE_REEL) return appel("POST", "/conversations", { membreId });
  await pause();
  if (!etat.telephoneVerifie) throw new ApiError("errors.telephoneRequis");
  if (!PROFILS.some((p) => p.id === membreId))
    throw new ApiError("errors.introuvable");
  const existante = conversations.find((c) => c.membreId === membreId);
  if (existante) return { id: existante.id };
  const c = { id: `conv-${membreId}`, membreId, messages: [] };
  conversations.push(c);
  return { id: c.id };
}

export async function listerConversations(): Promise<ResumeConversation[]> {
  if (MODE_REEL) return appel("GET", "/conversations");
  await pause(150);
  return conversations.map((c) => {
    const p = PROFILS.find((x) => x.id === c.membreId)!;
    return {
      id: c.id,
      membre: { id: p.id, pseudo: p.pseudo },
      dernierMessage: c.messages.at(-1)?.texte ?? "",
      nonLus: 0,
    };
  });
}

export async function lireConversation(
  id: string,
): Promise<{ membre: ProfilMembre; messages: Message[]; premierNonLu?: string | null }> {
  if (MODE_REEL) {
    const r = await appel<{
      membre: {
        id: string;
        pseudo: string;
        creneaux: ProfilMembre["creneaux"];
      };
      messages: Message[];
      premierNonLu: string | null;
    }>("GET", `/conversations/${id}`);
    // L'API ne renvoie ici que ce dont l'écran a besoin : pseudo et créneaux libres.
    return {
      membre: {
        telephoneVerifie: true,
        nbAvis: 0,
        offertes: [],
        recherchees: [],
        avis: [],
        ...r.membre,
      },
      messages: r.messages,
      premierNonLu: r.premierNonLu,
    };
  }
  await pause(150);
  const c = conversations.find((x) => x.id === id);
  if (!c) throw new ApiError("errors.introuvable");
  return {
    membre: PROFILS.find((p) => p.id === c.membreId)!,
    messages: [...c.messages],
  };
}

export async function envoyerMessage(
  conversationId: string,
  valeurs: MessageValues,
): Promise<void> {
  if (MODE_REEL) {
    await appel("POST", `/conversations/${conversationId}/messages`, valeurs);
    return;
  }
  await pause(150);
  const c = conversations.find((x) => x.id === conversationId);
  if (!c) throw new ApiError("errors.introuvable");
  c.messages.push({
    id: crypto.randomUUID(),
    deMoi: true,
    texte: valeurs.texte,
  });
}

const sessions: SessionEchange[] = [
  // Proposition reçue, à accepter ou refuser.
  {
    id: "s-mireille",
    membre: { id: "m-mireille", pseudo: "Mireille Tchoua" },
    competenceId: "comp-cuisine-cm",
    creneauLibelle: "Dim. 8 nov., 15 h",
    format: "PRESENTIEL",
    lieuType: "PUBLIC",
    contrepartie: "TROC",
    statut: "PROPOSEE",
    proposeParMoi: false,
    mesConfirmation: false,
    saConfirmation: false,
    avisDonne: false,
  },
  // Session acceptée dont l'heure est passée : l'autre membre a déjà confirmé.
  {
    id: "s-kevin",
    membre: { id: "m-kevin", pseudo: "Kevin Mbarga" },
    competenceId: "comp-anglais",
    creneauLibelle: "Sam. 31 oct., 10 h",
    format: "PRESENTIEL",
    lieuType: "PUBLIC",
    contrepartie: "TROC",
    statut: "ACCEPTEE",
    proposeParMoi: true,
    mesConfirmation: false,
    saConfirmation: true,
    avisDonne: false,
  },
];
export const IDS_SESSIONS = sessions.map((s) => s.id);
let compteurSessions = 0;

export async function proposerSession(
  conversationId: string,
  valeurs: PropositionValues,
): Promise<{ id: string }> {
  if (MODE_REEL) {
    // L'API choisit la compétence si l'autre membre n'en offre qu'une seule ; sinon l'écran la demande (competenceId).
    return appel("POST", `/conversations/${conversationId}/sessions`, valeurs);
  }
  await pause();
  if (!etat.telephoneVerifie) throw new ApiError("errors.telephoneRequis");
  const c = conversations.find((x) => x.id === conversationId);
  const p = c && PROFILS.find((x) => x.id === c.membreId);
  const creneau = p?.creneaux.find((cr) => cr.id === valeurs.creneauId);
  if (!p || !creneau) throw new ApiError("errors.creneau");
  const id = `s-nouv-${++compteurSessions}`;
  sessions.push({
    id,
    membre: { id: p.id, pseudo: p.pseudo },
    competenceId: valeurs.competenceId ?? p.offertes[0].competenceId,
    creneauLibelle: creneau.libelle,
    format: valeurs.format,
    lieuType: valeurs.lieuType,
    contrepartie: valeurs.contrepartie,
    statut: "PROPOSEE",
    proposeParMoi: true,
    mesConfirmation: false,
    saConfirmation: false,
    avisDonne: false,
  });
  return { id };
}

const session = (id: string) => {
  const s = sessions.find((x) => x.id === id);
  if (!s) throw new ApiError("errors.sessionIntrouvable");
  return s;
};

export async function listerSessions(): Promise<SessionEchange[]> {
  if (MODE_REEL) return appel("GET", "/sessions");
  await pause(150);
  return sessions.map((s) => ({ ...s }));
}

export async function obtenirSession(id: string): Promise<SessionEchange> {
  if (MODE_REEL) return appel("GET", `/sessions/${id}`);
  await pause(150);
  return { ...session(id) };
}

/** RG10 : seule une proposition reçue encore ouverte peut être acceptée ou refusée. */
export async function repondreProposition(
  id: string,
  accepter: boolean,
): Promise<void> {
  if (MODE_REEL) return appel("POST", `/sessions/${id}/reponse`, { accepter });
  await pause();
  const s = session(id);
  if (s.statut !== "PROPOSEE" || s.proposeParMoi)
    throw new ApiError("errors.generique");
  s.statut = accepter ? "ACCEPTEE" : "REFUSEE";
}

/** RG11 : la session devient REALISEE quand les deux participants ont confirmé. */
export async function confirmerRealisation(id: string): Promise<void> {
  if (MODE_REEL) return appel("POST", `/sessions/${id}/confirmation`, {});
  await pause();
  const s = session(id);
  if (s.statut !== "ACCEPTEE") throw new ApiError("errors.generique");
  s.mesConfirmation = true;
  if (s.saConfirmation) s.statut = "REALISEE";
}

/** RG19 : l'autre membre ne s'est pas présenté, la session est NON_REALISEE et l'absent est enregistré. */
export async function declarerAbsence(id: string): Promise<void> {
  if (MODE_REEL) return appel("POST", `/sessions/${id}/absence`, {});
  await pause();
  const s = session(id);
  if (s.statut !== "ACCEPTEE") throw new ApiError("errors.generique");
  s.statut = "NON_REALISEE";
  s.absent = "autre";
}

export async function publierAvis(
  id: string,
  valeurs: AvisSortie,
): Promise<void> {
  if (MODE_REEL) {
    await appel("POST", `/sessions/${id}/avis`, valeurs);
    return;
  }
  await pause();
  const s = session(id);
  if (s.statut !== "REALISEE") throw new ApiError("errors.generique");
  if (s.avisDonne) throw new ApiError("errors.dejaAvis");
  void valeurs;
  s.avisDonne = true;
}

export async function signalerMembre(
  membreId: string,
  valeurs: SignalementValues,
): Promise<void> {
  if (MODE_REEL) {
    await appel("POST", "/signalements", { membreId, ...valeurs });
    return;
  }
  await pause();
  if (!PROFILS.some((p) => p.id === membreId))
    throw new ApiError("errors.introuvable");
  void valeurs;
}

export interface MonProfil {
  pseudo: string;
  role: string;
  bio: string | null;
  ville: string | null;
  modeLocalisation: "AUCUNE" | "MANUELLE" | "AUTOMATIQUE";
  /** Numéro vérifié, toujours masqué (« +237 6 •• •• 42 17 »). */
  telephoneMasque: string | null;
  /** Compte administrateur créé par un autre : le mot de passe doit être changé avant tout. */
  mdpProvisoire?: boolean;
}
let profilSimule: MonProfil = {
  pseudo: "Amina",
  role: "ADMIN",
  bio: null,
  ville: "Yaoundé, Bastos",
  modeLocalisation: "MANUELLE",
  telephoneMasque: "+237 6 •• •• 42 17",
};

export async function obtenirMoi(): Promise<MonProfil> {
  if (MODE_REEL) return appel("GET", "/moi");
  await pause(100);
  return profilSimule;
}

const NOTIFICATIONS_SIMULEES: Notification[] = [
  {
    id: "n1",
    type: "SESSION_ACCEPTEE",
    contenu: "Kevin a accepté ta session : Anglais, samedi 7 novembre à 10 h.",
    creeLe: new Date(Date.now() - 2 * 3_600_000).toISOString(),
    lue: false,
  },
  {
    id: "n2",
    type: "NOUVEAU_MESSAGE",
    contenu: "Kevin : « Café, c'est plus simple pour parler. »",
    creeLe: new Date(Date.now() - 3 * 3_600_000).toISOString(),
    lue: false,
  },
  {
    id: "n3",
    type: "RAPPEL_AVIS",
    contenu: "Votre session de photographie est terminée.",
    creeLe: new Date(Date.now() - 26 * 3_600_000).toISOString(),
    lue: true,
  },
  {
    id: "n4",
    type: "NOUVELLE_SUGGESTION",
    contenu: "Prisca Ndongo propose l'anglais à distance.",
    creeLe: new Date(Date.now() - 4 * 86_400_000).toISOString(),
    lue: true,
  },
];

export async function listerNotifications(): Promise<{
  nonLues: number;
  notifications: Notification[];
}> {
  if (MODE_REEL) return appel("GET", "/notifications");
  await pause(100);
  return {
    nonLues: NOTIFICATIONS_SIMULEES.filter((n) => !n.lue).length,
    notifications: NOTIFICATIONS_SIMULEES.map((n) => ({ ...n })),
  };
}

export async function marquerNotificationsLues(): Promise<void> {
  if (MODE_REEL) return appel("POST", "/notifications/lues", {});
  await pause(50);
  for (const n of NOTIFICATIONS_SIMULEES) n.lue = true;
}

// --- Administration -----------------------------------------------------------------------------

const ADMIN_SIGNALEMENTS: (SignalementAdmin & {
  detail: SignalementAdminDetail;
})[] = [
  {
    id: "s1",
    motif: "SPAM",
    gravite: "BASSE",
    statut: "OUVERT",
    creeLe: new Date(Date.now() - 3 * 3_600_000).toISOString(),
    ciblePseudo: "Jean Fotso",
    nbSignaleurs: 3,
    detail: {
      id: "s1",
      motif: "SPAM",
      description: "Envoie le même lien à tous ses contacts.",
      creeLe: new Date(Date.now() - 3 * 3_600_000).toISOString(),
      ciblePseudo: "Jean Fotso",
      cibleStatut: "ACTIF",
      auteurPseudo: "Amina K.",
      historique: {
        sessionsRealisees: 1,
        absences: 0,
        signalementsRecus: 3,
        signaleursDistincts: 3,
        noteMoyenne: 3.5,
      },
    },
  },
  {
    id: "s2",
    motif: "FAUX_PROFIL",
    gravite: "MOYENNE",
    statut: "OUVERT",
    creeLe: new Date(Date.now() - 26 * 3_600_000).toISOString(),
    ciblePseudo: "Paul Essomba",
    nbSignaleurs: 1,
    detail: {
      id: "s2",
      motif: "FAUX_PROFIL",
      description: null,
      creeLe: new Date(Date.now() - 26 * 3_600_000).toISOString(),
      ciblePseudo: "Paul Essomba",
      cibleStatut: "ACTIF",
      auteurPseudo: "Kevin M.",
      historique: {
        sessionsRealisees: 0,
        absences: 0,
        signalementsRecus: 1,
        signaleursDistincts: 1,
        noteMoyenne: null,
      },
    },
  },
];

export async function obtenirIndicateursAdmin(): Promise<IndicateursAdmin> {
  if (MODE_REEL) return appel("GET", "/admin/indicateurs");
  await pause(100);
  return {
    sessionsRealisees30j: 42,
    conversations30j: 120,
    tauxConcretisation: 35,
    competencesOffertes: 180,
    competencesConfirmees: 12,
    signalementsOuverts: ADMIN_SIGNALEMENTS.length,
  };
}

export async function listerSignalementsAdmin(): Promise<SignalementAdmin[]> {
  if (MODE_REEL) return appel("GET", "/admin/signalements");
  await pause(100);
  return ADMIN_SIGNALEMENTS.map((s) => ({
    id: s.id,
    motif: s.motif,
    gravite: s.gravite,
    statut: s.statut,
    creeLe: s.creeLe,
    ciblePseudo: s.ciblePseudo,
    nbSignaleurs: s.nbSignaleurs,
  }));
}

export async function detailSignalementAdmin(
  id: string,
): Promise<SignalementAdminDetail> {
  if (MODE_REEL) return appel("GET", `/admin/signalements/${id}`);
  await pause(100);
  const s = ADMIN_SIGNALEMENTS.find((x) => x.id === id);
  if (!s) throw new ApiError("errors.introuvable");
  return s.detail;
}

export async function deciderSignalement(
  id: string,
  decision: DecisionModeration,
  commentaire?: string,
): Promise<void> {
  if (MODE_REEL)
    return appel("POST", `/admin/signalements/${id}/decision`, {
      decision,
      commentaire: commentaire || undefined,
    });
  await pause(150);
  const i = ADMIN_SIGNALEMENTS.findIndex((x) => x.id === id);
  if (i >= 0) ADMIN_SIGNALEMENTS.splice(i, 1);
}

export interface AdministrateurListe {
  id: string;
  pseudo: string;
  email: string;
  mdpProvisoire: boolean;
  creeLe: string;
}
const ADMINS_SIMULES: AdministrateurListe[] = [
  { id: "a1", pseudo: "Amina", email: "amina@exemple.cm", mdpProvisoire: false, creeLe: "2026-09-01T08:00:00Z" },
];

export async function listerAdministrateurs(): Promise<AdministrateurListe[]> {
  if (MODE_REEL) return appel("GET", "/admin/administrateurs");
  await pause(100);
  return [...ADMINS_SIMULES];
}

export async function nommerAdministrateur(v: { email: string; motDePasse: string }): Promise<void> {
  if (MODE_REEL) return appel("POST", "/admin/administrateurs/nommer", v);
  await pause(150);
  ADMINS_SIMULES.push({ id: `a${ADMINS_SIMULES.length + 1}`, pseudo: v.email.split("@")[0], email: v.email, mdpProvisoire: false, creeLe: new Date().toISOString() });
}

export async function creerAdministrateur(v: { email: string; pseudo: string; motDePasse: string }): Promise<{ id: string; motDePasseProvisoire: string }> {
  if (MODE_REEL) return appel("POST", "/admin/administrateurs/creer", v);
  await pause(150);
  const id = `a${ADMINS_SIMULES.length + 1}`;
  ADMINS_SIMULES.push({ id, pseudo: v.pseudo, email: v.email, mdpProvisoire: true, creeLe: new Date().toISOString() });
  return { id, motDePasseProvisoire: "Simule2026Abcdef" };
}

export async function retirerAdministrateur(id: string, motDePasse: string): Promise<void> {
  if (MODE_REEL) return appel("POST", `/admin/administrateurs/${id}/retirer`, { motDePasse });
  await pause(150);
  if (ADMINS_SIMULES.length <= 1) throw new ApiError("errors.dernierAdmin");
  const i = ADMINS_SIMULES.findIndex((a) => a.id === id);
  if (i >= 0) ADMINS_SIMULES.splice(i, 1);
}

// --- Notifications sur l'appareil (Web Push) -----------------------------------------------------

/** Clé publique du serveur ; `null` si le serveur n'a pas activé les notifications sur l'appareil. */
export async function obtenirCleVapid(): Promise<string | null> {
  if (!MODE_REEL) return null;
  return (await appel<{ cle: string | null }>("GET", "/push/cle")).cle;
}

export async function enregistrerPush(abonnement: { endpoint: string; keys: { p256dh: string; auth: string } }): Promise<void> {
  if (MODE_REEL) return appel("POST", "/moi/push", abonnement);
}

export async function retirerPush(endpoint: string): Promise<void> {
  if (MODE_REEL) return appel("POST", "/moi/push/retirer", { endpoint });
}

// --- Compte ---------------------------------------------------------------------------------------

export async function seDeconnecter(): Promise<void> {
  if (MODE_REEL) return appel("POST", "/auth/deconnexion");
  await pause(100);
}

/** RG14 : anonymisation du compte, après confirmation par le mot de passe. */
export async function supprimerCompte(motDePasse: string): Promise<void> {
  if (MODE_REEL) return appel("POST", "/moi/suppression", { motDePasse });
  await pause(200);
  if (!motDePasse) throw new ApiError("errors.identifiants");
}

export async function modifierProfil(v: ProfilValues): Promise<void> {
  if (MODE_REEL) return appel("PUT", "/moi/profil", v);
  await pause(150);
  profilSimule = {
    ...profilSimule,
    pseudo: v.pseudo,
    bio: v.bio || null,
    ville:
      profilSimule.modeLocalisation === "MANUELLE"
        ? v.ville || null
        : profilSimule.ville,
  };
}

export async function changerMotDePasse(v: MotDePasseValues): Promise<void> {
  if (MODE_REEL)
    return appel("POST", "/moi/mot-de-passe", {
      actuel: v.actuel,
      nouveau: v.nouveau,
    });
  await pause(200);
}

export async function modifierCompetence(
  competenceId: string,
  v: ModificationCompetenceValues,
): Promise<void> {
  if (MODE_REEL) return appel("PUT", `/moi/competences/${competenceId}`, v);
  await pause(150);
  const d = etat.declarations.find((x) => x.competenceId === competenceId);
  if (!d) throw new ApiError("errors.introuvable");
  d.niveau = v.niveau;
  d.format = v.format;
  d.preuveUrl = v.preuveUrl || undefined;
}

export async function retirerCompetence(competenceId: string): Promise<void> {
  if (MODE_REEL) return appel("DELETE", `/moi/competences/${competenceId}`);
  await pause(150);
  const i = etat.declarations.findIndex((x) => x.competenceId === competenceId);
  if (i < 0) throw new ApiError("errors.introuvable");
  etat.declarations.splice(i, 1);
}

export interface MonCreneau {
  id: string;
  libelle: string;
  fin: string;
  format: Format;
  statut: "LIBRE" | "RESERVE";
}
const creneauxSimules: MonCreneau[] = [
  {
    id: "k1",
    libelle: "Sam. 7 nov., 10 h",
    fin: new Date(Date.now() + 3 * 86_400_000 + 3_600_000).toISOString(),
    format: "LES_DEUX",
    statut: "LIBRE",
  },
  {
    id: "k2",
    libelle: "Dim. 8 nov., 15 h",
    fin: new Date(Date.now() + 4 * 86_400_000 + 3_600_000).toISOString(),
    format: "DISTANCE",
    statut: "RESERVE",
  },
];

export async function listerMesCreneaux(): Promise<MonCreneau[]> {
  if (MODE_REEL) return appel("GET", "/moi/creneaux");
  await pause(100);
  return [...creneauxSimules];
}

export async function creerCreneau(v: CreneauValues): Promise<void> {
  if (MODE_REEL) {
    const debut = new Date(`${v.date}T${v.debut}:00+01:00`).toISOString();
    const fin = new Date(`${v.date}T${v.fin}:00+01:00`).toISOString();
    await appel("POST", "/moi/creneaux", { debut, fin, format: v.format });
    return;
  }
  await pause(150);
  creneauxSimules.push({
    id: `k${creneauxSimules.length + 1}`,
    libelle: `${v.date} ${v.debut}`,
    fin: new Date(`${v.date}T${v.fin}:00+01:00`).toISOString(),
    format: v.format,
    statut: "LIBRE",
  });
}

export async function annulerCreneau(id: string): Promise<void> {
  if (MODE_REEL) return appel("DELETE", `/moi/creneaux/${id}`);
  await pause(100);
  const i = creneauxSimules.findIndex((c) => c.id === id);
  if (i >= 0 && creneauxSimules[i].statut === "RESERVE")
    throw new ApiError("errors.creneauReserve");
  if (i >= 0) creneauxSimules.splice(i, 1);
}

/** Toujours la même réponse, que l'adresse existe ou non (ES3). */
export async function demanderReinitialisation(email: string): Promise<void> {
  if (MODE_REEL) return appel("POST", "/auth/mot-de-passe-oublie", { email });
  await pause(200);
}

export async function reinitialiserMotDePasse(
  jeton: string,
  nouveau: string,
): Promise<void> {
  if (MODE_REEL)
    return appel("POST", "/auth/reinitialisation", { jeton, nouveau });
  await pause(200);
  if (jeton.length < 20) throw new ApiError("errors.jetonInvalide");
}
