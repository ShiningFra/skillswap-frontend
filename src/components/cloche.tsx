"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ListeNotifications } from "@/components/liste-notifications";
import { listerNotifications } from "@/lib/api";

/** Écrans sans session (ou sans accès aux notifications) : pas de cloche. */
const SANS_CLOCHE = ["/", "/connexion", "/inscription", "/mot-de-passe-oublie", "/reinitialisation", "/verification", "/localisation", "/compte/mot-de-passe", "/notifications"];

/** Cloche présente sur tous les écrans connectés ; elle ouvre un panneau par-dessus l'écran courant, sans changer de page. */
export function Cloche() {
  const t = useTranslations("accueil");
  const te = useTranslations();
  const chemin = usePathname();
  const [ouvert, setOuvert] = useState(false);
  const bouton = useRef<HTMLButtonElement>(null);
  const fermer = useRef<HTMLButtonElement>(null);
  const actif = !SANS_CLOCHE.includes(chemin);
  const notifs = useQuery({ queryKey: ["notifs", "compteur"], queryFn: listerNotifications, select: (d) => d.nonLues, refetchInterval: 15000, enabled: actif });
  const n = notifs.data ?? 0;

  useEffect(() => {
    if (!ouvert) return;
    fermer.current?.focus();
    const touche = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOuvert(false);
        bouton.current?.focus();
      }
    };
    document.addEventListener("keydown", touche);
    return () => document.removeEventListener("keydown", touche);
  }, [ouvert]);

  if (!actif) return null;
  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-40">
        <div className="mx-auto flex max-w-md justify-end px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <button
            ref={bouton}
            type="button"
            onClick={() => setOuvert(true)}
            aria-haspopup="dialog"
            aria-label={n > 0 ? t("notificationsN", { count: n }) : t("notifications")}
            className="pointer-events-auto relative flex h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-trait bg-surface shadow-sm"
          >
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 16V11a6 6 0 1112 0v5l2 2H4zM10 21h4" />
            </svg>
            {n > 0 ? (
              <span aria-hidden="true" className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-alerte px-1 text-[0.6875rem] font-extrabold text-white">
                {n}
              </span>
            ) : null}
          </button>
        </div>
      </div>
      {ouvert ? (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={te("notifications.titre")}>
          <button type="button" tabIndex={-1} aria-label={te("common.fermer")} onClick={() => setOuvert(false)} className="absolute inset-0 bg-black/40" />
          <div className="relative mx-auto mt-3 flex max-h-[85dvh] w-[calc(100%-1.5rem)] max-w-md flex-col gap-3 overflow-y-auto rounded-3xl bg-fond p-4 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-extrabold">{te("notifications.titre")}</h2>
              <button ref={fermer} type="button" onClick={() => { setOuvert(false); bouton.current?.focus(); }} aria-label={te("common.fermer")} className="flex h-10 w-10 items-center justify-center rounded-full border-[1.5px] border-trait bg-surface">
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <ListeNotifications surChoix={() => setOuvert(false)} />
          </div>
        </div>
      ) : null}
    </>
  );
}
