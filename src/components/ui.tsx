import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { BarreNav } from "./barre-nav";

export function Ecran({ children, nav = false }: { children: ReactNode; nav?: boolean }) {
  return (
    <>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-5 pb-6 pt-7">{children}</main>
      {nav ? <BarreNav /> : null}
    </>
  );
}

export function Titre({ children, sousTitre }: { children: ReactNode; sousTitre?: ReactNode }) {
  return (
    <header className="flex flex-col gap-2">
      <h1 className="pr-12 text-[1.75rem] font-extrabold leading-tight tracking-tight">{children}</h1>
      {sousTitre ? <p className="text-[0.95rem] leading-relaxed text-discret">{sousTitre}</p> : null}
    </header>
  );
}

const baseBouton =
  "flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl px-4 text-base font-bold transition-opacity disabled:opacity-60";

export function Bouton({ className = "", ...props }: ComponentProps<"button">) {
  return <button {...props} className={`${baseBouton} bg-marque text-white ${className}`} />;
}

export function LienBouton({ className = "", secondaire = false, ...props }: ComponentProps<typeof Link> & { secondaire?: boolean }) {
  const style = secondaire ? "bg-transparent text-marque" : "bg-marque text-white";
  return <Link {...props} className={`${baseBouton} ${style} ${className}`} />;
}

export function LienRetour({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} aria-label={label} className="-ml-2 flex h-11 w-11 items-center justify-center">
      <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 5l-7 7 7 7" />
      </svg>
    </Link>
  );
}

interface ChampProps extends Omit<ComponentProps<"input">, "id"> {
  id: string;
  label: string;
  erreur?: string;
  aide?: string;
}

export function Champ({ id, label, erreur, aide, className = "", ...props }: ChampProps) {
  const descr = [aide ? `${id}-aide` : "", erreur ? `${id}-erreur` : ""].filter(Boolean).join(" ") || undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[0.8125rem] font-bold text-encre/80">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={erreur ? true : undefined}
        aria-describedby={descr}
        {...props}
        className={`min-h-[50px] rounded-xl border-[1.5px] bg-surface px-3.5 text-base text-encre ${erreur ? "border-alerte" : "border-bord"} ${className}`}
      />
      {aide ? (
        <p id={`${id}-aide`} className="text-xs leading-snug text-discret">
          {aide}
        </p>
      ) : null}
      {erreur ? (
        <p id={`${id}-erreur`} role="alert" className="text-[0.8125rem] font-semibold text-alerte">
          {erreur}
        </p>
      ) : null}
    </div>
  );
}

export function Selecteur({
  id,
  label,
  erreur,
  children,
  ...props
}: Omit<ComponentProps<"select">, "id"> & { id: string; label: string; erreur?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[0.8125rem] font-bold text-encre/80">
        {label}
      </label>
      <select
        id={id}
        aria-invalid={erreur ? true : undefined}
        aria-describedby={erreur ? `${id}-erreur` : undefined}
        {...props}
        className={`min-h-[50px] rounded-xl border-[1.5px] bg-surface px-3 text-base text-encre ${erreur ? "border-alerte" : "border-bord"}`}
      >
        {children}
      </select>
      {erreur ? (
        <p id={`${id}-erreur`} role="alert" className="text-[0.8125rem] font-semibold text-alerte">
          {erreur}
        </p>
      ) : null}
    </div>
  );
}

export function CaseACocher({
  id,
  children,
  erreur,
  ...props
}: Omit<ComponentProps<"input">, "id" | "type"> & { id: string; erreur?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="flex items-start gap-3 text-sm leading-snug text-encre/85">
        <input
          id={id}
          type="checkbox"
          aria-invalid={erreur ? true : undefined}
          aria-describedby={erreur ? `${id}-erreur` : undefined}
          {...props}
          className="mt-0.5 h-[22px] w-[22px] shrink-0 accent-marque"
        />
        <span>{children}</span>
      </label>
      {erreur ? (
        <p id={`${id}-erreur`} role="alert" className="ml-[34px] text-[0.8125rem] font-semibold text-alerte">
          {erreur}
        </p>
      ) : null}
    </div>
  );
}

export function Alerte({ ton = "info", children }: { ton?: "info" | "danger" | "avertissement"; children: ReactNode }) {
  const styles = {
    info: "bg-marque-doux text-marque-fonce",
    danger: "bg-alerte-doux text-alerte",
    avertissement: "bg-avertissement-doux text-avertissement",
  } as const;
  return (
    <div role={ton === "danger" ? "alert" : undefined} className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${styles[ton]}`}>
      {children}
    </div>
  );
}

export function Pastille({ children, ton = "neutre" }: { children: ReactNode; ton?: "neutre" | "ok" }) {
  const style = ton === "ok" ? "bg-marque-doux text-marque-fonce" : "bg-[#eaeee9] text-[#33403a]";
  return <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${style}`}>{children}</span>;
}

const TEINTES = ["bg-[#ddefea] text-[#0a4f44]", "bg-[#fcefd8] text-[#6b3a04]", "bg-[#eaeee9] text-[#33403a]"] as const;

/** Initiales sur pastille ronde, comme dans la maquette. La teinte dépend du nom, pour reconnaître un membre d'un coup d'oeil. */
export function Avatar({ pseudo, taille = 48 }: { pseudo: string; taille?: 40 | 48 | 64 }) {
  const mots = pseudo.trim().split(/\s+/).filter(Boolean);
  const initiales = (mots.length > 1 ? mots[0][0] + mots[1][0] : (mots[0] ?? "?").slice(0, 2)).toUpperCase();
  const teinte = TEINTES[[...pseudo].reduce((n, c) => n + c.charCodeAt(0), 0) % TEINTES.length];
  const police = taille === 64 ? "text-2xl" : taille === 48 ? "text-lg" : "text-[0.9375rem]";
  return (
    <span aria-hidden="true" style={{ width: taille, height: taille }} className={`flex shrink-0 items-center justify-center rounded-full font-extrabold ${police} ${teinte}`}>
      {initiales}
    </span>
  );
}

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-marque">
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 8h13l-3-3M20 16H7l3 3" />
        </svg>
      </span>
      <span className="text-xl font-extrabold tracking-tight">SkillSwap</span>
    </div>
  );
}

/** Carte blanche de la maquette : rayon 18, trait fin. */
export const CARTE = "rounded-[18px] border-[1.5px] border-trait bg-surface";

/** Pastille verte avec une coche : confirmation d'une action (avis publié, signalement envoyé). */
export function IconeSucces() {
  return (
    <span aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-marque-doux">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0e6b5c" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12l5 5 9-10" />
      </svg>
    </span>
  );
}

/** Choix en pile de la maquette (motifs, modes) : bouton large à bordure verte quand il est choisi. */
export function Option({ actif, onClick, children }: { actif: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-pressed={actif} onClick={onClick} className={`flex min-h-[52px] w-full items-center gap-3 rounded-[14px] border-2 bg-surface px-4 text-left text-[0.9375rem] font-semibold ${actif ? "border-marque" : "border-trait"}`}>
      {children}
    </button>
  );
}
