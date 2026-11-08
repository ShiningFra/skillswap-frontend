"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { Alerte, Bouton, CARTE, Champ } from "@/components/ui";
import {
  ApiError,
  creerAdministrateur,
  listerAdministrateurs,
  nommerAdministrateur,
  obtenirMoi,
  retirerAdministrateur,
} from "@/lib/api";

export default function PageAdministrateurs() {
  const t = useTranslations("admin");
  const te = useTranslations();
  const qc = useQueryClient();
  const msg = (e: unknown) => te(e instanceof ApiError ? e.cle : "errors.generique");

  const moi = useQuery({ queryKey: ["moi"], queryFn: obtenirMoi });
  const liste = useQuery({ queryKey: ["admin", "administrateurs"], queryFn: listerAdministrateurs, retry: false });
  const rafraichir = () => qc.invalidateQueries({ queryKey: ["admin", "administrateurs"] });

  const [email, setEmail] = useState("");
  const [mdpNommer, setMdpNommer] = useState("");
  const nommer = useMutation({
    mutationFn: nommerAdministrateur,
    onSuccess: () => {
      setEmail("");
      setMdpNommer("");
      rafraichir();
    },
  });

  const [nEmail, setNEmail] = useState("");
  const [nPseudo, setNPseudo] = useState("");
  const [mdpCreer, setMdpCreer] = useState("");
  const creer = useMutation({
    mutationFn: creerAdministrateur,
    onSuccess: () => {
      setNEmail("");
      setNPseudo("");
      setMdpCreer("");
      rafraichir();
    },
  });

  const [retrait, setRetrait] = useState<string | null>(null);
  const [mdpRetrait, setMdpRetrait] = useState("");
  const retirer = useMutation({
    mutationFn: ({ id, mdp }: { id: string; mdp: string }) => retirerAdministrateur(id, mdp),
    onSuccess: () => {
      setRetrait(null);
      setMdpRetrait("");
      rafraichir();
    },
  });

  if (liste.error)
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-5 pt-7">
        <Alerte ton="danger">{msg(liste.error)}</Alerte>
      </main>
    );

  if (!liste.data) return <main className="flex-1" aria-busy="true" />;

  return (
    <main className="mx-auto flex w-full max-w-[720px] flex-1 flex-col gap-6 px-5 pb-10 pt-7">
      <header className="flex flex-col gap-1">
        <Link href="/admin" className="text-sm font-bold text-marque">
          ← {t("retourAdmin")}
        </Link>
        <h1 className="pr-12 text-[1.75rem] font-extrabold leading-tight tracking-tight">{t("adminsTitre")}</h1>
        <p className="text-sm text-discret">{t("adminsIntro")}</p>
      </header>

      <section aria-label={t("adminsListe")} className={`${CARTE} flex flex-col gap-3 p-4`}>
        <h2 className="text-base font-extrabold">{t("adminsListe")}</h2>
        <ul className="flex flex-col divide-y divide-trait">
          {(liste.data ?? []).map((a) => {
            const soi = a.pseudo === moi.data?.pseudo;
            return (
              <li key={a.id} className="flex flex-col gap-2 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-col">
                    <span className="font-bold">
                      {a.pseudo}
                      {soi ? ` (${t("adminMoi")})` : ""}
                    </span>
                    <span className="truncate text-sm text-discret">{a.email}</span>
                    {a.mdpProvisoire ? <span className="text-xs font-bold text-avertissement">{t("adminProvisoire")}</span> : null}
                  </div>
                  {!soi ? (
                    <button
                      type="button"
                      className="min-h-11 rounded-xl border-[1.5px] border-trait px-4 text-sm font-bold text-alerte"
                      onClick={() => {
                        setRetrait(retrait === a.id ? null : a.id);
                        setMdpRetrait("");
                        retirer.reset();
                      }}
                    >
                      {t("adminRetirer")}
                    </button>
                  ) : null}
                </div>
                {retrait === a.id ? (
                  <form
                    noValidate
                    className="flex flex-col gap-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      retirer.mutate({ id: a.id, mdp: mdpRetrait });
                    }}
                  >
                    <Champ id={`retrait-${a.id}`} type="password" autoComplete="current-password" label={t("confirmerMdp")} value={mdpRetrait} onChange={(e) => setMdpRetrait(e.target.value)} />
                    {retirer.error ? <Alerte ton="danger">{msg(retirer.error)}</Alerte> : null}
                    <Bouton type="submit" disabled={retirer.isPending || !mdpRetrait}>{t("adminRetirer")}</Bouton>
                  </form>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>

      <section className={`${CARTE} flex flex-col gap-3 p-4`}>
        <h2 className="text-base font-extrabold">{t("nommerTitre")}</h2>
        <form
          noValidate
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            nommer.mutate({ email, motDePasse: mdpNommer });
          }}
        >
          <Champ id="nommer-email" type="email" autoComplete="off" label={t("nommerEmail")} value={email} onChange={(e) => setEmail(e.target.value)} />
          <Champ id="nommer-mdp" type="password" autoComplete="current-password" label={t("confirmerMdp")} value={mdpNommer} onChange={(e) => setMdpNommer(e.target.value)} />
          {nommer.error ? <Alerte ton="danger">{msg(nommer.error)}</Alerte> : null}
          {nommer.isSuccess ? <Alerte>{t("nommeOk")}</Alerte> : null}
          <Bouton type="submit" disabled={nommer.isPending || !email || !mdpNommer}>{t("nommerBouton")}</Bouton>
        </form>
      </section>

      <section className={`${CARTE} flex flex-col gap-3 p-4`}>
        <h2 className="text-base font-extrabold">{t("creerTitre")}</h2>
        <form
          noValidate
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            creer.mutate({ email: nEmail, pseudo: nPseudo, motDePasse: mdpCreer });
          }}
        >
          <Champ id="creer-email" type="email" autoComplete="off" label={t("nommerEmail")} value={nEmail} onChange={(e) => setNEmail(e.target.value)} />
          <Champ id="creer-pseudo" autoComplete="off" label={t("creerPseudo")} value={nPseudo} onChange={(e) => setNPseudo(e.target.value)} />
          <Champ id="creer-mdp" type="password" autoComplete="current-password" label={t("confirmerMdp")} value={mdpCreer} onChange={(e) => setMdpCreer(e.target.value)} />
          {creer.error ? <Alerte ton="danger">{msg(creer.error)}</Alerte> : null}
          {creer.data ? (
            <Alerte ton="avertissement">
              <p>{t("creeOk")}</p>
              <p data-testid="mdp-provisoire" className="my-2 select-all font-mono text-lg font-extrabold tracking-wider">{creer.data.motDePasseProvisoire}</p>
              <p>{t("creeAide")}</p>
            </Alerte>
          ) : null}
          <Bouton type="submit" disabled={creer.isPending || !nEmail || !nPseudo || !mdpCreer}>{t("creerBouton")}</Bouton>
        </form>
      </section>
    </main>
  );
}
