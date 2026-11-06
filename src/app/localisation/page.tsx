"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Alerte, Bouton, CaseACocher, Champ, Ecran, Titre } from "@/components/ui";
import { definirLocalisation } from "@/lib/api";
import type { ModeLocalisation } from "@/lib/domain";
import { localisationSchema, type LocalisationValues } from "@/lib/schemas";

const ICONES: Record<ModeLocalisation, ReactNode> = {
  AUTOMATIQUE: (
    <>
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </>
  ),
  MANUELLE: (
    <>
      <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
  AUCUNE: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </>
  ),
};
const MODES: { mode: ModeLocalisation; cle: "automatique" | "manuelle" | "aucune" }[] = [
  { mode: "AUTOMATIQUE", cle: "automatique" },
  { mode: "MANUELLE", cle: "manuelle" },
  { mode: "AUCUNE", cle: "aucune" },
];

export default function PageLocalisation() {
  const t = useTranslations("localisation");
  const te = useTranslations();
  const router = useRouter();
  const { register, handleSubmit, control, formState } = useForm<LocalisationValues>({
    resolver: zodResolver(localisationSchema),
    defaultValues: { mode: "AUTOMATIQUE" },
  });
  const mode = useWatch({ control, name: "mode" });
  const envoi = useMutation({ mutationFn: definirLocalisation, onSuccess: () => router.push("/competences") });
  const erreurs = formState.errors as { ville?: { message?: string }; consentement?: { message?: string } };

  return (
    <Ecran>
      <Titre sousTitre={t("intro")}>{t("titre")}</Titre>
      <form noValidate className="flex flex-1 flex-col gap-4" onSubmit={handleSubmit((v) => envoi.mutate(v))}>
        <fieldset className="flex flex-col gap-2">
          <legend className="sr-only">{t("titre")}</legend>
          {MODES.map(({ mode: m, cle }) => (
            <label key={m} className={`flex cursor-pointer items-center gap-3.5 rounded-2xl border-2 bg-surface p-4 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-marque ${mode === m ? "border-marque" : "border-trait"}`}>
              <input type="radio" value={m} className="sr-only" {...register("mode")} />
              <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0e6b5c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                {ICONES[m]}
              </svg>
              <span className="flex flex-col gap-0.5">
                <span className="text-base font-bold">{t(cle)}</span>
                <span className="text-sm leading-snug text-discret">{t(`${cle}Aide`)}</span>
              </span>
            </label>
          ))}
        </fieldset>

        {mode === "MANUELLE" ? <Champ id="ville" label={t("ville")} erreur={erreurs.ville?.message ? te(erreurs.ville.message) : undefined} {...register("ville" as never)} /> : null}

        {mode === "AUTOMATIQUE" ? (
          <>
            <Alerte>
              <strong>{t("pourquoiTitre")}</strong> {t("pourquoi")}
            </Alerte>
            <CaseACocher id="consentement" erreur={erreurs.consentement?.message ? te(erreurs.consentement.message) : undefined} {...register("consentement" as never)}>
              {t("consentement")}
            </CaseACocher>
          </>
        ) : null}

        <Bouton type="submit" disabled={envoi.isPending} className="mt-auto">
          {envoi.isPending ? te("common.chargement") : te("common.continuer")}
        </Bouton>
      </form>
    </Ecran>
  );
}
