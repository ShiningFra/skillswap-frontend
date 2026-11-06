"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import {
  Alerte,
  Bouton,
  Champ,
  Ecran,
  IconeSucces,
  LienBouton,
  LienRetour,
  Titre,
} from "@/components/ui";
import { ApiError, demanderReinitialisation } from "@/lib/api";
import { emailSchema, type EmailValues } from "@/lib/schemas";

export default function PageMotDePasseOublie() {
  const t = useTranslations("oubli");
  const te = useTranslations();
  const form = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });
  const envoi = useMutation({
    mutationFn: (v: EmailValues) => demanderReinitialisation(v.email),
  });
  const e = form.formState.errors;

  if (envoi.isSuccess) {
    return (
      <Ecran>
        <div className="flex flex-1 flex-col items-start gap-4 pt-8">
          <IconeSucces />
          <Titre sousTitre={t("envoyeTexte")}>{t("envoyeTitre")}</Titre>
          <LienBouton href="/connexion" className="mt-auto">
            {t("retourConnexion")}
          </LienBouton>
        </div>
      </Ecran>
    );
  }
  return (
    <Ecran>
      <LienRetour href="/connexion" label={te("common.retour")} />
      <Titre sousTitre={t("intro")}>{t("titre")}</Titre>
      <form
        noValidate
        className="flex flex-1 flex-col gap-4"
        onSubmit={form.handleSubmit((v) => envoi.mutate(v))}
      >
        <Champ
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          label={t("email")}
          erreur={e.email?.message ? te(e.email.message) : undefined}
          {...form.register("email")}
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
        <Bouton type="submit" disabled={envoi.isPending} className="mt-auto">
          {envoi.isPending ? te("common.chargement") : t("envoyer")}
        </Bouton>
      </form>
    </Ecran>
  );
}
