"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { CarteSuggestion } from "@/components/carte-membre";
import { Ecran, LienBouton } from "@/components/ui";
import { listerDeclarations, listerNotifications, obtenirMoi, rechercherProfils } from "@/lib/api";
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
  const notifs = useQuery({ queryKey: ["notifs", "compteur"], queryFn: listerNotifications, select: (d) => d.nonLues, refetchInterval: 15000 });
  const sugg = useQuery({ queryKey: ["suggestions"], queryFn: suggestions });
  const n = notifs.data ?? 0;
  return (
    <Ecran nav>
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-[0.8125rem] font-semibold text-discret">{moi.data ? t("bonjour", { pseudo: moi.data.pseudo }) : " "}</span>
          <h1 className="text-[1.75rem] font-extrabold leading-tight tracking-tight">{t("titre")}</h1>
        </div>
        <Link href="/notifications" aria-label={n > 0 ? t("notificationsN", { count: n }) : t("notifications")} className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-[1.5px] border-trait bg-surface">
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 16V11a6 6 0 1112 0v5l2 2H4zM10 21h4" />
          </svg>
          {n > 0 ? (
            <span aria-hidden="true" className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-alerte px-1 text-[0.6875rem] font-extrabold text-white">
              {n}
            </span>
          ) : null}
        </Link>
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
