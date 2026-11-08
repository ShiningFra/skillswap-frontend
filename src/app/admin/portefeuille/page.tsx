"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { Alerte, Bouton, CARTE, Champ } from "@/components/ui";
import { ApiError, obtenirPortefeuilleAdmin, trancherPaiement } from "@/lib/api";

const fcfa = (n: number) => `${n.toLocaleString("fr-FR")} FCFA`;

export default function PagePortefeuilleAdmin() {
  const t = useTranslations("admin.portefeuille");
  const te = useTranslations();
  const qc = useQueryClient();
  const [choix, setChoix] = useState<{ id: string; issue: "LIBERER" | "REMBOURSER" } | null>(null);
  const [mdp, setMdp] = useState("");
  const vue = useQuery({ queryKey: ["admin", "portefeuille"], queryFn: obtenirPortefeuilleAdmin, retry: false });
  const decider = useMutation({
    mutationFn: () => trancherPaiement(choix!.id, choix!.issue, mdp),
    onSuccess: () => {
      setChoix(null);
      setMdp("");
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
  });
  if (vue.error) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-5 pt-7">
        <Alerte ton="danger">{te(vue.error instanceof ApiError ? vue.error.cle : "errors.generique")}</Alerte>
      </main>
    );
  }
  if (!vue.data) return <main className="flex-1" aria-busy="true" />;
  const v = vue.data;
  return (
    <main className="mx-auto flex w-full max-w-[1000px] flex-1 flex-col gap-6 px-5 pb-10 pt-7">
      <header className="flex flex-col gap-1.5">
        <Link href="/admin" className="min-h-11 py-2 text-sm font-bold text-marque">← {te("common.retour")}</Link>
        <h1 className="pr-12 text-[1.75rem] font-extrabold leading-tight tracking-tight">{t("titre")}</h1>
        <p className="text-sm text-discret">{t("intro")}</p>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          [fcfa(v.disponible), t("disponible")],
          [fcfa(v.sequestre), t("reserve")],
          [fcfa(v.recharges), t("recharges")],
          [fcfa(v.retraits), t("retraits")],
        ].map(([valeur, titre]) => (
          <div key={titre} className={`${CARTE} flex flex-col gap-1 p-4`}>
            <p className="text-xl font-extrabold leading-tight text-marque-fonce">{valeur}</p>
            <p className="text-sm font-bold">{titre}</p>
          </div>
        ))}
      </section>

      <Alerte ton={v.coherent ? "info" : "danger"}>{v.coherent ? t("coherent") : t("incoherent")}</Alerte>

      <section aria-labelledby="bloques" className="flex flex-col gap-2.5">
        <h2 id="bloques" className="text-lg font-extrabold">{t("bloques")}</h2>
        <p className="text-xs text-discret">{t("bloquesAide", { jours: v.blocageJours })}</p>
        {v.bloques.length === 0 ? <p className="text-sm text-discret">{t("aucunBloque")}</p> : null}
        <ul className="flex flex-col gap-2">
          {v.bloques.map((b) => (
            <li key={b.id} className={`${CARTE} flex flex-col gap-2 px-4 py-3`}>
              <Link href={`/sessions/${b.id}`} className="text-sm font-bold">{t("ligne", { apprenant: b.apprenant, enseignant: b.enseignant, prix: b.prix.toLocaleString("fr-FR") })}</Link>
              <div className="flex flex-wrap gap-2">
                <Bouton type="button" onClick={() => setChoix({ id: b.id, issue: "LIBERER" })} className="!min-h-11 flex-1 !text-sm">{t("liberer")}</Bouton>
                <Bouton type="button" onClick={() => setChoix({ id: b.id, issue: "REMBOURSER" })} className="!min-h-11 flex-1 !bg-transparent !text-sm !text-marque">{t("rembourser")}</Bouton>
              </div>
              {choix?.id === b.id ? (
                <form
                  className="flex flex-col gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    decider.mutate();
                  }}
                >
                  <Champ id={`mdp-${b.id}`} label={t("motDePasse")} type="password" autoComplete="current-password" value={mdp} onChange={(e) => setMdp(e.target.value)} />
                  {decider.error ? <Alerte ton="danger">{te(decider.error instanceof ApiError ? decider.error.cle : "errors.generique")}</Alerte> : null}
                  <Bouton type="submit" disabled={!mdp || decider.isPending}>{t("confirmer")}</Bouton>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
