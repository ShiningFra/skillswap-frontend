"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import {
  Alerte,
  Bouton,
  Champ,
  Ecran,
  LienRetour,
  Titre,
} from "@/components/ui";
import { ApiError, changerMotDePasse, obtenirMoi } from "@/lib/api";
import { motDePasseSchema, type MotDePasseValues } from "@/lib/schemas";

function Formulaire() {
  const t = useTranslations("compte");
  const te = useTranslations();
  const form = useForm<MotDePasseValues>({
    resolver: zodResolver(motDePasseSchema),
    defaultValues: { actuel: "", nouveau: "", confirmation: "" },
  });
  const qc = useQueryClient();
  const moi = useQuery({ queryKey: ["moi"], queryFn: obtenirMoi });
  const provisoire = moi.data?.mdpProvisoire === true;
  const envoi = useMutation({
    mutationFn: changerMotDePasse,
    onSuccess: () => {
      form.reset();
      if (provisoire) {
        qc.clear();
        window.location.assign("/admin");
      }
    },
  });
  const e = form.formState.errors;
  const msg = (m?: string) => (m ? te(m) : undefined);
  return (
    <>
      {provisoire ? <Alerte ton="avertissement">{t("mdpProvisoireBandeau")}</Alerte> : null}
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit((v) => envoi.mutate(v))}
      >
        <Champ
          id="mdp-actuel"
          type="password"
          autoComplete="current-password"
          label={t("mdpActuel")}
          erreur={msg(e.actuel?.message)}
          {...form.register("actuel")}
        />
        <Champ
          id="mdp-nouveau"
          type="password"
          autoComplete="new-password"
          label={t("mdpNouveau")}
          aide={t("mdpAide")}
          erreur={msg(e.nouveau?.message)}
          {...form.register("nouveau")}
        />
        <Champ
          id="mdp-confirmation"
          type="password"
          autoComplete="new-password"
          label={t("mdpConfirmation")}
          erreur={msg(e.confirmation?.message)}
          {...form.register("confirmation")}
        />
        {envoi.error ? (
          <Alerte ton="danger">
            {te(
              envoi.error instanceof ApiError
                ? envoi.error.cle
                : "errors.generique",
            )}
          </Alerte>
        ) : null}
        {envoi.isSuccess ? <Alerte>{t("mdpChange")}</Alerte> : null}
        <Bouton type="submit" disabled={envoi.isPending}>
          {envoi.isPending ? te("common.chargement") : t("mdpChanger")}
        </Bouton>
      </form>
    </>
  );
}

export default function PageMotDePasse() {
  const t = useTranslations("compte");
  const te = useTranslations();
  return (
    <Ecran nav>
      <LienRetour href="/compte" label={te("common.retour")} />
      <Titre sousTitre={t("mdpIntro")}>{t("mdpTitre")}</Titre>
      <Formulaire />
    </Ecran>
  );
}
