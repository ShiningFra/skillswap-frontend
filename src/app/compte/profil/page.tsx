"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Alerte,
  Bouton,
  Champ,
  Ecran,
  LienRetour,
  Titre,
} from "@/components/ui";
import { ApiError, modifierProfil, obtenirMoi } from "@/lib/api";
import { profilSchema, type ProfilValues } from "@/lib/schemas";

function Formulaire() {
  const t = useTranslations("compte");
  const te = useTranslations();
  const qc = useQueryClient();
  const moi = useQuery({ queryKey: ["moi"], queryFn: obtenirMoi });
  const form = useForm<ProfilValues>({
    resolver: zodResolver(profilSchema),
    defaultValues: { pseudo: "", bio: "", ville: "" },
  });
  useEffect(() => {
    if (moi.data)
      form.reset({
        pseudo: moi.data.pseudo,
        bio: moi.data.bio ?? "",
        ville: moi.data.ville ?? "",
      });
  }, [moi.data, form]);
  const envoi = useMutation({
    mutationFn: modifierProfil,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["moi"] }),
  });
  const e = form.formState.errors;
  const msg = (m?: string) => (m ? te(m) : undefined);
  const manuel = moi.data?.modeLocalisation === "MANUELLE";

  return (
    <>
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit((v) => envoi.mutate(v))}
      >
        <Champ
          id="pseudo"
          autoComplete="nickname"
          label={t("pseudo")}
          erreur={msg(e.pseudo?.message)}
          {...form.register("pseudo")}
        />
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="bio"
            className="text-[0.8125rem] font-bold text-encre/80"
          >
            {t("bio")}
          </label>
          <textarea
            id="bio"
            rows={3}
            maxLength={500}
            aria-describedby="bio-aide"
            className="resize-none rounded-xl border-[1.5px] border-bord bg-surface px-3.5 py-3 text-base"
            {...form.register("bio")}
          />
          <p id="bio-aide" className="text-xs text-discret">
            {t("bioAide")}
          </p>
          {e.bio ? (
            <p
              role="alert"
              className="text-[0.8125rem] font-semibold text-alerte"
            >
              {msg(e.bio.message)}
            </p>
          ) : null}
        </div>
        {manuel ? (
          <Champ
            id="ville"
            label={t("ville")}
            aide={t("villeAide")}
            erreur={msg(e.ville?.message)}
            {...form.register("ville")}
          />
        ) : null}
        {envoi.error ? (
          <Alerte ton="danger">
            {te(
              envoi.error instanceof ApiError
                ? envoi.error.cle
                : "errors.generique",
            )}
          </Alerte>
        ) : null}
        {envoi.isSuccess ? <Alerte>{t("enregistre")}</Alerte> : null}
        <Bouton type="submit" disabled={envoi.isPending}>
          {envoi.isPending ? te("common.chargement") : t("enregistrer")}
        </Bouton>
      </form>
    </>
  );
}

export default function PageProfil() {
  const t = useTranslations("compte");
  const te = useTranslations();
  return (
    <Ecran nav>
      <LienRetour href="/compte" label={te("common.retour")} />
      <Titre sousTitre={t("profilIntro")}>{t("profilTitre")}</Titre>
      <Formulaire />
    </Ecran>
  );
}
