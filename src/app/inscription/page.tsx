"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Alerte, Bouton, CaseACocher, Champ, Ecran, Logo, Titre } from "@/components/ui";
import { ApiError, inscrire } from "@/lib/api";
import { inscriptionSchema, type InscriptionValues } from "@/lib/schemas";

export default function PageInscription() {
  const t = useTranslations();
  const router = useRouter();
  const { register, handleSubmit, formState } = useForm<InscriptionValues>({
    resolver: zodResolver(inscriptionSchema),
    mode: "onTouched",
  });
  const envoi = useMutation({ mutationFn: inscrire, onSuccess: () => router.push("/verification") });
  const e = formState.errors;
  const msg = (m?: string) => (m ? t(m) : undefined);

  return (
    <Ecran>
      <div className="mt-2">
        <Logo />
      </div>
      <Titre sousTitre={t("inscription.sousTitre")}>{t("inscription.accroche")}</Titre>
      <form noValidate onSubmit={handleSubmit((v) => envoi.mutate(v))} className="flex flex-col gap-4">
        <Champ id="email" type="email" autoComplete="email" inputMode="email" label={t("inscription.email")} erreur={msg(e.email?.message)} {...register("email")} />
        <Champ id="pseudo" autoComplete="nickname" label={t("inscription.pseudo")} erreur={msg(e.pseudo?.message)} {...register("pseudo")} />
        <Champ id="motDePasse" type="password" autoComplete="new-password" label={t("inscription.motDePasse")} erreur={msg(e.motDePasse?.message)} {...register("motDePasse")} />
        <CaseACocher id="majeur" erreur={msg(e.majeur?.message)} {...register("majeur")}>
          {t("inscription.majeur")}
        </CaseACocher>
        <CaseACocher id="cgu" erreur={msg(e.cgu?.message)} {...register("cgu")}>
          {t("inscription.cgu")}
        </CaseACocher>
        {envoi.error ? <Alerte ton="danger">{t(envoi.error instanceof ApiError ? envoi.error.cle : "errors.generique")}</Alerte> : null}
        <Bouton type="submit" disabled={envoi.isPending}>
          {envoi.isPending ? t("common.chargement") : t("inscription.creer")}
        </Bouton>
      </form>
      <p className="text-center text-sm text-discret">
        {t("inscription.dejaInscrit")}{" "}
        <Link href="/connexion" className="font-bold text-marque underline">
          {t("inscription.seConnecter")}
        </Link>
      </p>
    </Ecran>
  );
}
