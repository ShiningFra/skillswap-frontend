"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { BandeauRevision } from "@/components/bandeau-revision";
import { Alerte, Bouton, CARTE, Champ, Ecran, LienRetour, Option, Titre } from "@/components/ui";
import { ApiError, historiquePortefeuille, obtenirPortefeuille, ouvrirRecharge, retirerPortefeuille } from "@/lib/api";
import { OPERATEURS, type EcriturePortefeuille } from "@/lib/domain";
import { ilYa } from "@/lib/format";
import { useParametres } from "@/lib/parametres";
import { rechargeSchema, retraitSchema, type RechargeSortie, type RechargeValues, type RetraitSortie, type RetraitValues } from "@/lib/schemas";

const fcfa = (n: number) => n.toLocaleString("fr-FR");
const nombre = (v: unknown) => (v === "" || v == null ? undefined : Number(String(v).replace(/\s/g, "")));

export default function PagePortefeuille() {
  const t = useTranslations("portefeuille");
  const te = useTranslations();
  const qc = useQueryClient();
  const actif = useParametres().actif("portefeuille");
  const [mode, setMode] = useState<"recharge" | "retrait" | null>(null);
  const solde = useQuery({ queryKey: ["portefeuille"], queryFn: obtenirPortefeuille });
  const historique = useInfiniteQuery({
    queryKey: ["portefeuille", "historique"],
    queryFn: ({ pageParam }) => historiquePortefeuille(pageParam),
    initialPageParam: 0,
    getNextPageParam: (derniere, pages) => (derniere.suite ? pages.reduce((n, p) => n + p.ecritures.length, 0) : undefined),
  });
  const ecritures = historique.data?.pages.flatMap((p) => p.ecritures) ?? [];
  const s = solde.data;

  return (
    <Ecran nav>
      <LienRetour href="/compte" label={te("common.retour")} />
      <Titre>{t("titre")}</Titre>
      {!actif ? <BandeauRevision cle="portefeuille" /> : null}

      <section aria-label={t("titre")} className={`${CARTE} flex flex-col gap-3 px-4 py-4`}>
        <div>
          <p className="text-sm text-discret">{t("disponible")}</p>
          <p className="text-[2rem] font-extrabold leading-tight tracking-tight" aria-live="polite">
            {s ? `${fcfa(s.disponible)} FCFA` : "…"}
          </p>
        </div>
        {s && s.sequestre > 0 ? (
          <div className="rounded-xl bg-avertissement-doux px-3 py-2.5 text-sm">
            <strong className="font-extrabold">{t("enReserve")} : {fcfa(s.sequestre)} FCFA</strong>
            <span className="block text-xs text-discret">{t("enReserveAide")}</span>
          </div>
        ) : null}
        <div className="flex gap-3">
          <Bouton type="button" disabled={!actif} onClick={() => setMode(mode === "recharge" ? null : "recharge")} className="flex-1" aria-expanded={mode === "recharge"}>
            {t("recharger")}
          </Bouton>
          <Bouton type="button" disabled={!actif || !s || s.disponible <= 0} onClick={() => setMode(mode === "retrait" ? null : "retrait")} className="flex-1 !bg-transparent !text-marque" aria-expanded={mode === "retrait"}>
            {t("retirer")}
          </Bouton>
        </div>
        {s ? <p className="text-xs text-discret">{t("plafondAide", { plafond: fcfa(s.plafond) })}</p> : null}
      </section>

      {mode === "recharge" ? <FormulaireRecharge /> : null}
      {mode === "retrait" ? (
        <FormulaireRetrait
          maximum={s?.disponible ?? 0}
          apres={() => {
            setMode(null);
            qc.invalidateQueries({ queryKey: ["portefeuille"] });
          }}
        />
      ) : null}

      <p className="text-xs leading-snug text-discret">{t("info")}</p>

      <section aria-labelledby="hist" className="flex flex-col gap-2.5">
        <h2 id="hist" className="text-lg font-extrabold">{t("historique")}</h2>
        {historique.isSuccess && ecritures.length === 0 ? <p className="text-sm text-discret">{t("aucuneEcriture")}</p> : null}
        <ul className="flex flex-col gap-2">
          {ecritures.map((e) => (
            <Ligne key={e.id} e={e} />
          ))}
        </ul>
        {historique.hasNextPage ? (
          <Bouton type="button" disabled={historique.isFetchingNextPage} onClick={() => historique.fetchNextPage()} className="!bg-transparent !text-marque">
            {historique.isFetchingNextPage ? te("common.chargement") : t("voirPlus")}
          </Bouton>
        ) : null}
      </section>
    </Ecran>
  );
}

function Ligne({ e }: { e: EcriturePortefeuille }) {
  const t = useTranslations("portefeuille");
  // Montant affiché : la variation de ce que le membre possède ; une mise en réserve ne change pas son total.
  const total = e.deltaDisponible + e.deltaSequestre;
  const delta = total !== 0 ? total : e.deltaDisponible;
  const bloque = e.type === "SEQUESTRE";
  const signe = bloque ? "" : delta > 0 ? "+" : "−";
  const contenu = (
    <>
      <div className="min-w-0">
        <p className="text-sm font-bold">{t(`types.${e.type}`)}</p>
        <p className="truncate text-xs text-discret">
          {e.autre ? `${t("avec", { pseudo: e.autre })} · ` : ""}
          {ilYa(e.date)}
        </p>
      </div>
      <p className={`shrink-0 text-sm font-extrabold ${bloque ? "text-discret" : delta > 0 ? "text-marque-fonce" : ""}`}>
        {signe}{fcfa(Math.abs(bloque ? e.deltaSequestre : delta))} FCFA
      </p>
    </>
  );
  return (
    <li>
      {e.sessionId ? (
        <Link href={`/sessions/${e.sessionId}`} className={`${CARTE} flex min-h-14 items-center justify-between gap-3 px-4 py-2.5`}>
          {contenu}
        </Link>
      ) : (
        <div className={`${CARTE} flex min-h-14 items-center justify-between gap-3 px-4 py-2.5`}>{contenu}</div>
      )}
    </li>
  );
}

function Operateurs({ valeur, surChoix }: { valeur: string; surChoix: (o: (typeof OPERATEURS)[number]) => void }) {
  const t = useTranslations("portefeuille");
  return (
    <div role="group" aria-label={t("operateur")} className="flex flex-col gap-2">
      <div className="text-[0.8125rem] font-bold text-encre/80">{t("operateur")}</div>
      {OPERATEURS.map((o) => (
        <Option key={o} actif={valeur === o} onClick={() => surChoix(o)}>
          {t(o)}
        </Option>
      ))}
    </div>
  );
}

function FormulaireRecharge() {
  const t = useTranslations("portefeuille");
  const te = useTranslations();
  const router = useRouter();
  const form = useForm<RechargeValues, unknown, RechargeSortie>({
    resolver: zodResolver(rechargeSchema),
    defaultValues: { montant: undefined, operateur: "MTN", numero: "" },
  });
  const operateur = useWatch({ control: form.control, name: "operateur" });
  const envoi = useMutation({
    mutationFn: ouvrirRecharge,
    onSuccess: (r) => router.push(r.urlPaiement),
  });
  const e = form.formState.errors;
  const msg = (m?: string) => (m ? te(m) : undefined);
  return (
    <form noValidate onSubmit={form.handleSubmit((v) => envoi.mutate(v))} className={`${CARTE} flex flex-col gap-3 px-4 py-4`}>
      <Champ id="montant" label={t("montant")} inputMode="numeric" autoComplete="off" placeholder="5000" erreur={msg(e.montant?.message)} {...form.register("montant", { setValueAs: nombre })} />
      <Operateurs valeur={operateur} surChoix={(o) => form.setValue("operateur", o)} />
      <Champ id="numero" label={t("numero")} type="tel" inputMode="tel" autoComplete="tel-national" placeholder="677 12 34 56" aide={t("numeroAide")} erreur={msg(e.numero?.message)} {...form.register("numero")} />
      {envoi.error ? <Alerte ton="danger">{te(envoi.error instanceof ApiError ? envoi.error.cle : "errors.generique")}</Alerte> : null}
      <Bouton type="submit" disabled={envoi.isPending}>{envoi.isPending ? te("common.chargement") : t("continuerPaiement")}</Bouton>
    </form>
  );
}

function FormulaireRetrait({ maximum, apres }: { maximum: number; apres: () => void }) {
  const t = useTranslations("portefeuille");
  const te = useTranslations();
  const form = useForm<RetraitValues, unknown, RetraitSortie>({
    resolver: zodResolver(retraitSchema),
    defaultValues: { montant: maximum || undefined, operateur: "MTN", numero: "", motDePasse: "" },
  });
  const operateur = useWatch({ control: form.control, name: "operateur" });
  const envoi = useMutation({ mutationFn: retirerPortefeuille, onSuccess: apres });
  const e = form.formState.errors;
  const msg = (m?: string) => (m ? te(m) : undefined);
  return (
    <form noValidate onSubmit={form.handleSubmit((v) => envoi.mutate(v))} className={`${CARTE} flex flex-col gap-3 px-4 py-4`}>
      <Champ id="montant-retrait" label={t("montant")} inputMode="numeric" autoComplete="off" erreur={msg(e.montant?.message)} {...form.register("montant", { setValueAs: nombre })} />
      <Operateurs valeur={operateur} surChoix={(o) => form.setValue("operateur", o)} />
      <Champ id="numero-retrait" label={t("numero")} type="tel" inputMode="tel" autoComplete="tel-national" placeholder="677 12 34 56" aide={t("numeroAide")} erreur={msg(e.numero?.message)} {...form.register("numero")} />
      <Champ id="mdp-retrait" label={t("motDePasse")} type="password" autoComplete="current-password" erreur={msg(e.motDePasse?.message)} {...form.register("motDePasse")} />
      {envoi.error ? <Alerte ton="danger">{te(envoi.error instanceof ApiError ? envoi.error.cle : "errors.generique")}</Alerte> : null}
      <Bouton type="submit" disabled={envoi.isPending}>{envoi.isPending ? te("common.chargement") : t("confirmerRetrait")}</Bouton>
    </form>
  );
}
