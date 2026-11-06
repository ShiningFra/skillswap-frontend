"use client";

import { desactiverPush } from "@/lib/push";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { CARTE, Ecran, LienRetour, Titre } from "@/components/ui";
import { obtenirMoi, seDeconnecter } from "@/lib/api";

function Chevron() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0 text-discret"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

const LIGNE =
  "flex min-h-16 w-full items-center justify-between gap-3 px-4 py-3 text-left";

function Option({
  href,
  titre,
  detail,
  danger = false,
}: {
  href: string;
  titre: string;
  detail?: string;
  danger?: boolean;
}) {
  return (
    <li>
      <Link href={href} className={LIGNE}>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span
            className={`text-base font-bold ${danger ? "text-alerte" : ""}`}
          >
            {titre}
          </span>
          {detail ? (
            <span className="truncate text-[0.8125rem] text-discret">
              {detail}
            </span>
          ) : null}
        </span>
        <Chevron />
      </Link>
    </li>
  );
}

export default function PageCompte() {
  const t = useTranslations("compte");
  const te = useTranslations();
  const qc = useQueryClient();
  const moi = useQuery({ queryKey: ["moi"], queryFn: obtenirMoi });
  const sortie = useMutation({
    mutationFn: async () => {
      await desactiverPush().catch(() => undefined);
      await seDeconnecter();
    },
    onSuccess: () => {
      qc.clear();
      window.location.assign("/connexion");
    },
  });
  const m = moi.data;

  return (
    <Ecran nav>
      <LienRetour href="/competences" label={te("common.retour")} />
      <Titre sousTitre={m?.pseudo}>{t("titre")}</Titre>
      <ul className={`${CARTE} divide-y divide-trait overflow-hidden`}>
        <Option
          href="/compte/profil"
          titre={t("menuProfil")}
          detail={t("menuProfilDetail")}
        />
        <Option
          href="/localisation"
          titre={t("localisationTitre")}
          detail={m?.ville ?? t("menuLocalisationDetail")}
        />
        <Option
          href="/compte/telephone"
          titre={t("telTitre")}
          detail={m?.telephoneMasque ?? t("menuTelAucun")}
        />
        <Option
          href="/compte/mot-de-passe"
          titre={t("mdpTitre")}
          detail={t("menuMdpDetail")}
        />
        <Option
          href="/compte/notifications"
          titre={t("menuNotifs")}
          detail={t("menuNotifsDetail")}
        />
        <Option
          href="/creneaux"
          titre={t("voirProfil")}
          detail={t("menuCreneauxDetail")}
        />
        {m?.role === "ADMIN" ? (
          <Option
            href="/admin"
            titre={t("menuAdmin")}
            detail={t("menuAdminDetail")}
          />
        ) : null}
      </ul>
      <ul className={`${CARTE} divide-y divide-trait overflow-hidden`}>
        <li>
          <button
            type="button"
            onClick={() => sortie.mutate()}
            disabled={sortie.isPending}
            className={`${LIGNE} disabled:opacity-60`}
          >
            <span className="text-base font-bold text-marque">{t("deconnexion")}</span>
          </button>
        </li>
        <Option href="/compte/suppression" titre={t("supprimerTitre")} danger />
      </ul>
    </Ecran>
  );
}
