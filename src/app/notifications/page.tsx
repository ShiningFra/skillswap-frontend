"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { Ecran, LienRetour, Titre, CARTE } from "@/components/ui";
import { listerNotifications, marquerNotificationsLues } from "@/lib/api";
import type { TypeNotification } from "@/lib/domain";
import { ilYa } from "@/lib/format";

const ICONES: Record<TypeNotification, { chemin: string; teinte: string }> = {
  SESSION_PROPOSEE: { chemin: "M5 5h14v15H5zM5 9h14M9 3v4M15 3v4", teinte: "bg-marque-doux text-marque-fonce" },
  SESSION_ACCEPTEE: { chemin: "M5 5h14v15H5zM5 9h14M9 3v4M15 3v4", teinte: "bg-marque-doux text-marque-fonce" },
  SESSION_REFUSEE: { chemin: "M5 5h14v15H5zM5 9h14M9 3v4M15 3v4", teinte: "bg-[#eaeee9] text-[#33403a]" },
  NOUVEAU_MESSAGE: { chemin: "M4 5h16v11H9l-5 4z", teinte: "bg-[#eaeee9] text-[#33403a]" },
  RAPPEL_AVIS: { chemin: "M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5 6.7 19.4l1.2-6L3.4 9.3l6-.7z", teinte: "bg-avertissement-doux text-avertissement" },
  NOUVELLE_SUGGESTION: { chemin: "M12 4a4 4 0 110 8 4 4 0 010-8zM4 21c1-4 4-6 8-6s7 2 8 6", teinte: "bg-marque-doux text-marque-fonce" },
  AVERTISSEMENT_ABSENCE: { chemin: "M12 3l9 16H3zM12 10v4M12 17h.01", teinte: "bg-alerte-doux text-alerte" },
  AVERTISSEMENT: { chemin: "M12 3l9 16H3zM12 10v4M12 17h.01", teinte: "bg-avertissement-doux text-avertissement" },
  SUSPENSION: { chemin: "M12 3l9 16H3zM12 10v4M12 17h.01", teinte: "bg-alerte-doux text-alerte" },
};

/** Destination par défaut quand le serveur n'a pas fourni de lien précis. */
const DESTINATION: Partial<Record<TypeNotification, string>> = {
  SESSION_PROPOSEE: "/sessions",
  SESSION_ACCEPTEE: "/sessions",
  SESSION_REFUSEE: "/sessions",
  RAPPEL_AVIS: "/sessions",
  NOUVEAU_MESSAGE: "/messages",
  NOUVELLE_SUGGESTION: "/accueil",
};

/** Un lien venu du réseau n'est suivi que s'il reste dans l'application (jamais d'adresse externe). */
function destination(n: { type: TypeNotification; lien?: string | null }): string | undefined {
  if (n.lien && /^\/[a-z0-9/_-]*$/.test(n.lien)) return n.lien;
  return DESTINATION[n.type];
}

export default function PageNotifications() {
  const t = useTranslations("notifications");
  const te = useTranslations();
  const qc = useQueryClient();
  const liste = useQuery({ queryKey: ["notifs", "liste"], queryFn: listerNotifications, staleTime: 0, gcTime: 0 });
  const marque = useRef(false);
  // Les notifications s'affichent d'abord comme non lues ; elles sont marquées lues une fois l'écran montré.
  useEffect(() => {
    if (!liste.data || marque.current) return;
    marque.current = true;
    marquerNotificationsLues().then(() => qc.invalidateQueries({ queryKey: ["notifs", "compteur"] }));
  }, [liste.data, qc]);

  return (
    <Ecran>
      <LienRetour href="/accueil" label={te("common.retour")} />
      <Titre>{t("titre")}</Titre>
      {liste.data?.notifications.length === 0 ? <p className="text-sm text-discret">{t("aucune")}</p> : null}
      <ul className="flex flex-col gap-3">
        {liste.data?.notifications.map((n) => {
          const icone = ICONES[n.type];
          const vers = destination(n);
          const contenu = (
            <>
              <span aria-hidden="true" className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${icone.teinte}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={icone.chemin} />
                </svg>
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-base font-extrabold leading-tight">{t(`types.${n.type}`)}</span>
                <span className="text-[0.8125rem] leading-snug text-discret">{n.contenu}</span>
                <span className="text-xs font-bold">{ilYa(n.creeLe)}</span>
              </span>
              {n.lue ? null : (
                <>
                  <span aria-hidden="true" className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-marque" />
                  <span className="sr-only">{t("nonLue")}</span>
                </>
              )}
              {vers ? (
                <svg aria-hidden="true" className="mt-2.5 shrink-0 text-discret" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 5l7 7-7 7" />
                </svg>
              ) : null}
            </>
          );
          const classes = `${CARTE} flex items-start gap-3 px-3.5 py-3 ${n.lue ? "" : "!border-marque"}`;
          return (
            <li key={n.id}>
              {vers ? (
                <Link href={vers} className={`${classes} min-h-16`}>
                  {contenu}
                </Link>
              ) : (
                <div className={classes}>{contenu}</div>
              )}
            </li>
          );
        })}
      </ul>
    </Ecran>
  );
}
