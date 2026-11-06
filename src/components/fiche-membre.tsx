"use client";

import { useTranslations } from "next-intl";
import { useCatalogue } from "@/lib/catalogue";
import type { CompetenceOfferte } from "@/lib/domain";
import { badgeCompetence } from "@/lib/format";
import { Puce } from "./carte-membre";
import { CARTE } from "./ui";

/** « youtube.com/@kevin-english » à partir d'un lien complet. */
function lienCourt(url: string): string {
  try {
    const u = new URL(url);
    return (u.host + u.pathname).replace(/\/$/, "");
  } catch {
    return url;
  }
}

/** Compétence offerte avec son état de vérification : « confirmée » (RG21) ou déclarative, et « preuve fournie » (RG18). */
export function CompetenceOfferteLigne({ o }: { o: CompetenceOfferte }) {
  const t = useTranslations("profil");
  const te = useTranslations();
  const { libelle } = useCatalogue();
  const badge = badgeCompetence(o);
  const confirmee = badge === "confirmee";
  const preuve = o.preuveFournie ?? Boolean(o.preuveUrl);
  return (
    <li className={`${CARTE} flex flex-col gap-2.5 p-4`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-lg font-extrabold">{libelle(o.competenceId)}</span>
        <Puce>{te(`niveaux.${o.niveau}`)}</Puce>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {confirmee ? <Puce ok>{t("confirmee")}</Puce> : null}
        {preuve ? <Puce>{t("preuveFournie")}</Puce> : null}
        {o.format !== "LES_DEUX" ? <Puce>{te(`formats.${o.format}`)}</Puce> : null}
      </div>
      <p className="text-[0.8125rem] leading-snug text-[#33403a]">
        {confirmee ? t("confirmeeDetail", { sessions: o.sessionsNotees, note: o.noteMoyenne.toLocaleString("fr-FR") }) : t("declarative")}
      </p>
      {o.preuveUrl ? (
        <a href={o.preuveUrl} target="_blank" rel="noopener noreferrer nofollow ugc" className="flex items-center gap-2 text-[0.8125rem] font-semibold text-marque-fonce">
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1" />
            <path d="M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1" />
          </svg>
          <span className="[overflow-wrap:anywhere]">{t("voirRealisationLien", { lien: lienCourt(o.preuveUrl) })}</span>
        </a>
      ) : null}
    </li>
  );
}
