"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Alerte, Bouton, CARTE, Ecran, LienBouton, Titre } from "@/components/ui";
import { ApiError, lireRecharge, obtenirPortefeuille, simulerRecharge } from "@/lib/api";

/**
 * Page de paiement du faux prestataire (développement et démonstration). Avec un vrai prestataire (CinetPay,
 * Notchpay), cette étape est une page hébergée par lui et le résultat arrive par webhook : rien ne change ailleurs.
 */
function Contenu() {
  const t = useTranslations("portefeuille.paiement");
  const te = useTranslations();
  const qc = useQueryClient();
  const reference = useSearchParams().get("reference") ?? "";
  const portefeuille = useQuery({ queryKey: ["portefeuille"], queryFn: obtenirPortefeuille });
  const recharge = useQuery({
    queryKey: ["recharge", reference],
    queryFn: () => lireRecharge(reference),
    enabled: reference !== "",
    refetchInterval: (q) => (q.state.data?.statut === "EN_ATTENTE" ? 3000 : false),
  });
  const conclure = useMutation({
    mutationFn: (issue: "REUSSIE" | "ECHOUEE") => simulerRecharge(reference, issue),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recharge", reference] });
      qc.invalidateQueries({ queryKey: ["portefeuille"] });
    },
  });
  const r = recharge.data;
  const erreur = recharge.error ?? conclure.error;
  return (
    <Ecran nav>
      <Titre>{t("titre")}</Titre>
      {erreur ? <Alerte ton="danger">{te(erreur instanceof ApiError ? erreur.cle : "errors.generique")}</Alerte> : null}
      {portefeuille.data && !portefeuille.data.prestataireSimule ? <Alerte>{t("pasSimule")}</Alerte> : null}
      {r ? (
        <section className={`${CARTE} flex flex-col gap-3 px-4 py-4`}>
          <p className="text-xs font-extrabold uppercase tracking-wide text-avertissement">{t("simule")}</p>
          <p className="text-xs text-discret">{t("simuleAide")}</p>
          <p className="text-lg font-extrabold">{t("montant", { montant: r.montant.toLocaleString("fr-FR") })}</p>
          {r.statut === "EN_ATTENTE" ? (
            <>
              <p role="status" className="text-sm text-discret">{t("attente")}</p>
              <Bouton type="button" disabled={conclure.isPending} onClick={() => conclure.mutate("REUSSIE")}>{t("payer")}</Bouton>
              <Bouton type="button" disabled={conclure.isPending} onClick={() => conclure.mutate("ECHOUEE")} className="!bg-transparent !text-marque">{t("echouer")}</Bouton>
            </>
          ) : (
            <>
              <Alerte ton={r.statut === "REUSSIE" ? "info" : "danger"}>{r.statut === "REUSSIE" ? t("reussi") : t("echoue")}</Alerte>
              <LienBouton href="/portefeuille">{t("retour")}</LienBouton>
            </>
          )}
        </section>
      ) : null}
    </Ecran>
  );
}

export default function PagePaiement() {
  return (
    <Suspense>
      <Contenu />
    </Suspense>
  );
}
