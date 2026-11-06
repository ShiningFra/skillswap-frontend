"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  Alerte,
  Bouton,
  Champ,
  Ecran,
  IconeSucces,
  LienBouton,
  Titre,
} from "@/components/ui";
import { ApiError, reinitialiserMotDePasse } from "@/lib/api";
import {
  reinitialisationSchema,
  type ReinitialisationValues,
} from "@/lib/schemas";

export function ReinitialisationVue() {
  const t = useTranslations("oubli");
  const te = useTranslations();
  const jeton = useSearchParams().get("jeton") ?? "";
  const form = useForm<ReinitialisationValues>({
    resolver: zodResolver(reinitialisationSchema),
    defaultValues: { nouveau: "", confirmation: "" },
  });
  const envoi = useMutation({
    mutationFn: (v: ReinitialisationValues) =>
      reinitialiserMotDePasse(jeton, v.nouveau),
  });
  const e = form.formState.errors;
  const msg = (m?: string) => (m ? te(m) : undefined);

  if (envoi.isSuccess) {
    return (
      <Ecran>
        <div className="flex flex-1 flex-col items-start gap-4 pt-8">
          <IconeSucces />
          <Titre sousTitre={t("reussiTexte")}>{t("reussiTitre")}</Titre>
          <LienBouton href="/connexion" className="mt-auto">
            {t("seConnecter")}
          </LienBouton>
        </div>
      </Ecran>
    );
  }
  if (!jeton) {
    return (
      <Ecran>
        <Titre sousTitre={t("lienInvalideTexte")}>{t("lienInvalide")}</Titre>
        <LienBouton href="/mot-de-passe-oublie">{t("redemander")}</LienBouton>
      </Ecran>
    );
  }
  return (
    <Ecran>
      <Titre sousTitre={t("nouveauIntro")}>{t("nouveauTitre")}</Titre>
      <form
        noValidate
        className="flex flex-1 flex-col gap-4"
        onSubmit={form.handleSubmit((v) => envoi.mutate(v))}
      >
        <Champ
          id="nouveau"
          type="password"
          autoComplete="new-password"
          label={t("nouveau")}
          aide={t("aideMdp")}
          erreur={msg(e.nouveau?.message)}
          {...form.register("nouveau")}
        />
        <Champ
          id="confirmation"
          type="password"
          autoComplete="new-password"
          label={t("confirmation")}
          erreur={msg(e.confirmation?.message)}
          {...form.register("confirmation")}
        />
        {envoi.error ? (
          <Alerte ton="danger">
            {te(
              envoi.error instanceof ApiError
                ? envoi.error.cle
                : "errors.generique",
            )}{" "}
            {envoi.error instanceof ApiError &&
            envoi.error.cle === "errors.jetonInvalide" ? (
              <a href="/mot-de-passe-oublie" className="font-bold underline">
                {t("redemander")}
              </a>
            ) : null}
          </Alerte>
        ) : null}
        <Bouton type="submit" disabled={envoi.isPending} className="mt-auto">
          {envoi.isPending ? te("common.chargement") : t("changer")}
        </Bouton>
      </form>
    </Ecran>
  );
}
