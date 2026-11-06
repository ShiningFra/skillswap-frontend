"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Alerte, Bouton, Champ, Ecran, LienRetour, Selecteur, Titre } from "@/components/ui";
import { ApiError, declarerCompetence, listerCompetences } from "@/lib/api";
import { FORMATS, NIVEAUX, type SensCompetence } from "@/lib/domain";
import { declarationSchema, type DeclarationValues } from "@/lib/schemas";

/** Le sens (je propose / je cherche) vient de l'adresse : il n'y a donc qu'une seule source de vérité. */
export function AjoutCompetenceVue() {
  const sens: SensCompetence = useSearchParams().get("sens") === "RECHERCHEE" ? "RECHERCHEE" : "OFFERTE";
  return <Formulaire key={sens} sens={sens} />;
}

function Formulaire({ sens }: { sens: SensCompetence }) {
  const t = useTranslations("competences");
  const te = useTranslations();
  const qc = useQueryClient();
  const router = useRouter();

  const catalogue = useQuery({ queryKey: ["catalogue"], queryFn: listerCompetences, staleTime: Infinity });
  const form = useForm<DeclarationValues>({
    resolver: zodResolver(declarationSchema),
    defaultValues: { competenceId: "", sens, niveau: "INTERMEDIAIRE", format: "LES_DEUX", preuveUrl: "" },
  });
  const ajout = useMutation({
    mutationFn: declarerCompetence,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["declarations"] });
      router.push(`/competences?sens=${sens}`);
    },
  });
  const e = form.formState.errors;
  const msg = (m?: string) => (m ? te(m) : undefined);

  return (
    <Ecran nav>
      <LienRetour href={`/competences?sens=${sens}`} label={te("common.retour")} />
      <Titre sousTitre={sens === "OFFERTE" ? t("ajouterIntroOfferte") : t("ajouterIntroRecherchee")}>
        {sens === "OFFERTE" ? t("ajouterTitreOfferte") : t("ajouterTitreRecherchee")}
      </Titre>

      <form noValidate className="flex flex-col gap-4" onSubmit={form.handleSubmit((v) => ajout.mutate(v))}>
        <Selecteur id="competenceId" label={t("competence")} erreur={msg(e.competenceId?.message)} {...form.register("competenceId")}>
          <option value="">{t("choisir")}</option>
          {(catalogue.data ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.libelle}
            </option>
          ))}
        </Selecteur>
        <Selecteur id="niveau" label={t("niveau")} {...form.register("niveau")}>
          {NIVEAUX.map((n) => (
            <option key={n} value={n}>
              {te(`niveaux.${n}`)}
            </option>
          ))}
        </Selecteur>
        <Selecteur id="format" label={t("format")} {...form.register("format")}>
          {FORMATS.map((f) => (
            <option key={f} value={f}>
              {te(`formats.${f}`)}
            </option>
          ))}
        </Selecteur>
        {sens === "OFFERTE" ? <Champ id="preuveUrl" type="url" inputMode="url" placeholder="https://" label={t("preuve")} aide={t("preuveAide")} erreur={msg(e.preuveUrl?.message)} {...form.register("preuveUrl")} /> : null}
        {ajout.error ? <Alerte ton="danger">{te(ajout.error instanceof ApiError ? ajout.error.cle : "errors.generique")}</Alerte> : null}
        <Bouton type="submit" disabled={ajout.isPending}>
          {ajout.isPending ? te("common.chargement") : t("ajouter")}
        </Bouton>
      </form>
    </Ecran>
  );
}
