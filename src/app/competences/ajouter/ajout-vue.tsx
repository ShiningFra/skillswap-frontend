"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Alerte, Bouton, Champ, Ecran, LienRetour, Selecteur, Titre } from "@/components/ui";
import { ApiError, declarerCompetence, listerCompetences, proposerCompetence } from "@/lib/api";
import type { Competence } from "@/lib/domain";
import { BandeauRevision } from "@/components/bandeau-revision";
import { useParametres } from "@/lib/parametres";
import { classer, fusionner } from "@/lib/recherche-floue";
import { useProchesDuSens } from "@/lib/semantique";
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
        <ChoixCompetence
          catalogue={catalogue.data ?? []}
          valeur={form.watch("competenceId")}
          erreur={msg(e.competenceId?.message)}
          surChoix={(c) => form.setValue("competenceId", c.id, { shouldValidate: true })}
        />
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

/** Recherche tolérante dans le catalogue, parcours par catégorie, et proposition d'une compétence absente. */
function ChoixCompetence({ catalogue, valeur, erreur, surChoix }: { catalogue: Competence[]; valeur: string; erreur?: string; surChoix: (c: Competence) => void }) {
  const t = useTranslations("competences");
  const te = useTranslations();
  const creationPossible = useParametres().actif("propositions_competences");
  const qc = useQueryClient();
  const [texte, setTexte] = useState("");
  const [categorie, setCategorie] = useState("");
  const [creation, setCreation] = useState(false);
  const [categorieNeuve, setCategorieNeuve] = useState("");
  const categories = useMemo(() => {
    const m = new Map<string, string>();
    catalogue.forEach((c) => m.set(c.categorieId, c.categorie ?? c.categorieId));
    return [...m].map(([id, libelle]) => ({ id, libelle })).sort((a, b) => a.libelle.localeCompare(b.libelle, "fr"));
  }, [catalogue]);
  const choisie = catalogue.find((c) => c.id === valeur);
  const sens = useProchesDuSens(texte);
  const propositions = texte.trim() ? fusionner(classer(texte, catalogue, 8), sens, catalogue, 8).map((r) => r.competence) : categorie ? catalogue.filter((c) => c.categorieId === categorie) : [];
  const proposer = useMutation({
    mutationFn: proposerCompetence,
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: ["catalogue"] });
      surChoix(c);
      setCreation(false);
      setTexte("");
    },
  });

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="recherche-competence" className="text-[0.8125rem] font-bold text-encre/80">
        {t("competence")}
      </label>
      {choisie ? (
        <p className="flex items-center justify-between gap-2 rounded-xl border-[1.5px] border-marque bg-surface px-3 py-2.5 font-semibold">
          <span>{choisie.libelle}</span>
          <button type="button" onClick={() => surChoix({ ...choisie, id: "" })} className="min-h-11 px-2 text-sm font-bold text-marque">
            {t("changer")}
          </button>
        </p>
      ) : (
        <>
          <input id="recherche-competence" type="search" value={texte} onChange={(e) => { setTexte(e.target.value); setCreation(false); }} placeholder={t("rechercherPlaceholder")} autoComplete="off" aria-invalid={erreur ? true : undefined} className="min-h-[50px] rounded-xl border-[1.5px] border-bord bg-surface px-3 text-base" />
          {!texte.trim() ? (
            <select aria-label={t("parCategorie")} value={categorie} onChange={(e) => setCategorie(e.target.value)} className="min-h-[50px] rounded-xl border-[1.5px] border-bord bg-surface px-3 text-base">
              <option value="">{t("parCategorie")}</option>
              {categories.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.libelle}
                </option>
              ))}
            </select>
          ) : null}
          {propositions.length > 0 ? (
            <ul className="flex flex-col gap-1.5">
              {propositions.map((c) => (
                <li key={c.id}>
                  <button type="button" onClick={() => surChoix(c)} className="flex min-h-11 w-full flex-col items-start rounded-xl border-[1.5px] border-bord bg-surface px-3 py-2 text-left">
                    <span className="font-semibold">{c.libelle}</span>
                    {c.categorie ? <span className="text-xs text-discret">{c.categorie}</span> : null}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {texte.trim().length >= 2 && !creation && creationPossible ? (
            <button type="button" onClick={() => setCreation(true)} className="min-h-11 rounded-xl border-[1.5px] border-dashed border-marque px-3 text-left text-sm font-bold text-marque">
              {t("pasTrouve", { terme: texte.trim() })}
            </button>
          ) : null}
          {texte.trim().length >= 2 && propositions.length === 0 && !creationPossible ? <BandeauRevision cle="propositions_competences" /> : null}
          {creation && creationPossible ? (
            <div className="flex flex-col gap-2 rounded-xl border-[1.5px] border-bord bg-surface p-3">
              <p className="text-sm text-discret">{t("proposerAide")}</p>
              <select aria-label={t("categorie")} value={categorieNeuve} onChange={(e) => setCategorieNeuve(e.target.value)} className="min-h-[50px] rounded-xl border-[1.5px] border-bord bg-surface px-3 text-base">
                <option value="">{t("categorie")}</option>
                {categories.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.libelle}
                  </option>
                ))}
              </select>
              <Bouton type="button" disabled={!categorieNeuve || proposer.isPending} onClick={() => proposer.mutate({ libelle: texte.trim(), categorieId: categorieNeuve })}>
                {t("proposerBouton", { terme: texte.trim() })}
              </Bouton>
              {proposer.error ? <Alerte ton="danger">{te(proposer.error instanceof ApiError ? proposer.error.cle : "errors.generique")}</Alerte> : null}
            </div>
          ) : null}
        </>
      )}
      {erreur ? (
        <p role="alert" className="text-[0.8125rem] font-semibold text-alerte">
          {erreur}
        </p>
      ) : null}
    </div>
  );
}
