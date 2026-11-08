"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { competencesProchesDuSens } from "./api";

/** Voisines par le sens du texte tapé, interrogées 400 ms après la dernière frappe ; `enCours` vaut vrai tant que la réponse n'est pas là. */
export function useProchesDuSens(terme: string) {
  const [stable, setStable] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setStable(terme.trim()), 400);
    return () => clearTimeout(t);
  }, [terme]);
  const { data, isFetching } = useQuery({
    queryKey: ["proches-sens", stable],
    queryFn: () => competencesProchesDuSens(stable),
    enabled: stable.length >= 3,
    staleTime: 5 * 60_000,
  });
  const concerne = terme.trim().length >= 3;
  const enCours = concerne && (stable !== terme.trim() || isFetching);
  return { voisines: concerne && stable === terme.trim() ? (data ?? []) : [], enCours };
}
