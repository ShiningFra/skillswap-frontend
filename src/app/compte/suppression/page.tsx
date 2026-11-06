"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Alerte, Champ, Ecran, LienRetour, Titre } from "@/components/ui";
import { ApiError, supprimerCompte } from "@/lib/api";

export default function PageSuppression() {
  const t = useTranslations("compte");
  const te = useTranslations();
  const qc = useQueryClient();
  const [motDePasse, setMotDePasse] = useState("");
  const suppression = useMutation({
    mutationFn: () => supprimerCompte(motDePasse),
    onSuccess: () => {
      qc.clear();
      window.location.assign("/connexion");
    },
  });
  return (
    <Ecran nav>
      <LienRetour href="/compte" label={te("common.retour")} />
      <Titre sousTitre={t("supprimerTexte")}>{t("supprimerTitre")}</Titre>
      <form
        noValidate
        className="flex flex-1 flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (motDePasse) suppression.mutate();
        }}
      >
        <Champ
          id="mdp-suppression"
          type="password"
          autoComplete="current-password"
          label={t("confirmerMdp")}
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
        />
        {suppression.error ? (
          <Alerte ton="danger">
            {te(
              suppression.error instanceof ApiError
                ? suppression.error.cle
                : "errors.generique",
            )}
          </Alerte>
        ) : null}
        <button
          type="submit"
          disabled={suppression.isPending || !motDePasse}
          className="mt-auto min-h-[52px] rounded-2xl bg-alerte text-base font-bold text-white disabled:opacity-60"
        >
          {t("supprimerDefinitif")}
        </button>
      </form>
    </Ecran>
  );
}
