"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Alerte, Bouton, Ecran, LienRetour, Titre } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { activerPush, desactiverPush, etatPush } from "@/lib/push";

export default function PageNotificationsAppareil() {
  const t = useTranslations("compte");
  const te = useTranslations();
  const qc = useQueryClient();
  const etat = useQuery({ queryKey: ["push", "etat"], queryFn: etatPush, staleTime: 0, retry: false });
  const rafraichir = () => qc.invalidateQueries({ queryKey: ["push", "etat"] });
  const activer = useMutation({ mutationFn: activerPush, onSuccess: rafraichir, onError: rafraichir });
  const desactiver = useMutation({ mutationFn: desactiverPush, onSuccess: rafraichir });
  const e = etat.data;

  return (
    <Ecran nav>
      <LienRetour href="/compte" label={te("common.retour")} />
      <Titre sousTitre={t("pushIntro")}>{t("pushTitre")}</Titre>
      {e === "actif" ? <Alerte>{t("pushActif")}</Alerte> : null}
      {e === "inactif" ? <Alerte ton="avertissement">{t("pushInactif")}</Alerte> : null}
      {e === "refuse" ? <Alerte ton="danger">{t("pushRefuse")}</Alerte> : null}
      {e === "indisponible" ? <Alerte ton="avertissement">{t("pushIndisponible")}</Alerte> : null}
      {e === "ios-installer" ? <Alerte ton="avertissement">{t("pushIphone")}</Alerte> : null}
      {activer.error ? <Alerte ton="danger">{te(activer.error instanceof ApiError ? activer.error.cle : "errors.generique")}</Alerte> : null}
      {e === "inactif" ? (
        <Bouton type="button" onClick={() => activer.mutate()} disabled={activer.isPending}>
          {t("pushActiver")}
        </Bouton>
      ) : null}
      {e === "actif" ? (
        <button type="button" onClick={() => desactiver.mutate()} disabled={desactiver.isPending} className="min-h-[52px] rounded-2xl border-2 border-trait bg-surface text-base font-bold disabled:opacity-60">
          {t("pushDesactiver")}
        </button>
      ) : null}
    </Ecran>
  );
}
