"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Avatar, CARTE, Ecran, Titre } from "@/components/ui";
import { listerConversations } from "@/lib/api";

export default function PageMessages() {
  const t = useTranslations("messages");
  const { data } = useQuery({ queryKey: ["conversations"], queryFn: listerConversations, refetchInterval: 8000 });
  return (
    <Ecran nav>
      <Titre>{t("titre")}</Titre>
      {data?.length === 0 ? <p className="text-sm text-discret">{t("aucune")}</p> : null}
      <ul className="flex flex-col gap-2.5">
        {data?.map((c) => (
          <li key={c.id}>
            <Link href={`/messages/${c.id}`} className={`${CARTE} flex items-center gap-3 px-4 py-3`}>
              <Avatar pseudo={c.membre.pseudo} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-extrabold">{c.membre.pseudo}</span>
                <span className={`truncate text-sm ${c.nonLus ? "font-bold text-encre" : "text-discret"}`}>{c.dernierMessage || t("vide")}</span>
              </span>
              {c.nonLus ? (
                <span aria-label={t("nonLus", { count: c.nonLus })} className="flex h-6 min-w-6 items-center justify-center rounded-full bg-marque px-1.5 text-xs font-extrabold text-white">
                  {c.nonLus}
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </Ecran>
  );
}
