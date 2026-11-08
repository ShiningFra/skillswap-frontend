"use client";

import { useTranslations } from "next-intl";
import type { CleParametre } from "@/lib/domain";
import { useParametres } from "@/lib/parametres";
import { Alerte } from "./ui";

/** Annonce « en révision » quand l'administration a désactivé la fonctionnalité ; invisible sinon. */
export function BandeauRevision({ cle }: { cle: CleParametre }) {
  const t = useTranslations("parametres");
  const p = useParametres();
  if (p.actif(cle)) return null;
  return (
    <div role="status">
      <Alerte ton="avertissement">
        <strong className="block font-extrabold">{t("enRevision", { fonction: t(`noms.${cle}`) })}</strong>
        {p.message(cle) ?? t(`defaut.${cle}`)}
      </Alerte>
    </div>
  );
}
