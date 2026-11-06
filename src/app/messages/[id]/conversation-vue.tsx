"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Fragment, useLayoutEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useLigneReputation } from "@/components/carte-membre";
import { Alerte, Avatar, LienRetour } from "@/components/ui";
import { ApiError, envoyerMessage, lireConversation, obtenirProfil } from "@/lib/api";
import { useCatalogue } from "@/lib/catalogue";
import { messageSchema, type MessageValues } from "@/lib/schemas";

export function ConversationVue({ id }: { id: string }) {
  const t = useTranslations("messages");
  const te = useTranslations();
  const qc = useQueryClient();
  const { libelle } = useCatalogue();
  const ligne = useLigneReputation();
  // Premier message non lu à l'ouverture : l'écran s'y place, puis la lecture le marque comme lu côté serveur.
  const [depart, setDepart] = useState<string | null | undefined>(undefined);
  const conv = useQuery({
    queryKey: ["conversation", id],
    queryFn: async () => {
      const r = await lireConversation(id);
      setDepart((d) => (d === undefined ? (r.premierNonLu ?? null) : d));
      return r;
    },
    refetchInterval: 5000,
  });
  const membreId = conv.data?.membre.id;
  const profil = useQuery({ queryKey: ["profil", membreId], queryFn: () => obtenirProfil(membreId!), enabled: Boolean(membreId) });
  const form = useForm<MessageValues>({ resolver: zodResolver(messageSchema), defaultValues: { texte: "" } });
  const envoi = useMutation({
    mutationFn: (v: MessageValues) => envoyerMessage(id, v),
    onSuccess: () => {
      form.reset();
      qc.invalidateQueries({ queryKey: ["conversation", id] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
  const defilement = useRef<HTMLDivElement>(null);
  const initialise = useRef(false);
  const nbMessages = conv.data?.messages.length ?? 0;
  // Ouverture : au premier message non lu s'il y en a, sinon tout en bas. Ensuite : on suit les nouveaux messages
  // seulement si l'on est déjà en bas (ou si c'est soi qui écrit), pour ne pas arracher quelqu'un qui relit plus haut.
  useLayoutEffect(() => {
    const zone = defilement.current;
    if (!zone || !conv.data || depart === undefined) return;
    if (!initialise.current) {
      initialise.current = true;
      const cible = depart ? zone.querySelector<HTMLElement>(`[data-message="${depart}"]`) : null;
      zone.scrollTop = cible ? Math.max(cible.offsetTop - 48, 0) : zone.scrollHeight;
      return;
    }
    const pres = zone.scrollHeight - zone.scrollTop - zone.clientHeight < 140;
    if (pres || conv.data.messages.at(-1)?.deMoi) zone.scrollTo({ top: zone.scrollHeight, behavior: "smooth" });
  }, [nbMessages, conv.data, depart]);

  if (conv.error) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-5 pt-7">
        <LienRetour href="/messages" label={te("common.retour")} />
        <Alerte ton="danger">{te(conv.error instanceof ApiError ? conv.error.cle : "errors.generique")}</Alerte>
      </main>
    );
  }
  const pseudo = conv.data?.membre.pseudo ?? "";
  const p = profil.data;
  const echange = p ? [ligne(p).split(" · ")[0], p.offertes[0] ? [libelle(p.offertes[0].competenceId), p.recherchees[0] ? libelle(p.recherchees[0]) : null].filter(Boolean).join(" ↔ ") : null].filter(Boolean).join(" · ") : "";
  const erreurTexte = form.formState.errors.texte?.message;

  return (
    <main className="mx-auto flex h-dvh w-full max-w-md flex-col overflow-hidden bg-fond">
      <header className="flex shrink-0 items-center gap-2 border-b-[1.5px] border-trait bg-surface px-3 pb-2.5 pt-6">
        <LienRetour href="/messages" label={te("common.retour")} />
        <Link href={membreId ? `/profils/${membreId}` : "/messages"} className="flex flex-1 items-center gap-2.5">
          <Avatar pseudo={pseudo || "?"} taille={40} />
          <span className="flex flex-col">
            <span className="text-base font-extrabold leading-tight">{pseudo || " "}</span>
            <span className="text-xs text-discret">{echange || " "}</span>
          </span>
        </Link>
      </header>

      <div ref={defilement} className="relative flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto overscroll-contain px-4 py-3.5">
        <div className="flex items-start gap-2.5 rounded-xl bg-avertissement-doux px-3 py-2.5 text-[0.78rem] leading-snug text-avertissement">
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-px shrink-0">
            <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" />
          </svg>
          <span>{t("conseil")}</span>
        </div>
        {nbMessages > 0 ? <p className="self-center text-[0.6875rem] font-semibold text-discret">{t("aujourdhui")}</p> : <p className="self-center text-sm text-discret">{t("vide")}</p>}
        <ol aria-live="polite" className="flex flex-col gap-2.5">
          {conv.data?.messages.map((m) => (
            <Fragment key={m.id}>
              {m.id === depart ? <li role="separator" className="my-1 self-center rounded-full bg-marque-doux px-3 py-1 text-[0.6875rem] font-extrabold text-marque-fonce">{t("nouveaux")}</li> : null}
            <li data-message={m.id} className={`max-w-[80%] px-3.5 py-2.5 text-[0.9375rem] leading-snug ${m.deMoi ? "self-end rounded-[18px_18px_4px_18px] bg-marque text-white" : "self-start rounded-[18px_18px_18px_4px] border-[1.5px] border-trait bg-surface"}`}>
              {m.texte}
            </li>
            </Fragment>
          ))}
        </ol>
      </div>

      <div className="flex shrink-0 flex-col gap-2.5 border-t-[1.5px] border-trait bg-surface px-4 pb-4 pt-2.5">
        <Link href={`/messages/${id}/session`} className="flex min-h-12 items-center justify-center gap-2 rounded-[14px] bg-marque-doux text-[0.9375rem] font-extrabold text-marque-fonce">
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="5" width="16" height="15" rx="2" />
            <path d="M4 10h16M9 3v4M15 3v4" />
          </svg>
          {t("proposer")}
        </Link>
        <form noValidate onSubmit={form.handleSubmit((v) => envoi.mutate(v))} className="flex items-center gap-2">
          <input type="text" aria-label={t("ecrire")} placeholder={t("placeholder")} autoComplete="off" aria-invalid={erreurTexte ? true : undefined} {...form.register("texte")} className="min-h-12 min-w-0 flex-1 rounded-3xl border-[1.5px] border-bord bg-fond px-4 text-[0.9375rem]" />
          <button type="submit" aria-label={t("envoyerLabel")} disabled={envoi.isPending} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-marque text-white disabled:opacity-60">
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12l16-8-6 16-3-6z" />
            </svg>
          </button>
        </form>
        {erreurTexte ? (
          <p role="alert" className="text-[0.8125rem] font-semibold text-alerte">
            {te(erreurTexte)}
          </p>
        ) : null}
        {envoi.error ? <Alerte ton="danger">{te(envoi.error instanceof ApiError ? envoi.error.cle : "errors.generique")}</Alerte> : null}
      </div>
    </main>
  );
}
