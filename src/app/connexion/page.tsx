"use client";

import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alerte, Bouton, Champ, Ecran, Titre } from "@/components/ui";
import { ApiError, connecter } from "@/lib/api";

export default function PageConnexion() {
  const t = useTranslations("connexion");
  const te = useTranslations();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const envoi = useMutation({
    mutationFn: connecter,
    onSuccess: () => router.push("/accueil"),
  });

  return (
    <Ecran>
      <Titre sousTitre={t("sousTitre")}>{t("titre")}</Titre>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          envoi.mutate({ email, motDePasse });
        }}
      >
        <Champ
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          label={t("email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Champ
          id="motDePasse"
          type="password"
          autoComplete="current-password"
          label={t("motDePasse")}
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          required
        />
        {envoi.error ? (
          <Alerte ton="danger">
            {te(
              envoi.error instanceof ApiError
                ? envoi.error.cle
                : "errors.generique",
            )}
          </Alerte>
        ) : null}
        <Bouton type="submit" disabled={envoi.isPending}>
          {envoi.isPending ? te("common.chargement") : t("valider")}
        </Bouton>
        <Link
          href="/mot-de-passe-oublie"
          className="self-center py-2 text-sm font-bold text-marque"
        >
          {t("oublie")}
        </Link>
      </form>
      <p className="text-center text-sm text-discret">
        {t("pasDeCompte")}{" "}
        <Link href="/inscription" className="font-bold text-marque underline">
          {t("creer")}
        </Link>
      </p>
    </Ecran>
  );
}
