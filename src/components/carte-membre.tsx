"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useCatalogue } from "@/lib/catalogue";
import type { ProfilMembre } from "@/lib/domain";
import { badgeCompetence, prenom } from "@/lib/format";
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

const MAX_OFFRES_AFFICHEES = 3;

/** Résultat de recherche (écran 6 de la maquette) : chaque compétence trouvée est nommée, avec son niveau et sa confiance. */
export function CarteRecherche({ p }: { p: ProfilMembre }) {
  const t = useTranslations("recherche");
  const te = useTranslations();
  const { libelle } = useCatalogue();
  const offres = p.offertes.slice(0, MAX_OFFRES_AFFICHEES);
  const reste = p.offertes.length - offres.length;
  return (
    <Link href={`/profils/${p.id}`} className={`${CARTE} flex flex-col gap-2 px-4 py-3.5`}>
      <span className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-base font-extrabold">{p.pseudo}</span>
        <span className="shrink-0 text-[0.8125rem] font-semibold text-discret">{p.distanceKm !== undefined ? t("distanceMaj", { km: p.distanceKm }) : t("aDistance")}</span>
      </span>
      <ul className="flex flex-col gap-1.5">
        {offres.map((o) => (
          <li key={o.competenceId} className="flex flex-wrap items-center gap-1.5">
            <span className="text-[0.9375rem] font-bold">{libelle(o.competenceId)}</span>
            <Puce>{te(`niveaux.${o.niveau}`)}</Puce>
            <Puce ok={badgeCompetence(o) === "confirmee"}>{t(`badge.${badgeCompetence(o)}`)}</Puce>
          </li>
        ))}
        {reste > 0 ? <li className="text-xs font-semibold text-discret">{t("etAutres", { count: reste })}</li> : null}
      </ul>
      <span className="text-[0.8125rem] text-discret">
        {p.noteMoyenne !== undefined ? t("noteLigne", { note: p.noteMoyenne.toLocaleString("fr-FR"), count: p.nbAvis }) : `${te("recherche.nouveau").replace(/^./, (c) => c.toUpperCase())} · ${te("accueil.pasEncoreAvis")}`}
      </span>
    </Link>
  );
}

/** Suggestion de l'accueil (écran 5 de la maquette) : dit pourquoi ce membre est proposé. */
export function CarteSuggestion({ p }: { p: ProfilMembre }) {
  const t = useTranslations("accueil");
  const tr = useTranslations("recherche");
  const { libelle } = useCatalogue();
  const ligne = useLigneReputation();
  const offres = p.offertes.slice(0, 2);
  const veut = p.recherchees[0];
  return (
    <Link href={`/profils/${p.id}`} className={`${CARTE} flex flex-col gap-3 p-4`}>
      <span className="flex items-center gap-3">
        <Avatar pseudo={p.pseudo} />
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-base font-extrabold">{p.pseudo}</span>
          <span className="text-[0.8125rem] text-discret">{ligne(p)}</span>
        </span>
      </span>
      {p.raison && p.raison !== "proximite" ? <span className="flex"><Puce ok={p.raison === "mutuel"}>{t(`raison.${p.raison}`)}</Puce></span> : null}
      {offres.length > 0 ? (
        <span className="flex flex-wrap gap-1.5">
          {offres.map((o) => (
            <Puce key={o.competenceId} ok={badgeCompetence(o) === "confirmee"}>{`${libelle(o.competenceId)} · ${t(badgeCompetence(o) === "confirmee" ? "confirmeeSuffixe" : "declarativeSuffixe")}`}</Puce>
          ))}
          {offres.some((o) => badgeCompetence(o) === "preuve" || o.preuveFournie || o.preuveUrl) ? <Puce>{tr("badge.preuve")}</Puce> : null}
        </span>
      ) : null}
      <span className="text-[0.8125rem] leading-snug">
        {offres.length > 0 ? t("peutApprendre", { prenom: prenom(p.pseudo), competence: libelle(offres[0].competenceId) }) : ""}
        {veut ? `${offres.length > 0 ? " " : ""}${t(offres.length > 0 ? "veutApprendre" : "chercheSeulement", { prenom: prenom(p.pseudo), competence: libelle(veut) })}` : ""}
      </span>
    </Link>
  );
}
