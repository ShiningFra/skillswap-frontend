"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { competencesProchesDuSens } from "./api";

/** Voisines par le sens du texte tapé, interrogées 400 ms après la dernière frappe. */
export function useProchesDuSens(terme: string) {
  const [stable, setStable] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setStable(terme.trim()), 400);
    return () => clearTimeout(t);
  }, [terme]);
  const { data } = useQuery({
    queryKey: ["proches-sens", stable],
    queryFn: () => competencesProchesDuSens(stable),
    enabled: stable.length >= 3,
    staleTime: 5 * 60_000,
  });
  return stable.length >= 3 && stable === terme.trim() ? (data ?? []) : [];
}
