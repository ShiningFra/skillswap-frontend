"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CompetenceOfferteLigne } from "@/components/fiche-membre";
import { Puce, useLigneReputation } from "@/components/carte-membre";
import { Alerte, Avatar, Bouton, Ecran, LienRetour } from "@/components/ui";
import { ApiError, obtenirProfil, ouvrirConversation } from "@/lib/api";
import { useCatalogue } from "@/lib/catalogue";
import { prenom } from "@/lib/format";

export function ProfilVue({ id }: { id: string }) {
  const { libelle } = useCatalogue();
  const t = useTranslations("profil");
  const te = useTranslations();
  const router = useRouter();
  const ligne = useLigneReputation();
  const profil = useQuery({ queryKey: ["profil", id], queryFn: () => obtenirProfil(id) });
  const ecrire = useMutation({ mutationFn: () => ouvrirConversation(id), onSuccess: (c) => router.push(`/messages/${c.id}`) });
  const erreur = (e: unknown) => te(e instanceof ApiError ? e.cle : "errors.generique");

  if (profil.error) {
    return (
      <Ecran>
        <LienRetour href="/recherche" label={t("retour")} />
        <Alerte ton="danger">{erreur(profil.error)}</Alerte>
      </Ecran>
    );
  }
  if (!profil.data) {
    return (
      <Ecran>
        <LienRetour href="/recherche" label={t("retour")} />
        <p className="text-sm text-discret">{te("common.chargement")}</p>
      </Ecran>
    );
  }
  const p = profil.data;
  return (
    <Ecran>
      <div className="flex items-center justify-between">
        <LienRetour href="/recherche" label={t("retour")} />
        <Link href={`/profils/${id}/signaler`} className="flex min-h-11 items-center gap-1.5 px-1.5 text-sm font-bold text-alerte">
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 21V4h11l-1.5 4L16 12H5" />
          </svg>
          {t("signaler")}
        </Link>
      </div>

      <header className="flex items-center gap-3.5">
        <Avatar pseudo={p.pseudo} taille={64} />
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-2xl font-extrabold leading-tight tracking-tight">{p.pseudo}</h1>
          <p className="text-sm text-discret">{[ligne(p).split(" · ")[0], p.ville, p.noteMoyenne !== undefined ? t("noteProfil", { note: p.noteMoyenne.toLocaleString("fr-FR"), count: p.nbAvis }) : te("recherche.nouveau")].filter(Boolean).join(" · ")}</p>
          {p.telephoneVerifie ? (
            <span>
              <Puce ok>{t("telephoneVerifie")}</Puce>
            </span>
          ) : null}
        </div>
      </header>

      <ul className="flex flex-col gap-3">
        {p.offertes.map((o) => (
          <CompetenceOfferteLigne key={o.competenceId} o={o} />
        ))}
      </ul>
      {p.recherchees.length > 0 ? (
        <p className="text-[0.8125rem] text-discret">
          {t("cherche")} : <strong className="text-encre">{p.recherchees.map(libelle).join(", ")}</strong>
        </p>
      ) : null}

      <section aria-labelledby="avis" className="flex flex-col gap-2">
        <h2 id="avis" className="text-[0.9375rem] font-extrabold">
          {t("avis")}
        </h2>
        {p.avis.length === 0 ? <p className="text-sm text-discret">{t("aucunAvis")}</p> : null}
        {p.avis.map((a, i) => (
          <figure key={`${a.auteur}-${i}`} className="flex flex-col gap-0.5 rounded-[14px] border-[1.5px] border-trait bg-surface px-3.5 py-3">
            <figcaption className="text-[0.8125rem] font-bold">{t("avisLigne", { note: a.note, auteur: a.auteur })}</figcaption>
            <blockquote className="text-[0.8125rem] leading-snug text-[#33403a]">{a.commentaire}</blockquote>
          </figure>
        ))}
      </section>

      <section aria-labelledby="creneaux" className="flex flex-col gap-2">
        <h2 id="creneaux" className="text-[0.9375rem] font-extrabold">
          {t("creneaux")}
        </h2>
        {p.creneaux.length === 0 ? <p className="text-sm text-discret">{t("aucunCreneau")}</p> : null}
        <ul className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
          {p.creneaux.map((c) => (
            <li key={c.id} className="shrink-0 whitespace-nowrap rounded-xl border-[1.5px] border-bord bg-surface px-3 py-2 text-[0.8125rem] font-bold text-[#33403a]">
              {c.libelle}
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-auto flex flex-col gap-3 pt-2">
        {ecrire.error ? <Alerte ton="danger">{erreur(ecrire.error)}</Alerte> : null}
        <Bouton type="button" disabled={ecrire.isPending} onClick={() => ecrire.mutate()}>
          {ecrire.isPending ? te("common.chargement") : t("ecrireA", { prenom: prenom(p.pseudo) })}
        </Bouton>
      </div>
    </Ecran>
  );
}
