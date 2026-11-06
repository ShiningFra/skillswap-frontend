"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import {
  Alerte,
  Bouton,
  CARTE,
  Champ,
  Ecran,
  LienRetour,
  Pastille,
  Selecteur,
  Titre,
} from "@/components/ui";
import {
  ApiError,
  annulerCreneau,
  creerCreneau,
  listerMesCreneaux,
} from "@/lib/api";
import { FORMATS } from "@/lib/domain";
import { creneauSchema, type CreneauValues } from "@/lib/schemas";

/** Heure de fin d'un créneau en heure du Cameroun (UTC+1), « 11 h » ou « 11 h 30 ». */
function heureFin(iso: string): string {
  const d = new Date(new Date(iso).getTime() + 3_600_000);
  const h = d.getUTCHours();
  const m = d.getUTCMinutes();
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, "0")}`;
}

export default function PageCreneaux() {
  const t = useTranslations("creneaux");
  const te = useTranslations();
  const qc = useQueryClient();
  const liste = useQuery({
    queryKey: ["mes-creneaux"],
    queryFn: listerMesCreneaux,
  });
  const form = useForm<CreneauValues>({
    resolver: zodResolver(creneauSchema),
    defaultValues: {
      date: "",
      debut: "10:00",
      fin: "11:00",
      format: "LES_DEUX",
    },
  });
  const e = form.formState.errors;
  const msg = (m?: string) => (m ? te(m) : undefined);
  const rafraichir = () => qc.invalidateQueries({ queryKey: ["mes-creneaux"] });
  const ajout = useMutation({
    mutationFn: creerCreneau,
    onSuccess: () => {
      form.reset({
        date: "",
        debut: "10:00",
        fin: "11:00",
        format: "LES_DEUX",
      });
      return rafraichir();
    },
  });
  const annulation = useMutation({
    mutationFn: annulerCreneau,
    onSuccess: rafraichir,
  });

  return (
    <Ecran nav>
      <LienRetour href="/competences" label={te("common.retour")} />
      <Titre sousTitre={t("intro")}>{t("titre")}</Titre>

      <ul className="flex flex-col gap-2.5" aria-live="polite">
        {liste.data?.length === 0 ? (
          <li className="text-sm text-discret">{t("aucun")}</li>
        ) : null}
        {(liste.data ?? []).map((c) => (
          <li
            key={c.id}
            className={`${CARTE} flex items-center justify-between gap-3 p-4`}
          >
            <div className="flex flex-col gap-1">
              <span className="font-extrabold">{c.libelle}</span>
              <span className="text-sm text-discret">
                {t("jusqua", { heure: heureFin(c.fin) })} ·{" "}
                {te(`formats.${c.format}`)}
              </span>
            </div>
            {c.statut === "LIBRE" ? (
              <button
                type="button"
                aria-label={t("annulerAria", { libelle: c.libelle })}
                onClick={() => annulation.mutate(c.id)}
                disabled={annulation.isPending}
                className="min-h-11 rounded-xl border-[1.5px] border-bord px-3 text-sm font-bold text-alerte disabled:opacity-60"
              >
                {t("annuler")}
              </button>
            ) : (
              <Pastille>{t("reserve")}</Pastille>
            )}
          </li>
        ))}
      </ul>
      {annulation.error ? (
        <Alerte ton="danger">
          {te(
            annulation.error instanceof ApiError
              ? annulation.error.cle
              : "errors.generique",
          )}
        </Alerte>
      ) : null}

      <form
        noValidate
        className={`${CARTE} flex flex-col gap-4 p-4`}
        onSubmit={form.handleSubmit((v) => ajout.mutate(v))}
      >
        <h2 className="text-base font-extrabold">{t("ajouter")}</h2>
        <Champ
          id="date"
          type="date"
          onFocus={(ev) =>
            (ev.currentTarget.min = new Date().toISOString().slice(0, 10))
          }
          label={t("date")}
          erreur={msg(e.date?.message)}
          {...form.register("date")}
        />
        <div className="grid grid-cols-2 gap-3">
          <Champ
            id="debut"
            type="time"
            label={t("debut")}
            erreur={msg(e.debut?.message)}
            {...form.register("debut")}
          />
          <Champ
            id="fin"
            type="time"
            label={t("fin")}
            erreur={msg(e.fin?.message)}
            {...form.register("fin")}
          />
        </div>
        <Selecteur id="format" label={t("format")} {...form.register("format")}>
          {FORMATS.map((f) => (
            <option key={f} value={f}>
              {te(`formats.${f}`)}
            </option>
          ))}
        </Selecteur>
        {ajout.error ? (
          <Alerte ton="danger">
            {te(
              ajout.error instanceof ApiError
                ? ajout.error.cle
                : "errors.generique",
            )}
          </Alerte>
        ) : null}
        <Bouton type="submit" disabled={ajout.isPending}>
          {ajout.isPending ? te("common.chargement") : t("enregistrer")}
        </Bouton>
      </form>
    </Ecran>
  );
}
