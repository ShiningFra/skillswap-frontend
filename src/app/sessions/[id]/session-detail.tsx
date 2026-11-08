"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useCatalogue } from "@/lib/catalogue";
import { Alerte, Bouton, CARTE, Ecran, LienBouton, LienRetour, Pastille, Titre } from "@/components/ui";
import { prenom } from "@/lib/format";
import { ApiError, confirmerRealisation, declarerAbsence, definirLienSession, obtenirSession, repondreProposition } from "@/lib/api";

export function SessionDetail({ id }: { id: string }) {
  const { libelle } = useCatalogue();
  const t = useTranslations("sessions");
  const te = useTranslations();
  const qc = useQueryClient();
  const { data: s, error } = useQuery({ queryKey: ["session", id], queryFn: () => obtenirSession(id) });
  const rafraichir = () => {
    qc.invalidateQueries({ queryKey: ["session", id] });
    qc.invalidateQueries({ queryKey: ["sessions"] });
  };
  const repondre = useMutation({ mutationFn: (accepter: boolean) => repondreProposition(id, accepter), onSuccess: rafraichir });
  const confirmer = useMutation({ mutationFn: () => confirmerRealisation(id), onSuccess: rafraichir });
  const absence = useMutation({ mutationFn: () => declarerAbsence(id), onSuccess: rafraichir });
  const [lienSaisi, setLienSaisi] = useState<string | null>(null);
  const lien = useMutation({ mutationFn: (v: string) => definirLienSession(id, v), onSuccess: () => { setLienSaisi(null); rafraichir(); } });
  const erreurMutation = repondre.error ?? confirmer.error ?? absence.error ?? lien.error;
  const occupe = repondre.isPending || confirmer.isPending || absence.isPending;
  const message = (e: unknown) => te(e instanceof ApiError ? e.cle : "errors.generique");

  if (error) {
    return (
      <Ecran nav>
        <LienRetour href="/sessions" label={t("retour")} />
        <Alerte ton="danger">{message(error)}</Alerte>
      </Ecran>
    );
  }
  if (!s) {
    return (
      <Ecran nav>
        <p className="text-sm text-discret">{te("common.chargement")}</p>
      </Ecran>
    );
  }
  const pseudo = prenom(s.membre.pseudo);
  const heurePassee = !s.dateHeure || new Date(s.dateHeure) <= new Date();
  const ligne = (cle: string, valeur: string) => (
    <div className="flex justify-between gap-4 text-sm">
      <dt className="text-discret">{cle}</dt>
      <dd className="text-right font-bold">{valeur}</dd>
    </div>
  );
  return (
    <Ecran>
      <LienRetour href="/sessions" label={t("retour")} />
      <div className="flex flex-col gap-2">
        <Pastille ton={s.statut === "ACCEPTEE" || s.statut === "REALISEE" ? "ok" : "neutre"}>{t(`statutTitre.${s.statut}`)}</Pastille>
        <Titre>{t("avec", { competence: libelle(s.competenceId), pseudo })}</Titre>
      </div>

      <dl className={`${CARTE} flex flex-col gap-2.5 px-4 py-3.5`}>
        {ligne(t("date"), s.creneauLibelle)}
        {ligne(t("format"), te(`formats.${s.format}`))}
        {s.lieuType ? ligne(t("lieu"), te(`lieux.${s.lieuType}`)) : null}
        {ligne(t("contrepartie"), te(`contreparties.${s.contrepartie}`))}
      </dl>

      {s.statut === "PROPOSEE" && s.proposeParMoi ? <Alerte>{t("enAttente", { pseudo })}</Alerte> : null}

      {s.statut === "PROPOSEE" && !s.proposeParMoi ? (
        <div className="flex flex-col gap-3">
          <Bouton type="button" disabled={occupe} onClick={() => repondre.mutate(true)}>
            {t("accepter")}
          </Bouton>
          <Bouton type="button" disabled={occupe} onClick={() => repondre.mutate(false)} className="!bg-transparent !text-marque">
            {t("refuser")}
          </Bouton>
        </div>
      ) : null}

      {s.format === "DISTANCE" && s.statut === "ACCEPTEE" ? (
        <section className={`${CARTE} flex flex-col gap-3 px-4 py-3.5`}>
          <h2 className="text-base font-extrabold">{t("visio")}</h2>
          {s.lien && lienSaisi === null ? (
            <>
              <LienBouton href={s.lien} target="_blank" rel="noopener noreferrer">{t("rejoindre")}</LienBouton>
              <button type="button" onClick={() => setLienSaisi(s.lien ?? "")} className="min-h-11 text-sm font-bold text-marque">
                {t("changerLien")}
              </button>
            </>
          ) : (
            <form
              noValidate
              className="flex flex-col gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                lien.mutate((lienSaisi ?? "").trim());
              }}
            >
              <p className="text-sm text-discret">{t("visioAide", { pseudo })}</p>
              <input type="url" inputMode="url" aria-label={t("visio")} placeholder="https://meet.jit.si/…" value={lienSaisi ?? ""} onChange={(e) => setLienSaisi(e.target.value)} className="min-h-[50px] rounded-xl border-[1.5px] border-bord bg-surface px-3 text-base" />
              <Bouton type="submit" disabled={lien.isPending || !(lienSaisi ?? "").trim()}>
                {t("enregistrerLien")}
              </Bouton>
            </form>
          )}
        </section>
      ) : null}

      {s.statut === "ACCEPTEE" && !heurePassee ? <Alerte>{t("aVenir", { date: s.creneauLibelle })}</Alerte> : null}
      {s.statut === "ACCEPTEE" && heurePassee && !s.mesConfirmation ? (
        <div className="flex flex-col gap-3">
          <Alerte ton="avertissement">{t("heurePassee")}</Alerte>
          <Bouton type="button" disabled={occupe} onClick={() => confirmer.mutate()}>
            {t("confirmer")}
          </Bouton>
          <button type="button" disabled={occupe} onClick={() => absence.mutate()} className="min-h-[52px] w-full rounded-[14px] border-[1.5px] border-[#e6c3be] bg-surface text-base font-bold text-alerte disabled:opacity-60">
            {t("absent", { pseudo })}
          </button>
        </div>
      ) : null}
      {s.statut === "ACCEPTEE" && s.mesConfirmation ? (
        <div className="rounded-[14px] bg-marque-doux px-4 py-3 text-sm leading-relaxed text-marque-fonce">
          <p className="font-extrabold">{t("tuAsConfirmeTitre")}</p>
          <p>{t("tuAsConfirme", { pseudo })}</p>
        </div>
      ) : null}

      {s.statut === "REFUSEE" ? <Alerte>{t("refusee")}</Alerte> : null}
      {s.statut === "REALISEE" ? (
        s.avisDonne ? (
          <Alerte>{t("avisDonne")}</Alerte>
        ) : (
          <>
            <Alerte>{t("realisee")}</Alerte>
            <LienBouton href={`/sessions/${id}/avis`}>{t("laisserAvis")}</LienBouton>
          </>
        )
      ) : null}
      {s.statut === "NON_REALISEE" ? (
        <div className="rounded-[14px] bg-alerte-doux px-4 py-3 text-sm leading-relaxed text-[#7a1d1d]">
          <p className="font-extrabold">{t("nonRealiseeTitre")}</p>
          <p>{s.absent === "autre" ? t("nonRealiseeAutre", { pseudo }) : t("nonRealiseeMoi")}</p>
        </div>
      ) : null}

      {erreurMutation ? <Alerte ton="danger">{message(erreurMutation)}</Alerte> : null}
      <LienBouton href={`/profils/${s.membre.id}/signaler`} secondaire>
        {t("signaler", { pseudo })}
      </LienBouton>
    </Ecran>
  );
}
