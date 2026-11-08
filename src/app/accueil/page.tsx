"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { CarteSuggestion } from "@/components/carte-membre";
import { Ecran, LienBouton } from "@/components/ui";
import { listerSuggestions, obtenirMoi } from "@/lib/api";

export default function PageAccueil() {
  const t = useTranslations("accueil");
  const te = useTranslations();
  const moi = useQuery({ queryKey: ["moi"], queryFn: obtenirMoi });
  const sugg = useInfiniteQuery({
    queryKey: ["suggestions"],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => listerSuggestions({ decalage: pageParam }),
    getNextPageParam: (derniere, pages) => (derniere.suite ? pages.reduce((n, p) => n + p.resultats.length, 0) : undefined),
  });
  const profils = sugg.data?.pages.flatMap((p) => p.resultats) ?? [];
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
      {!sugg.isPending && profils.length === 0 ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-discret">{t("aucune")}</p>
          <LienBouton href="/competences">{t("complete")}</LienBouton>
        </div>
      ) : null}
      <ul className="flex flex-col gap-3">
        {profils.map((p) => (
          <li key={p.id}>
            <CarteSuggestion p={p} />
          </li>
        ))}
      </ul>
      {sugg.hasNextPage ? (
        <button type="button" disabled={sugg.isFetchingNextPage} onClick={() => sugg.fetchNextPage()} className="min-h-12 rounded-xl border-[1.5px] border-bord bg-surface px-4 text-[0.9375rem] font-bold text-marque disabled:opacity-60">
          {sugg.isFetchingNextPage ? te("common.chargement") : t("voirPlus")}
        </button>
      ) : null}
    </Ecran>
  );
}
