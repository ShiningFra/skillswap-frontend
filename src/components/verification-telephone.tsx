"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Alerte,
  Bouton,
  Champ,
  Ecran,
  LienRetour,
  Titre,
} from "@/components/ui";
import {
  ApiError,
  CODE_DE_TEST,
  MODE_REEL,
  demanderCodeSms,
  verifierCodeSms,
} from "@/lib/api";
import { telephoneSchema, type TelephoneValues } from "@/lib/schemas";

/** « +237 6 •• •• 42 17 » : le numéro n'est jamais réaffiché en entier. */
function masquer(tel: string): string {
  const m = /^(\+\d{3})(\d)\d{4}(\d{2})(\d{2})$/.exec(tel);
  return m ? `${m[1]} ${m[2]} •• •• ${m[3]} ${m[4]}` : tel;
}

const IconeBouclier = () => (
  <span
    aria-hidden="true"
    className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-marque-doux"
  >
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#0e6b5c"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  </span>
);

export function VerificationTelephone({
  retour,
  suite,
  changer = false,
}: {
  retour: string;
  suite: string;
  changer?: boolean;
}) {
  const t = useTranslations();
  const router = useRouter();
  const qc = useQueryClient();
  const [telephone, setTelephone] = useState<string | null>(null);
  const [chiffres, setChiffres] = useState<string[]>(["", "", "", "", "", ""]);
  const cases = useRef<(HTMLInputElement | null)[]>([]);

  const formTel = useForm<TelephoneValues>({
    resolver: zodResolver(telephoneSchema),
    mode: "onTouched",
  });
  const viderCases = () => {
    setChiffres(["", "", "", "", "", ""]);
    setTimeout(() => cases.current[0]?.focus(), 0);
  };
  const envoyer = useMutation({
    mutationFn: demanderCodeSms,
    onSuccess: (_donnees, numero) => setTelephone(numero),
  });
  const renvoyer = useMutation({
    mutationFn: demanderCodeSms,
    onSuccess: viderCases,
  });
  const valider = useMutation({
    mutationFn: verifierCodeSms,
    onError: () => {
      renvoyer.reset();
      viderCases();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["moi"] });
      router.push(suite);
    },
  });
  const msg = (m?: string) => (m ? t(m) : undefined);
  const code = chiffres.join("");

  const saisir = (i: number, brut: string) => {
    const nouveaux = brut.replace(/\D/g, "");
    if (nouveaux === "") {
      setChiffres((c) => c.map((x, k) => (k === i ? "" : x)));
      return;
    }
    // Un collage de plusieurs chiffres remplit les cases suivantes.
    setChiffres((c) =>
      c.map((x, k) =>
        k >= i && k < i + nouveaux.length ? nouveaux[k - i] : x,
      ),
    );
    cases.current[Math.min(i + nouveaux.length, 5)]?.focus();
  };

  const entete = (sousTitre: string) => (
    <div className="flex flex-col gap-2.5">
      <IconeBouclier />
      <Titre sousTitre={sousTitre}>
        {changer ? t("verification.titreChanger") : t("verification.titre")}
      </Titre>
    </div>
  );

  if (telephone === null) {
    return (
      <Ecran>
        <LienRetour href={retour} label={t("common.retour")} />
        {entete(
          changer ? t("verification.introChanger") : t("verification.intro"),
        )}
        <form
          noValidate
          className="flex flex-1 flex-col gap-4"
          onSubmit={formTel.handleSubmit((v) => envoyer.mutate(v.telephone))}
        >
          <Champ
            id="telephone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="+237670000000"
            label={t("verification.telephone")}
            erreur={msg(formTel.formState.errors.telephone?.message)}
            {...formTel.register("telephone")}
          />
          <p className="text-[0.8125rem] leading-snug text-discret">
            {t("verification.limites")}
          </p>
          {envoyer.error ? (
            <Alerte ton="danger">
              {t(
                envoyer.error instanceof ApiError
                  ? envoyer.error.cle
                  : "errors.generique",
              )}
            </Alerte>
          ) : null}
          <div className="mt-auto flex flex-col gap-2.5">
            <Bouton type="submit" disabled={envoyer.isPending}>
              {envoyer.isPending
                ? t("common.chargement")
                : t("verification.envoyerCode")}
            </Bouton>
            {!changer ? (
              <a
                href={suite}
                className="flex min-h-12 items-center justify-center text-[0.9375rem] font-bold text-marque"
              >
                {t("verification.plusTard")}
              </a>
            ) : null}
          </div>
        </form>
      </Ecran>
    );
  }

  return (
    <Ecran>
      <LienRetour href={retour} label={t("common.retour")} />
      {entete(t("verification.introCode", { telephone: masquer(telephone) }))}
      <form
        noValidate
        className="flex flex-1 flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (/^\d{6}$/.test(code)) valider.mutate(code);
        }}
      >
        <div
          role="group"
          aria-label={t("verification.groupeCode")}
          className="flex justify-between gap-2"
        >
          {chiffres.map((c, i) => (
            <input
              key={i}
              ref={(el) => {
                cases.current[i] = el;
              }}
              value={c}
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              aria-label={t("verification.chiffre", { n: i + 1 })}
              onChange={(e) => saisir(i, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Backspace" && c === "" && i > 0)
                  cases.current[i - 1]?.focus();
              }}
              className="h-14 w-[46px] rounded-xl border-[1.5px] border-bord bg-surface p-0 text-center text-2xl font-extrabold"
            />
          ))}
        </div>
        {valider.error ? (
          <Alerte ton="danger">
            {t(
              valider.error instanceof ApiError
                ? valider.error.cle
                : "errors.generique",
            )}
          </Alerte>
        ) : null}
        {renvoyer.error ? (
          <Alerte ton="danger">
            {t(
              renvoyer.error instanceof ApiError
                ? renvoyer.error.cle
                : "errors.generique",
            )}
          </Alerte>
        ) : null}
        {renvoyer.isSuccess ? (
          <Alerte>{t("verification.codeRenvoye")}</Alerte>
        ) : null}
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => {
              valider.reset();
              renvoyer.mutate(telephone);
            }}
            disabled={renvoyer.isPending}
            className="min-h-11 self-start disabled:opacity-60 text-[0.9375rem] font-bold text-marque"
          >
            {t("verification.renvoyer")}
          </button>
          <p className="text-[0.8125rem] leading-snug text-discret">
            {t("verification.limites")}
          </p>
        </div>
        {process.env.NODE_ENV !== "production" ? (
          <Alerte>
            {MODE_REEL
              ? t("verification.codeConsole")
              : t("verification.codeDeTest", { code: CODE_DE_TEST })}
          </Alerte>
        ) : null}
        <div className="mt-auto flex flex-col gap-2.5">
          <Bouton type="submit" disabled={valider.isPending || code.length < 6}>
            {valider.isPending
              ? t("common.chargement")
              : t("verification.valider")}
          </Bouton>
          {!changer ? (
            <a
              href={suite}
              className="flex min-h-12 items-center justify-center text-[0.9375rem] font-bold text-marque"
            >
              {t("verification.plusTard")}
            </a>
          ) : null}
        </div>
      </form>
    </Ecran>
  );
}
