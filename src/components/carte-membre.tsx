"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useCatalogue } from "@/lib/catalogue";
import type { ProfilMembre } from "@/lib/domain";
import { badgeCompetence, offreCorrespondante, prenom } from "@/lib/format";
import { Avatar, CARTE } from "./ui";

export const Puce = ({ children, ok = false }: { children: React.ReactNode; ok?: boolean }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-[3px] text-xs font-bold ${ok ? "bg-marque-doux text-marque-fonce" : "bg-[#eaeee9] text-[#33403a]"}`}>{children}</span>
);

/** Distance et réputation sur une ligne : « À 3 km · note 4,8 (12 avis) » ou « À distance · pas encore d'avis ». */
export function useLigneReputation() {
  const t = useTranslations("recherche");
  const ta = useTranslations("accueil");
  return (p: ProfilMembre) => {
    const lieu = p.distanceKm !== undefined ? t("distanceMaj", { km: p.distanceKm }) : t("aDistance");
    const avis = p.noteMoyenne !== undefined ? ta("noteSur5", { note: p.noteMoyenne.toLocaleString("fr-FR"), count: p.nbAvis }) : ta("pasEncoreAvis");
    return `${lieu} · ${avis}`;
  };
}

/** Résultat de recherche (écran 6 de la maquette). */
export function CarteRecherche({ p, competenceId }: { p: ProfilMembre; competenceId?: string }) {
  const t = useTranslations("recherche");
  const te = useTranslations();
  const offre = offreCorrespondante(p, competenceId);
  const badge = badgeCompetence(offre);
  return (
    <Link href={`/profils/${p.id}`} className={`${CARTE} flex flex-col gap-2 px-4 py-3.5`}>
      <span className="flex items-center justify-between gap-2">
        <span className="text-base font-extrabold">{p.pseudo}</span>
        <span className="text-[0.8125rem] font-semibold text-discret">{p.distanceKm !== undefined ? t("distanceMaj", { km: p.distanceKm }) : t("aDistance")}</span>
      </span>
      <span className="flex flex-wrap gap-1.5">
        <Puce ok={badge === "confirmee"}>{t(`badge.${badge}`)}</Puce>
        <Puce>{te(`niveaux.${offre.niveau}`)}</Puce>
      </span>
      <span className="text-[0.8125rem] text-discret">
        {p.noteMoyenne !== undefined ? `${t("noteLigne", { note: p.noteMoyenne.toLocaleString("fr-FR"), count: p.nbAvis })} · ${t(`formatLigne.${offre.format}`)}` : `${te("recherche.nouveau").replace(/^./, (c) => c.toUpperCase())} · ${te("accueil.pasEncoreAvis")}`}
      </span>
    </Link>
  );
}

/** Suggestion de l'accueil (écran 5 de la maquette). */
export function CarteSuggestion({ p, competenceId, mesOffres }: { p: ProfilMembre; competenceId?: string; mesOffres: string[] }) {
  const t = useTranslations("accueil");
  const tr = useTranslations("recherche");
  const { libelle } = useCatalogue();
  const ligne = useLigneReputation();
  const offre = offreCorrespondante(p, competenceId);
  const badge = badgeCompetence(offre);
  const reciproque = p.recherchees.find((c) => mesOffres.includes(c));
  return (
    <Link href={`/profils/${p.id}`} className={`${CARTE} flex flex-col gap-3 p-4`}>
      <span className="flex items-center gap-3">
        <Avatar pseudo={p.pseudo} />
        <span className="flex flex-col">
          <span className="text-base font-extrabold">{p.pseudo}</span>
          <span className="text-[0.8125rem] text-discret">{ligne(p)}</span>
        </span>
      </span>
      <span className="flex flex-wrap gap-1.5">
        <Puce ok={badge === "confirmee"}>{`${libelle(offre.competenceId)} · ${t(badge === "confirmee" ? "confirmeeSuffixe" : "declarativeSuffixe")}`}</Puce>
        {badge === "preuve" || offre.preuveFournie || offre.preuveUrl ? <Puce>{tr("badge.preuve")}</Puce> : null}
      </span>
      <span className="text-[0.8125rem] leading-snug">
        {t("peutApprendre", { prenom: prenom(p.pseudo), competence: libelle(offre.competenceId) })}
        {reciproque ? ` ${t("veutApprendre", { prenom: prenom(p.pseudo), competence: libelle(reciproque) })}` : ""}
      </span>
    </Link>
  );
}
