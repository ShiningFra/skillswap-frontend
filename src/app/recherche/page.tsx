"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { CarteRecherche } from "@/components/carte-membre";
import { Ecran, Titre } from "@/components/ui";
import { rechercherProfils } from "@/lib/api";
import { useCatalogue } from "@/lib/catalogue";
import type { Format } from "@/lib/domain";
import { normaliser } from "@/lib/format";
import { classer, fusionner } from "@/lib/recherche-floue";
import { useProchesDuSens } from "@/lib/semantique";

const FORMATS_FILTRE: (Format | "")[] = ["", "PRESENTIEL", "DISTANCE"];

export default function PageRecherche() {
  const t = useTranslations("recherche");
  const te = useTranslations();
  const { liste } = useCatalogue();
  const [terme, setTerme] = useState("");
  const [format, setFormat] = useState<Format | "">("");
  const mot = normaliser(terme);
  // Les compétences les plus proches du texte (synonymes, fautes de frappe, catégorie) sont toutes cherchées.
  const { voisines: sens, enCours: sensEnCours } = useProchesDuSens(terme);
  const proches = mot ? fusionner(classer(terme, liste, 8), sens, liste, 8) : [];
  const ids = proches.filter((r) => r.score >= proches[0].score - 45).slice(0, 6).map((r) => r.competence.id);
  // Une seule requête par recherche, lancée 350 ms après la dernière frappe (le serveur limite le nombre de recherches).
  const cle = ids.join(",");
  const [cleStable, setCleStable] = useState(cle);
  useEffect(() => {
    const t = setTimeout(() => setCleStable(cle), 350);
    return () => clearTimeout(t);
  }, [cle]);
  const idsStables = cleStable ? cleStable.split(",") : [];
  const aucuneCorrespondance = Boolean(mot) && liste.length > 0 && ids.length === 0 && !sensEnCours;
  const resultats = useInfiniteQuery({
    queryKey: ["recherche", cleStable, format],
    enabled: !aucuneCorrespondance && (!mot || (liste.length > 0 && cleStable === cle)),
    initialPageParam: 0,
    queryFn: ({ pageParam }) => rechercherProfils({ competenceIds: idsStables.length ? idsStables : undefined, format: format || undefined, decalage: pageParam }),
    getNextPageParam: (derniere, pages) => (derniere.suite ? pages.reduce((n, p) => n + p.resultats.length, 0) : undefined),
  });
  const data = aucuneCorrespondance ? [] : resultats.data?.pages.flatMap((p) => p.resultats);
  const isPending = !aucuneCorrespondance && resultats.isPending;

  return (
    <Ecran nav>
      <Titre>{t("titre")}</Titre>
      <div className="flex min-h-[50px] items-center gap-2.5 rounded-[14px] border-[1.5px] border-bord bg-surface px-3.5">
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 text-discret">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-4-4" />
        </svg>
        <input type="search" aria-label={t("champ")} placeholder={t("placeholder")} value={terme} onChange={(e) => setTerme(e.target.value)} className="min-w-0 flex-1 border-0 bg-transparent py-3 text-base outline-none" />
      </div>

      {proches.length > 1 || (proches.length === 1 && normaliser(proches[0].competence.libelle) !== mot) ? (
        <div className="flex flex-col gap-1.5">
          <p className="text-[0.8125rem] font-semibold text-discret">{t("proches")}</p>
          <div className="flex flex-wrap gap-2">
            {proches.map((r) => (
              <button key={r.competence.id} type="button" onClick={() => setTerme(r.competence.libelle)} className="min-h-11 rounded-full border-[1.5px] border-bord bg-surface px-4 text-sm font-semibold text-[#33403a]">
                {r.competence.libelle}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {mot && liste.length > 0 && proches.length === 0 ? <p aria-live="polite" className="text-sm text-discret">{sensEnCours ? t("rechercheEnCours") : t("aucuneProche", { terme: terme.trim() })}</p> : null}

      <div role="group" aria-label={t("formatGroupe")} className="flex gap-2 overflow-x-auto">
        {FORMATS_FILTRE.map((f) => (
          <button key={f || "tous"} type="button" aria-pressed={format === f} onClick={() => setFormat(f)} className={`min-h-11 shrink-0 whitespace-nowrap rounded-full border-[1.5px] border-bord px-4 text-sm font-bold ${format === f ? "bg-marque text-white" : "bg-surface text-[#33403a]"}`}>
            {f === "" ? t("tous") : te(`formats.${f}`)}
          </button>
        ))}
      </div>

      <div aria-live="polite" className="flex flex-col gap-3">
        {isPending ? <p className="text-sm text-discret">{te("common.chargement")}</p> : null}
        {data ? <p className="text-[0.8125rem] font-semibold text-discret">{mot ? t(!aucuneCorrespondance && resultats.hasNextPage ? "resultatsPourPlus" : "resultatsPour", { count: data.length, terme: terme.trim() }) : t(!aucuneCorrespondance && resultats.hasNextPage ? "resultatsTousPlus" : "resultatsTous", { count: data.length })}</p> : null}
        {data?.length === 0 ? <p className="text-sm text-discret">{t("aucun")}</p> : null}
        <ul className="flex flex-col gap-3">
          {data?.map((p) => (
            <li key={p.id}>
              <CarteRecherche p={p} />
            </li>
          ))}
        </ul>
        {!aucuneCorrespondance && resultats.hasNextPage ? (
          <button type="button" disabled={resultats.isFetchingNextPage} onClick={() => resultats.fetchNextPage()} className="min-h-12 rounded-xl border-[1.5px] border-bord bg-surface px-4 text-[0.9375rem] font-bold text-marque disabled:opacity-60">
            {resultats.isFetchingNextPage ? te("common.chargement") : t("voirPlus")}
          </button>
        ) : null}
      </div>
    </Ecran>
  );
}
