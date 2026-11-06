# SkillSwap Web (Next.js, TypeScript)

## Lancer

```bash
npm install
npm run dev          # http://localhost:3000
```

## Deux modes

- **Simulé (par défaut)** : aucune API nécessaire, les données restent en mémoire. Code SMS de test : `123456`.
- **Réel** : copie `.env.local.example` en `.env.local`, démarre l'API (`skillswap-api`, port 3001) et la base PostgreSQL, puis relance `npm run dev`.
  Tout passe par l'API : inscription, connexion, code SMS (affiché dans la console de l'API en développement), localisation,
  compétences, recherche, profils, messages, sessions, avis, signalements.
  Limite connue : pour proposer une session, l'API prend la compétence de l'enseignant s'il n'en offre qu'une seule ; s'il en offre
  plusieurs, l'écran devra la demander (pas encore fait).

L'API n'accepte que l'origine `http://localhost:3000` (variable `ALLOWED_ORIGIN` côté API) ; garde donc ce port.

## Vérifier

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

## Écrans (conformes à la maquette cliquable)

Accueil « Pour toi » (`/accueil`, avec la cloche), Notifications (`/notifications`), Recherche (champ texte et filtres de format),
profil d'un membre, conversation, proposition de session, détail de session, avis, signalement. Police Manrope (paquet
`@fontsource-variable/manrope`, servie par l'application). Navigation : Accueil, Recherche, Messages, Profil ; « Tes sessions » se trouve
dans Profil. Pas encore faits : écran d'administration, et la page Compétences reste un formulaire (la maquette est une liste).

## Écran Administration

`/admin` (réservé au rôle ADMIN côté API) : indicateurs des 30 jours, file des signalements ouverts, historique du membre signalé et décisions avertir / suspendre / rejeter. En mode simulé, des données d'exemple sont affichées.

## Écrans de gestion du compte

`/creneaux` (mes disponibilités : ajouter, annuler), `/competences` (modifier ou retirer une compétence), `/compte` (profil, localisation, mot de passe, déconnexion, suppression). Accessibles depuis l'onglet Profil.

## Mot de passe oublié et changement de numéro (v0.11)
`/connexion` → « Mot de passe oublié ? » → `/mot-de-passe-oublie` (réponse neutre) → lien reçu par mail → `/reinitialisation?jeton=…`. Le changement de numéro se fait depuis `/compte` → `/compte/telephone` (même écran de code à 6 cases que l'inscription).

## Mon compte (v0.12)
`/compte` est un menu d'options : Modifier mon profil (`/compte/profil`), Localisation, Téléphone (`/compte/telephone`), Mot de passe (`/compte/mot-de-passe`), Mes disponibilités, Se déconnecter, Supprimer mon compte (`/compte/suppression`). Chaque option a son écran.

## Cas d'échec (v0.12.2)
Le script `e2e/run9.js` joue 36 cas d'échec dans le navigateur contre l'API réelle (inscription, connexion bloquée ou suspendue, codes SMS faux, expirés ou en trop grand nombre, numéro déjà pris, créneau pris, session déjà traitée, avis trop tôt ou en double, signalement en double, message vide ou trop long, membre supprimé, serveur arrêté).
