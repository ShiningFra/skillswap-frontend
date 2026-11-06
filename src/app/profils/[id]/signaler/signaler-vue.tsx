"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Alerte, Ecran, IconeSucces, LienBouton, LienRetour, Option, Titre } from "@/components/ui";
import { ApiError, obtenirProfil, signalerMembre } from "@/lib/api";
import { MOTIFS_SIGNALEMENT, type MotifSignalement } from "@/lib/domain";
import { prenom } from "@/lib/format";

export function SignalerVue({ id }: { id: string }) {
  const t = useTranslations("signalement");
  const te = useTranslations();
  const { data: p } = useQuery({ queryKey: ["profil", id], queryFn: () => obtenirProfil(id) });
  const [motif, setMotif] = useState<MotifSignalement | null>(null);
  const [description, setDescription] = useState("");
  const [manque, setManque] = useState(false);
  const envoi = useMutation({ mutationFn: (m: MotifSignalement) => signalerMembre(id, { motif: m, description: description.trim() || undefined }) });
  const pseudo = p?.pseudo ?? "";

  if (envoi.isSuccess) {
    return (
      <Ecran>
        <LienRetour href={`/profils/${id}`} label={te("common.retour")} />
        <div className="flex flex-1 flex-col items-start gap-4">
          <IconeSucces />
          <Titre sousTitre={t("envoyeTexte")}>{t("envoyeTitre")}</Titre>
          <LienBouton href="/accueil" className="mt-auto">
            {t("retourAccueil")}
          </LienBouton>
        </div>
      </Ecran>
    );
  }
  return (
    <Ecran>
      <LienRetour href={`/profils/${id}`} label={te("common.retour")} />
      <form
        noValidate
        className="flex flex-1 flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!motif) return setManque(true);
          envoi.mutate(motif);
        }}
      >
        <Titre sousTitre={t("introCourt", { prenom: prenom(pseudo) })}>{t("titre", { pseudo })}</Titre>
        <div role="group" aria-label={t("motifGroupe")} className="flex flex-col gap-2">
          {MOTIFS_SIGNALEMENT.map((m) => (
            <Option
              key={m}
              actif={motif === m}
              onClick={() => {
                setMotif(m);
                setManque(false);
              }}
            >
              {te(`motifs.${m}`)}
            </Option>
          ))}
          {manque ? (
            <p role="alert" className="text-[0.8125rem] font-semibold text-alerte">
              {te("errors.motif")}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="description" className="text-[0.8125rem] font-bold text-[#3c4a44]">
            {t("description")}
          </label>
          <textarea id="description" rows={3} maxLength={500} placeholder={t("placeholder")} value={description} onChange={(e) => setDescription(e.target.value)} className="resize-none rounded-xl border-[1.5px] border-bord bg-surface px-3.5 py-3 text-[0.9375rem]" />
        </div>
        {envoi.error ? <Alerte ton="danger">{te(envoi.error instanceof ApiError ? envoi.error.cle : "errors.generique")}</Alerte> : null}
        <button type="submit" disabled={envoi.isPending} className="mt-auto min-h-[52px] w-full rounded-[14px] bg-alerte text-base font-bold text-white disabled:opacity-60">
          {t("envoyer")}
        </button>
      </form>
    </Ecran>
  );
}
