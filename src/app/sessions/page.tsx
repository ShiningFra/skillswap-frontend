"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useCatalogue } from "@/lib/catalogue";
import { Avatar, CARTE, Ecran, LienRetour, Pastille, Titre } from "@/components/ui";
import { listerSessions } from "@/lib/api";

export default function PageSessions() {
  const { libelle } = useCatalogue();
  const t = useTranslations("sessions");
  const te = useTranslations();
  const { data } = useQuery({ queryKey: ["sessions"], queryFn: listerSessions, refetchInterval: 15000 });
  return (
    <Ecran nav>
      <LienRetour href="/competences" label={te("common.retour")} />
      <Titre>{t("titre")}</Titre>
      {data?.length === 0 ? <p className="text-sm text-discret">{t("aucune")}</p> : null}
      <ul className="flex flex-col gap-3">
        {data?.map((s) => (
          <li key={s.id}>
            <Link href={`/sessions/${s.id}`} className={`${CARTE} flex items-start gap-3 p-4`}>
              <Avatar pseudo={s.membre.pseudo} />
              <span className="flex min-w-0 flex-col gap-1.5">
                <span className="font-extrabold">{t("avec", { competence: libelle(s.competenceId), pseudo: s.membre.pseudo })}</span>
                <span className="text-sm text-discret">{s.creneauLibelle}</span>
                <span className="flex flex-wrap gap-2">
                  <Pastille ton={s.statut === "ACCEPTEE" || s.statut === "REALISEE" ? "ok" : "neutre"}>{te(`statuts.${s.statut}`)}</Pastille>
                  {s.statut === "PROPOSEE" ? <Pastille>{s.proposeParMoi ? t("envoyee", { pseudo: s.membre.pseudo }) : t("recue", { pseudo: s.membre.pseudo })}</Pastille> : null}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Ecran>
  );
}
