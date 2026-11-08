"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { Alerte, Bouton, CARTE, Champ } from "@/components/ui";
import { ApiError, listerParametresAdmin, modifierParametre } from "@/lib/api";
import type { CleParametre, Parametre } from "@/lib/domain";

export default function PageParametres() {
  const t = useTranslations("parametres");
  const te = useTranslations();
  const f = useFormatter();
  const qc = useQueryClient();
  const msg = (e: unknown) => te(e instanceof ApiError ? e.cle : "errors.generique");

  const liste = useQuery({ queryKey: ["admin", "parametres"], queryFn: listerParametresAdmin, retry: false });
  const [mdp, setMdp] = useState("");
  const [messages, setMessages] = useState<Partial<Record<CleParametre, string>>>({});
  const [fait, setFait] = useState<CleParametre | null>(null);

  const changer = useMutation({
    mutationFn: ({ cle, actif, message }: { cle: CleParametre; actif: boolean; message: string }) =>
      modifierParametre(cle, { actif, message: message.trim() || null, motDePasse: mdp }),
    onSuccess: (_r, v) => {
      setFait(v.cle);
      qc.invalidateQueries({ queryKey: ["admin", "parametres"] });
      qc.invalidateQueries({ queryKey: ["parametres"] });
    },
  });

  if (liste.error)
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-5 pt-7">
        <Alerte ton="danger">{msg(liste.error)}</Alerte>
      </main>
    );
  if (!liste.data) return <main className="flex-1" aria-busy="true" />;

  const message = (p: Parametre) => messages[p.cle] ?? p.message ?? "";

  return (
    <main className="mx-auto flex w-full max-w-[720px] flex-1 flex-col gap-6 px-5 pb-10 pt-7">
      <header className="flex flex-col gap-1">
        <Link href="/admin" className="text-sm font-bold text-marque">
          ← {t("retourAdmin")}
        </Link>
        <h1 className="pr-12 text-[1.75rem] font-extrabold leading-tight tracking-tight">{t("titre")}</h1>
        <p className="text-sm text-discret">{t("intro")}</p>
      </header>

      <div className={`${CARTE} p-4`}>
        <Champ id="mdp-parametres" type="password" autoComplete="current-password" label={te("admin.confirmerMdp")} value={mdp} onChange={(e) => setMdp(e.target.value)} />
      </div>

      {changer.error ? <Alerte ton="danger">{msg(changer.error)}</Alerte> : null}

      <ul className="flex flex-col gap-4">
        {liste.data.map((p) => (
          <li key={p.cle} className={`${CARTE} flex flex-col gap-3 p-4`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-0.5">
                <h2 className="text-base font-extrabold">{t(`noms.${p.cle}`)}</h2>
                <p className="text-sm text-discret">{t(`descriptions.${p.cle}`)}</p>
              </div>
              <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-extrabold ${p.actif ? "bg-marque-doux text-marque-fonce" : "bg-avertissement-doux text-avertissement"}`}>
                {p.actif ? t("actif") : t("enRevisionEtat")}
              </span>
            </div>
            <Champ
              id={`message-${p.cle}`}
              label={t("message")}
              placeholder={t("messagePlaceholder")}
              maxLength={200}
              value={message(p)}
              onChange={(e) => {
                setFait(null);
                setMessages((m) => ({ ...m, [p.cle]: e.target.value }));
              }}
            />
            <div className="flex flex-wrap items-center gap-3">
              <Bouton
                type="button"
                disabled={!mdp || changer.isPending}
                onClick={() => changer.mutate({ cle: p.cle, actif: !p.actif, message: message(p) })}
              >
                {p.actif ? t("mettreEnRevision") : t("reactiver")}
              </Bouton>
              {!p.actif ? (
                <button
                  type="button"
                  disabled={!mdp || changer.isPending}
                  onClick={() => changer.mutate({ cle: p.cle, actif: false, message: message(p) })}
                  className="min-h-11 px-2 text-sm font-bold text-marque disabled:opacity-50"
                >
                  {t("enregistrerMessage")}
                </button>
              ) : null}
              {fait === p.cle ? <span role="status" className="text-sm font-semibold text-marque">{t("enregistre")}</span> : null}
            </div>
            {p.modifieLe ? <p className="text-xs text-discret">{t("modifiePar", { date: f.dateTime(new Date(p.modifieLe), { dateStyle: "medium", timeStyle: "short" }) })}</p> : null}
          </li>
        ))}
      </ul>
    </main>
  );
}
