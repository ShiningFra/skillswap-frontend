"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Alerte, Bouton, Ecran, LienBouton, LienRetour, Titre } from "@/components/ui";
import { ApiError, lireConversation, obtenirProfil, proposerSession } from "@/lib/api";
import { useCatalogue } from "@/lib/catalogue";
import { CONTREPARTIES, TYPES_LIEU } from "@/lib/domain";
import { prenom } from "@/lib/format";
import { propositionSchema, type PropositionValues } from "@/lib/schemas";

export function SessionVue({ id }: { id: string }) {
  const t = useTranslations("session");
  const te = useTranslations();
  const conv = useQuery({ queryKey: ["conversation", id], queryFn: () => lireConversation(id) });
  const form = useForm<PropositionValues>({
    resolver: zodResolver(propositionSchema),
    defaultValues: { creneauId: "", format: "PRESENTIEL", lieuType: "PUBLIC", contrepartie: "TROC" },
  });
  const format = useWatch({ control: form.control, name: "format" });
  const lieu = useWatch({ control: form.control, name: "lieuType" });
  const envoi = useMutation({ mutationFn: (v: PropositionValues) => proposerSession(id, v) });
  const e = form.formState.errors;
  const msg = (m?: string) => (m ? te(m) : undefined);
  const membre = conv.data?.membre;
  const { libelle } = useCatalogue();
  const profil = useQuery({ queryKey: ["profil", membre?.id], queryFn: () => obtenirProfil(membre!.id), enabled: Boolean(membre?.id) });
  const contrepartie = useWatch({ control: form.control, name: "contrepartie" });
  const creneauId = useWatch({ control: form.control, name: "creneauId" });
  const competenceId = useWatch({ control: form.control, name: "competenceId" });
  const [competenceManquante, setCompetenceManquante] = useState(false);

  // RG20 : en distance il n'y a pas de lieu, la valeur est retirée avant l'envoi.
  const changerFormat = (f: "PRESENTIEL" | "DISTANCE") => {
    form.setValue("format", f);
    form.setValue("lieuType", f === "DISTANCE" ? undefined : "PUBLIC");
  };

  if (envoi.isSuccess) {
    return (
      <Ecran nav>
        <Titre>{t("titre")}</Titre>
        <Alerte>{t("envoyee", { pseudo: membre?.pseudo ?? "" })}</Alerte>
        <LienBouton href="/sessions">{te("nav.sessions")}</LienBouton>
      </Ecran>
    );
  }

  const opts = { shouldValidate: form.formState.isSubmitted, shouldDirty: true };
  const choisirCreneau = (v: string) => form.setValue("creneauId", v, opts);
  const choisirContrepartie = (v: PropositionValues["contrepartie"]) => form.setValue("contrepartie", v, opts);
  const choisirLieu = (v: NonNullable<PropositionValues["lieuType"]>) => form.setValue("lieuType", v, opts);
  const offres = profil.data?.offertes ?? [];
  const plusieurs = offres.length > 1;
  const offre = plusieurs ? offres.find((o) => o.competenceId === competenceId) : offres[0];
  return (
    <Ecran>
      <LienRetour href={`/messages/${id}`} label={te("common.retour")} />
      <Titre sousTitre={membre ? (offre ? t("avecCompetence", { pseudo: membre.pseudo, competence: libelle(offre.competenceId) }) : t("avec", { pseudo: membre.pseudo })) : undefined}>{t("titre")}</Titre>
      <form noValidate className="flex flex-1 flex-col gap-4" onSubmit={form.handleSubmit((v) => {
        if (plusieurs && !v.competenceId) return setCompetenceManquante(true);
        envoi.mutate(v);
      })}>
        {plusieurs ? (
          <Groupe label={t("competence")} erreur={competenceManquante && !competenceId ? te("errors.competence") : undefined}>
            {offres.map((o) => (
              <Choix
                key={o.competenceId}
                actif={competenceId === o.competenceId}
                onClick={() => {
                  form.setValue("competenceId", o.competenceId);
                  setCompetenceManquante(false);
                }}
              >
                {libelle(o.competenceId)}
              </Choix>
            ))}
          </Groupe>
        ) : null}
        <Groupe label={t("creneauDe", { prenom: membre ? prenom(membre.pseudo) : "" })} erreur={msg(e.creneauId?.message)} aide={membre?.creneaux.length === 0 ? t("aucuneCompatible") : undefined}>
          {membre?.creneaux.map((c) => (
            <Choix key={c.id} actif={creneauId === c.id} onClick={() => choisirCreneau(c.id)}>
              {c.libelle}
            </Choix>
          ))}
        </Groupe>

        <Groupe label={t("contrepartie")} erreur={msg(e.contrepartie?.message)} aide={t(`aide.${contrepartie}`)}>
          {CONTREPARTIES.map((c) => (
            <Choix key={c} actif={contrepartie === c} onClick={() => choisirContrepartie(c)}>
              {t(`contrepartieCourt.${c}`)}
            </Choix>
          ))}
        </Groupe>

        <Groupe label={t("format")}>
          {(["PRESENTIEL", "DISTANCE"] as const).map((f) => (
            <Choix key={f} actif={format === f} onClick={() => changerFormat(f)}>
              {te(`formats.${f}`)}
            </Choix>
          ))}
        </Groupe>

        {format === "PRESENTIEL" ? (
          <Groupe label={t("lieu")} erreur={msg(e.lieuType?.message)}>
            {TYPES_LIEU.map((l) => (
              <Choix key={l} actif={lieu === l} onClick={() => choisirLieu(l)} petit>
                {t(`lieuCourt.${l}`)}
              </Choix>
            ))}
          </Groupe>
        ) : null}
        {format === "PRESENTIEL" ? (
          lieu === "DOMICILE" ? (
            <div className="-mt-2 flex items-start gap-2.5 rounded-xl bg-alerte-doux px-3 py-2.5 text-[0.78rem] leading-snug text-[#7a1d1d]">
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-px shrink-0">
                <path d="M12 3l9 16H3zM12 10v4M12 17h.01" />
              </svg>
              <span>{t("risque")}</span>
            </div>
          ) : (
            <p className="-mt-2 text-xs font-semibold leading-snug text-marque-fonce">{t("bonChoix")}</p>
          )
        ) : null}

        {envoi.error ? <Alerte ton="danger">{te(envoi.error instanceof ApiError ? envoi.error.cle : "errors.generique")}</Alerte> : null}
        <Bouton type="submit" disabled={envoi.isPending} className="mt-auto">
          {envoi.isPending ? te("common.chargement") : t("envoyer")}
        </Bouton>
      </form>
    </Ecran>
  );
}

/** Groupe de choix de la maquette : libellé, boutons en pastille, aide ou erreur. */
function Groupe({ label, children, erreur, aide }: { label: string; children?: React.ReactNode; erreur?: string; aide?: string }) {
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-2">
      <div className="text-[0.8125rem] font-extrabold text-[#3c4a44]">{label}</div>
      <div className="flex gap-2 overflow-x-auto pb-0.5">{children}</div>
      {aide ? <p className="text-xs leading-snug text-discret">{aide}</p> : null}
      {erreur ? (
        <p role="alert" className="text-[0.8125rem] font-semibold text-alerte">
          {erreur}
        </p>
      ) : null}
    </div>
  );
}

function Choix({ actif, onClick, children, petit = false }: { actif: boolean; onClick: () => void; children: React.ReactNode; petit?: boolean }) {
  return (
    <button type="button" aria-pressed={actif} onClick={onClick} className={`min-h-[46px] flex-1 whitespace-nowrap rounded-xl border-2 bg-surface px-3.5 font-bold ${petit ? "px-1.5 text-[0.8125rem]" : "text-sm"} ${actif ? "border-marque" : "border-trait"}`}>
      {children}
    </button>
  );
}
