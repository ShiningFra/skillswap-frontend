"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { CarteRecherche } from "@/components/carte-membre";
import { Ecran, Titre } from "@/components/ui";
import { rechercherProfils } from "@/lib/api";
import { useCatalogue } from "@/lib/catalogue";
import type { Format, ProfilMembre } from "@/lib/domain";
import { normaliser } from "@/lib/format";

const FORMATS_FILTRE: (Format | "")[] = ["", "PRESENTIEL", "DISTANCE"];

export default function PageRecherche() {
  const t = useTranslations("recherche");
  const te = useTranslations();
  const { liste } = useCatalogue();
  const [terme, setTerme] = useState("");
  const [format, setFormat] = useState<Format | "">("");
  const mot = normaliser(terme);
  // Le champ filtre sur le nom de la compétence : toutes celles qui contiennent le texte tapé sont cherchées.
  const ids = mot ? liste.filter((c) => normaliser(c.libelle).includes(mot)).slice(0, 5).map((c) => c.id) : [];
  const { data, isPending } = useQuery({
    queryKey: ["recherche", mot, ids.join(","), format],
    enabled: !mot || liste.length > 0,
    queryFn: async () => {
      if (mot && ids.length === 0) return [] as { p: ProfilMembre; competenceId?: string }[];
      const lots = await Promise.all((ids.length > 0 ? ids : [undefined]).map((c) => rechercherProfils({ competenceId: c, format: format || undefined }).then((r) => r.map((p) => ({ p, competenceId: c })))));
      const vus = new Set<string>();
      return lots
        .flat()
        .filter(({ p }) => !vus.has(p.id) && vus.add(p.id))
        .sort((a, b) => (a.p.distanceKm ?? Infinity) - (b.p.distanceKm ?? Infinity));
    },
  });

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

      <div role="group" aria-label={t("formatGroupe")} className="flex gap-2 overflow-x-auto">
        {FORMATS_FILTRE.map((f) => (
          <button key={f || "tous"} type="button" aria-pressed={format === f} onClick={() => setFormat(f)} className={`min-h-11 shrink-0 whitespace-nowrap rounded-full border-[1.5px] border-bord px-4 text-sm font-bold ${format === f ? "bg-marque text-white" : "bg-surface text-[#33403a]"}`}>
            {f === "" ? t("tous") : te(`formats.${f}`)}
          </button>
        ))}
      </div>

      <div aria-live="polite" className="flex flex-col gap-3">
        {isPending ? <p className="text-sm text-discret">{te("common.chargement")}</p> : null}
        {data ? <p className="text-[0.8125rem] font-semibold text-discret">{mot ? t("resultatsPour", { count: data.length, terme: terme.trim() }) : t("resultatsTous", { count: data.length })}</p> : null}
        {data?.length === 0 ? <p className="text-sm text-discret">{t("aucun")}</p> : null}
        <ul className="flex flex-col gap-3">
          {data?.map(({ p, competenceId }) => (
            <li key={p.id}>
              <CarteRecherche p={p} competenceId={competenceId} />
            </li>
          ))}
        </ul>
      </div>
    </Ecran>
  );
}
