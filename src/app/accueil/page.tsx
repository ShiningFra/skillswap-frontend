"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { CarteSuggestion } from "@/components/carte-membre";
import { Ecran, LienBouton } from "@/components/ui";
import { listerDeclarations, obtenirMoi, rechercherProfils } from "@/lib/api";
import type { ProfilMembre } from "@/lib/domain";

/** Suggestions : les membres qui offrent ce que je cherche, les plus proches d'abord. À défaut, les membres les plus proches. */
async function suggestions(): Promise<{ profils: { p: ProfilMembre; competenceId?: string }[]; mesOffres: string[] }> {
  const decl = await listerDeclarations();
  const cherche = decl.filter((d) => d.sens === "RECHERCHEE").map((d) => d.competenceId);
  const mesOffres = decl.filter((d) => d.sens === "OFFERTE").map((d) => d.competenceId);
  const lots = cherche.length > 0 ? await Promise.all(cherche.map((c) => rechercherProfils({ competenceId: c }).then((r) => r.map((p) => ({ p, competenceId: c }))))) : [(await rechercherProfils({})).map((p) => ({ p, competenceId: undefined }))];
  const vus = new Set<string>();
  const profils = lots
    .flat()
    .filter(({ p }) => !vus.has(p.id) && vus.add(p.id))
    .sort((a, b) => (a.p.distanceKm ?? Infinity) - (b.p.distanceKm ?? Infinity));
  return { profils, mesOffres };
}

export default function PageAccueil() {
  const t = useTranslations("accueil");
  const te = useTranslations();
  const moi = useQuery({ queryKey: ["moi"], queryFn: obtenirMoi });
  const sugg = useQuery({ queryKey: ["suggestions"], queryFn: suggestions });
  return (
    <Ecran nav>
      <header className="flex items-start justify-between gap-3 pr-12">
        <div className="flex flex-col">
          <span className="text-[0.8125rem] font-semibold text-discret">{moi.data ? t("bonjour", { pseudo: moi.data.pseudo }) : " "}</span>
          <h1 className="text-[1.75rem] font-extrabold leading-tight tracking-tight">{t("titre")}</h1>
        </div>
      </header>
      <p className="-mt-2 text-[0.9375rem] leading-relaxed text-discret">{t("intro")}</p>

      {sugg.isPending ? <p className="text-sm text-discret">{te("common.chargement")}</p> : null}
      {sugg.data?.profils.length === 0 ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-discret">{t("aucune")}</p>
          <LienBouton href="/competences">{t("complete")}</LienBouton>
        </div>
      ) : null}
      <ul className="flex flex-col gap-3">
        {sugg.data?.profils.map(({ p, competenceId }) => (
          <li key={p.id}>
            <CarteSuggestion p={p} competenceId={competenceId} mesOffres={sugg.data.mesOffres} />
          </li>
        ))}
      </ul>
    </Ecran>
  );
}
