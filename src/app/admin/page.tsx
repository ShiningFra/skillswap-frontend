"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { Alerte, CARTE, LienBouton, Pastille } from "@/components/ui";
import { ApiError, deciderSignalement, detailSignalementAdmin, listerSignalementsAdmin, obtenirIndicateursAdmin } from "@/lib/api";
import type { DecisionModeration } from "@/lib/domain";
import { ilYa } from "@/lib/format";

function Tuile({ valeur, titre, aide }: { valeur: string; titre: string; aide?: string }) {
  return (
    <div className={`${CARTE} flex flex-col gap-1 p-4`}>
      <p className="text-[1.75rem] font-extrabold leading-none text-marque-fonce">{valeur}</p>
      <p className="text-sm font-bold">{titre}</p>
      {aide ? <p className="text-xs text-discret">{aide}</p> : null}
    </div>
  );
}

export default function PageAdmin() {
  const t = useTranslations("admin");
  const te = useTranslations();
  const qc = useQueryClient();
  const [choix, setChoix] = useState<string | null>(null);
  const [commentaire, setCommentaire] = useState("");

  const indicateurs = useQuery({ queryKey: ["admin", "indicateurs"], queryFn: obtenirIndicateursAdmin, retry: false });
  const liste = useQuery({ queryKey: ["admin", "liste"], queryFn: listerSignalementsAdmin, retry: false, enabled: indicateurs.isSuccess });
  const detail = useQuery({ queryKey: ["admin", "detail", choix], queryFn: () => detailSignalementAdmin(choix as string), enabled: choix !== null });
  const decider = useMutation({
    mutationFn: (d: DecisionModeration) => deciderSignalement(choix as string, d, commentaire.trim() || undefined),
    onSuccess: () => {
      setChoix(null);
      setCommentaire("");
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
  });

  if (indicateurs.error) {
    const interdit = indicateurs.error instanceof ApiError && indicateurs.error.cle === "errors.interdit";
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-5 pt-7">
        <Alerte ton="danger">{interdit ? t("interdit") : te(indicateurs.error instanceof ApiError ? indicateurs.error.cle : "errors.generique")}</Alerte>
        <LienBouton href="/connexion">{t("connexion")}</LienBouton>
      </main>
    );
  }
  // Tant que le serveur n'a pas confirmé le rôle, rien du panneau n'est affiché (pas de flash pour un simple membre).
  if (!indicateurs.data) return <main className="flex-1" aria-busy="true" />;
  const i = indicateurs.data;
  const nombre = (n: number | null | undefined, suffixe = "") => (n === null || n === undefined ? t("aucunChiffre") : `${n}${suffixe}`);
  const h = detail.data?.historique;

  return (
    <main className="mx-auto flex w-full max-w-[1000px] flex-1 flex-col gap-6 px-5 pb-10 pt-7">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-[1.75rem] font-extrabold leading-tight tracking-tight">{t("titre")}</h1>
        <Link href="/admin/administrateurs" className="flex min-h-11 items-center rounded-xl border-[1.5px] border-trait bg-surface px-4 text-sm font-bold">
          {t("gererAdmins")}
        </Link>
        <Link href="/accueil" className="flex min-h-11 items-center rounded-xl border-[1.5px] border-trait bg-surface px-4 text-sm font-bold">
          {t("voirApp")}
        </Link>
      </header>

      <section aria-label={t("indicateurs")} className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tuile valeur={nombre(i?.tauxConcretisation, " %")} titre={t("concretisation")} aide={t("concretisationAide")} />
        <Tuile valeur={nombre(i?.sessionsRealisees30j)} titre={t("sessions")} />
        <Tuile valeur={nombre(i?.conversations30j)} titre={t("conversations")} />
        <Tuile valeur={i ? `${i.competencesConfirmees}` : t("aucunChiffre")} titre={t("confirmees")} aide={i ? t("confirmeesAide", { total: i.competencesOffertes }) : undefined} />
      </section>

      <div className="grid gap-4 md:grid-cols-[2fr_3fr]">
        <section aria-labelledby="ouverts" className="flex flex-col gap-2.5">
          <h2 id="ouverts" className="text-lg font-extrabold">
            {t("ouverts")} {i ? `(${i.signalementsOuverts})` : null}
          </h2>
          {liste.data?.length === 0 ? <p className="text-sm text-discret">{t("aucunOuvert")}</p> : null}
          <ul className="flex flex-col gap-2">
            {(liste.data ?? []).map((s) => (
              <li key={s.id}>
                <button type="button" aria-pressed={choix === s.id} onClick={() => setChoix(s.id)} className={`w-full rounded-2xl border-2 bg-surface p-3.5 text-left ${choix === s.id ? "border-marque" : "border-trait"}`}>
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-extrabold">
                      {te(`motifs.${s.motif}`)} · {s.ciblePseudo}
                    </span>
                    <Pastille ton={s.gravite === "HAUTE" ? "ok" : "neutre"}>{t(`gravite.${s.gravite}`)}</Pastille>
                  </span>
                  <span className="mt-1 block text-[0.8125rem] text-discret">{t("meta", { n: s.nbSignaleurs, quand: ilYa(s.creeLe) })}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="detail" className={`${CARTE} flex flex-col gap-3 p-5`}>
          <h2 id="detail" className="text-lg font-extrabold">
            {t("detail")}
          </h2>
          {!choix || !detail.data ? (
            <p className="text-sm text-discret">{t("choisir")}</p>
          ) : (
            <>
              <p className="font-bold">
                {te(`motifs.${detail.data.motif}`)} · {detail.data.ciblePseudo}
              </p>
              <p className="text-sm text-discret">{t("par", { auteur: detail.data.auteurPseudo })}</p>
              <p className="rounded-xl bg-[#f5f6f2] p-3 text-[0.9375rem]">{detail.data.description ?? t("pasDeDetail")}</p>
              <h3 className="text-sm font-extrabold">{t("historique")}</h3>
              {h ? (
                <ul className="flex flex-col gap-1 text-sm">
                  <li>{t("hSessions", { n: h.sessionsRealisees })}</li>
                  <li>{t("hAbsences", { n: h.absences })}</li>
                  <li>{t("hRecus", { n: h.signalementsRecus, d: h.signaleursDistincts })}</li>
                  <li>{h.noteMoyenne === null ? t("hAucuneNote") : t("hNote", { n: h.noteMoyenne })}</li>
                  {detail.data.cibleStatut === "SUSPENDU" ? <li className="font-bold text-alerte">{t("hSuspendu")}</li> : null}
                </ul>
              ) : null}
              <label htmlFor="decision" className="text-[0.8125rem] font-bold text-[#3c4a44]">
                {t("commentaire")}
              </label>
              <textarea id="decision" rows={2} maxLength={500} value={commentaire} onChange={(e) => setCommentaire(e.target.value)} className="resize-none rounded-xl border-[1.5px] border-bord bg-surface px-3.5 py-3 text-[0.9375rem]" />
              {decider.error ? <Alerte ton="danger">{te(decider.error instanceof ApiError ? decider.error.cle : "errors.generique")}</Alerte> : null}
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={decider.isPending} onClick={() => decider.mutate("AVERTIR")} className="min-h-11 rounded-xl bg-marque px-4 text-sm font-bold text-white disabled:opacity-60">
                  {t("avertir")}
                </button>
                <button type="button" disabled={decider.isPending} onClick={() => decider.mutate("SUSPENDRE")} className="min-h-11 rounded-xl bg-alerte px-4 text-sm font-bold text-white disabled:opacity-60">
                  {t("suspendre")}
                </button>
                <button type="button" disabled={decider.isPending} onClick={() => decider.mutate("REJETER")} className="min-h-11 rounded-xl border-[1.5px] border-bord bg-surface px-4 text-sm font-bold disabled:opacity-60">
                  {t("rejeter")}
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
