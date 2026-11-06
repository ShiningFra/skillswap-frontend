"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Alerte, Bouton, CARTE, Champ, Ecran, LienBouton, LienRetour, Pastille, Selecteur, Titre } from "@/components/ui";
import { ApiError, listerCompetences, listerDeclarations, modifierCompetence, retirerCompetence } from "@/lib/api";
import { CONFIRMATION, FORMATS, NIVEAUX, type DeclarationCompetence, type SensCompetence } from "@/lib/domain";
import { modificationCompetenceSchema, type ModificationCompetenceValues } from "@/lib/schemas";

/** Carte d'une compétence déclarée, avec modification du niveau, du format et du lien de preuve, ou retrait. */
function CarteCompetence({ d, nom, categorie }: { d: DeclarationCompetence; nom: string; categorie?: string }) {
  const t = useTranslations("competences");
  const te = useTranslations();
  const qc = useQueryClient();
  const [edition, setEdition] = useState(false);
  const form = useForm<ModificationCompetenceValues>({
    resolver: zodResolver(modificationCompetenceSchema),
    defaultValues: { niveau: d.niveau, format: d.format, preuveUrl: d.preuveUrl ?? "" },
  });
  const rafraichir = () => qc.invalidateQueries({ queryKey: ["declarations"] });
  const maj = useMutation({
    mutationFn: (v: ModificationCompetenceValues) => modifierCompetence(d.competenceId, v),
    onSuccess: () => {
      setEdition(false);
      return rafraichir();
    },
  });
  const retrait = useMutation({ mutationFn: () => retirerCompetence(d.competenceId), onSuccess: rafraichir });
  const erreur = maj.error ?? retrait.error;
  const e = form.formState.errors;

  return (
    <li className={`${CARTE} flex flex-col gap-2 p-4`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[1.0625rem] font-extrabold">{nom}</span>
        <Pastille>{te(`niveaux.${d.niveau}`)}</Pastille>
      </div>
      <p className="text-sm text-discret">{[categorie, te(`formats.${d.format}`)].filter(Boolean).join(" · ")}</p>
      {d.preuveUrl ? (
        <p className="rounded-[10px] bg-marque-doux px-3 py-2 text-[0.8125rem] font-semibold text-marque-fonce">
          {d.preuveUrl.replace(/^https?:\/\//, "")} · {t("preuveFournie")}
        </p>
      ) : null}
      {edition ? (
        <form noValidate className="mt-1 flex flex-col gap-3" onSubmit={form.handleSubmit((v) => maj.mutate(v))}>
          <Selecteur id={`niveau-${d.competenceId}`} label={t("niveau")} {...form.register("niveau")}>
            {NIVEAUX.map((n) => (
              <option key={n} value={n}>
                {te(`niveaux.${n}`)}
              </option>
            ))}
          </Selecteur>
          <Selecteur id={`format-${d.competenceId}`} label={t("format")} {...form.register("format")}>
            {FORMATS.map((f) => (
              <option key={f} value={f}>
                {te(`formats.${f}`)}
              </option>
            ))}
          </Selecteur>
          {d.sens === "OFFERTE" ? <Champ id={`preuve-${d.competenceId}`} type="url" inputMode="url" placeholder="https://" label={t("preuve")} erreur={e.preuveUrl?.message ? te(e.preuveUrl.message) : undefined} {...form.register("preuveUrl")} /> : null}
          <div className="grid grid-cols-2 gap-2">
            <Bouton type="submit" disabled={maj.isPending}>
              {t("enregistrer")}
            </Bouton>
            <button type="button" onClick={() => setEdition(false)} className="min-h-[52px] rounded-2xl border-2 border-trait bg-surface text-base font-bold">
              {t("fermer")}
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-1 flex gap-2">
          <button type="button" onClick={() => setEdition(true)} aria-label={`${t("modifier")} ${nom}`} className="min-h-11 flex-1 rounded-xl border-[1.5px] border-bord text-sm font-bold text-marque">
            {t("modifier")}
          </button>
          <button type="button" onClick={() => retrait.mutate()} disabled={retrait.isPending} aria-label={`${t("retirer")} ${nom}`} className="min-h-11 flex-1 rounded-xl border-[1.5px] border-bord text-sm font-bold text-alerte disabled:opacity-60">
            {t("retirer")}
          </button>
        </div>
      )}
      {erreur ? <Alerte ton="danger">{te(erreur instanceof ApiError ? erreur.cle : "errors.generique")}</Alerte> : null}
    </li>
  );
}

export function ListeCompetencesVue() {
  const t = useTranslations("competences");
  const te = useTranslations();
  const [sens, setSens] = useState<SensCompetence>(useSearchParams().get("sens") === "RECHERCHEE" ? "RECHERCHEE" : "OFFERTE");

  const catalogue = useQuery({ queryKey: ["catalogue"], queryFn: listerCompetences, staleTime: Infinity });
  const competences = catalogue.data ?? [];
  const liste = useQuery({ queryKey: ["declarations"], queryFn: listerDeclarations });
  const trouver = (id: string) => competences.find((c) => c.id === id);
  const visibles = (liste.data ?? []).filter((d) => d.sens === sens);

  return (
    <Ecran nav>
      <LienRetour href="/accueil" label={te("common.retour")} />
      <Titre sousTitre={t("intro")}>{t("titre")}</Titre>

      <div role="tablist" aria-label={t("titre")} className="grid grid-cols-2 gap-1 rounded-[15px] bg-[#e7eae5] p-1">
        {(["OFFERTE", "RECHERCHEE"] as const).map((s) => (
          <button key={s} role="tab" type="button" aria-selected={sens === s} onClick={() => setSens(s)} className={`min-h-11 rounded-xl text-sm font-bold ${sens === s ? "bg-marque text-white" : "text-[#3c4a44]"}`}>
            {s === "OFFERTE" ? t("jePropose") : t("jeCherche")}
          </button>
        ))}
      </div>

      {liste.error ? (
        <>
          <Alerte ton="danger">{te(liste.error instanceof ApiError ? liste.error.cle : "errors.generique")}</Alerte>
          <LienBouton href="/connexion">{te("connexion.valider")}</LienBouton>
        </>
      ) : null}
      <ul className="flex flex-col gap-2.5" aria-live="polite">
        {visibles.length === 0 ? <li className="text-sm text-discret">{t("aucune")}</li> : null}
        {visibles.map((d) => {
          const c = trouver(d.competenceId);
          return <CarteCompetence key={d.competenceId} d={d} nom={c?.libelle ?? d.competenceId} categorie={c?.categorie} />;
        })}
      </ul>

      <Alerte ton="avertissement">{t("declarativeNote", { sessions: CONFIRMATION.sessionsMin, note: CONFIRMATION.noteMoyenneMin })}</Alerte>

      <Link href={`/competences/ajouter?sens=${sens}`} className="flex min-h-[52px] items-center justify-center rounded-2xl border-2 border-dashed border-[#9fb3ab] text-[0.9375rem] font-bold text-marque">
        + {t("ajouterBouton")}
      </Link>

      <LienBouton href="/accueil">{t("voirSuggestions")}</LienBouton>
      <Link href="/sessions" className="flex min-h-12 items-center justify-between rounded-[14px] border-[1.5px] border-trait bg-surface px-4 text-[0.9375rem] font-extrabold">
        {t("sessions")}
        <span aria-hidden="true">›</span>
      </Link>
      <Link href="/creneaux" className="flex min-h-12 items-center justify-between rounded-[14px] border-[1.5px] border-trait bg-surface px-4 text-[0.9375rem] font-extrabold">
        {t("mesCreneaux")}
        <span aria-hidden="true">›</span>
      </Link>
      <Link href="/compte" className="flex min-h-12 items-center justify-between rounded-[14px] border-[1.5px] border-trait bg-surface px-4 text-[0.9375rem] font-extrabold">
        {t("monCompte")}
        <span aria-hidden="true">›</span>
      </Link>
    </Ecran>
  );
}
