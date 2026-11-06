"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

const ONGLETS = [
  { href: "/accueil", cle: "accueil", chemin: "M4 11l8-7 8 7v9H4z", aussi: [] },
  { href: "/recherche", cle: "recherche", chemin: "M11 4a7 7 0 105 12l4 4M11 4a7 7 0 010 14", aussi: ["/profils"] },
  { href: "/messages", cle: "messages", chemin: "M4 5h16v11H9l-5 4z", aussi: [] },
  { href: "/competences", cle: "profil", chemin: "M12 4a4 4 0 110 8 4 4 0 010-8zM4 21c1-4 4-6 8-6s7 2 8 6", aussi: ["/sessions"] },
] as const;

export function BarreNav() {
  const t = useTranslations("nav");
  const chemin = usePathname();
  return (
    <nav aria-label={t("principale")} className="sticky bottom-0 mt-auto border-t-[1.5px] border-trait bg-surface">
      <ul className="mx-auto flex max-w-md">
        {ONGLETS.map((o) => {
          const actif = [o.href, ...o.aussi].some((h) => chemin.startsWith(h));
          return (
            <li key={o.href} className="flex-1">
              <Link href={o.href} aria-current={actif ? "page" : undefined} className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[0.6875rem] font-bold ${actif ? "text-marque" : "text-discret"}`}>
                <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={o.chemin} />
                </svg>
                {t(o.cle)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
