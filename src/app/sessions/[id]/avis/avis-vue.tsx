"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Alerte, Bouton, Ecran, IconeSucces, LienBouton, LienRetour, Titre } from "@/components/ui";
import { ApiError, obtenirSession, publierAvis } from "@/lib/api";
import { useCatalogue } from "@/lib/catalogue";
import { prenom } from "@/lib/format";

export function AvisVue({ id }: { id: string }) {
  const { libelle } = useCatalogue();
  const t = useTranslations("avis");
  const te = useTranslations();
  const qc = useQueryClient();
  const { data: s } = useQuery({ queryKey: ["session", id], queryFn: () => obtenirSession(id) });
  const [note, setNote] = useState(5);
  const [commentaire, setCommentaire] = useState("");
  const envoi = useMutation({
    mutationFn: () => publierAvis(id, { note, commentaire: commentaire.trim() || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["session", id] });
      qc.invalidateQueries({ queryKey: ["sessions"] });
      qc.invalidateQueries({ queryKey: ["profil"] });
    },
  });
  const nom = prenom(s?.membre.pseudo ?? "");

  if (envoi.isSuccess) {
    return (
      <Ecran>
        <LienRetour href={`/sessions/${id}`} label={te("common.retour")} />
        <div className="flex flex-1 flex-col items-start gap-4">
          <IconeSucces />
          <Titre sousTitre={t("merciTexte", { prenom: nom })}>{t("merciTitre")}</Titre>
          <LienBouton href="/accueil" className="mt-auto">
            {t("suggestions")}
          </LienBouton>
        </div>
      </Ecran>
    );
  }
  return (
    <Ecran>
      <LienRetour href={`/sessions/${id}`} label={te("common.retour")} />
      <form
        noValidate
        className="flex flex-1 flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          envoi.mutate();
        }}
      >
        <Titre sousTitre={s ? t("intro", { competence: libelle(s.competenceId), prenom: nom }) : undefined}>{t("titre")}</Titre>
        <div role="group" aria-label={t("noteGroupe")} className="flex justify-center gap-0.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <button key={i} type="button" aria-label={t("noteN", { n: i })} aria-pressed={note === i} onClick={() => setNote(i)} className="flex h-[52px] w-[52px] items-center justify-center">
              <svg aria-hidden="true" width="40" height="40" viewBox="0 0 24 24" fill={i <= note ? "#e0a526" : "none"} stroke={i <= note ? "#8a5a00" : "#7c8a83"} strokeWidth="1.8" strokeLinejoin="round">
                <path d="M12 3l2.7 5.7 6.3.8-4.6 4.3 1.2 6.2L12 17l-5.6 3 1.2-6.2L3 9.5l6.3-.8z" />
              </svg>
            </button>
          ))}
        </div>
        <p aria-live="polite" className="text-center text-base font-extrabold text-marque-fonce">
          {t("verdict", { n: note, mot: t(`mots.${note}`) })}
        </p>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="commentaire" className="text-[0.8125rem] font-bold text-[#3c4a44]">
            {t("commentaire", { prenom: nom })}
          </label>
          <textarea id="commentaire" rows={4} maxLength={500} value={commentaire} onChange={(e) => setCommentaire(e.target.value)} className="resize-none rounded-xl border-[1.5px] border-bord bg-surface px-3.5 py-3 text-[0.9375rem]" />
        </div>
        <p className="text-xs leading-snug text-discret">{t("aide")}</p>
        {envoi.error ? <Alerte ton="danger">{te(envoi.error instanceof ApiError ? envoi.error.cle : "errors.generique")}</Alerte> : null}
        <Bouton type="submit" disabled={envoi.isPending} className="mt-auto">
          {t("publier")}
        </Bouton>
      </form>
    </Ecran>
  );
}
