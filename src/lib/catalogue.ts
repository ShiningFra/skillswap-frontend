"use client";

import { useQuery } from "@tanstack/react-query";
import { listerCompetences } from "./api";

/** Catalogue de compétences (celui de l'API en mode réel) et résolution d'un identifiant en libellé. */
export function useCatalogue() {
  const { data } = useQuery({ queryKey: ["catalogue"], queryFn: listerCompetences, staleTime: Infinity });
  const liste = data ?? [];
  return { liste, libelle: (id: string) => liste.find((c) => c.id === id)?.libelle ?? "…" };
}
