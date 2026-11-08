"use client";

import { useQuery } from "@tanstack/react-query";
import { listerParametres } from "./api";
import type { CleParametre } from "./domain";

/**
 * État des fonctionnalités pilotées par l'administration. Tant que la réponse n'est pas là (ou en cas d'échec),
 * tout est considéré actif : on ne bloque jamais un membre sur un doute, le serveur reste l'arbitre.
 */
export function useParametres() {
  const { data } = useQuery({
    queryKey: ["parametres"],
    queryFn: listerParametres,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
  return {
    actif: (cle: CleParametre) => data?.find((p) => p.cle === cle)?.actif ?? true,
    message: (cle: CleParametre) => data?.find((p) => p.cle === cle)?.message ?? null,
  };
}
