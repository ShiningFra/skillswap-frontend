"use client";

import { useTranslations } from "next-intl";
import { ListeNotifications } from "@/components/liste-notifications";
import { Ecran, LienRetour, Titre } from "@/components/ui";

export default function PageNotifications() {
  const t = useTranslations("notifications");
  const te = useTranslations();
  return (
    <Ecran>
      <LienRetour href="/accueil" label={te("common.retour")} />
      <Titre>{t("titre")}</Titre>
      <ListeNotifications />
    </Ecran>
  );
}
