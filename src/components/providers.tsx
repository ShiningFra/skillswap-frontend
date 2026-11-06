"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: false } } }));
  // Quand le service worker reçoit un push, les écrans ouverts se mettent à jour tout de suite.
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const surMessage = (e: MessageEvent) => {
      if (e.data?.type !== "push") return;
      for (const cle of ["conversations", "conversation", "notifs", "sessions", "session"]) client.invalidateQueries({ queryKey: [cle] });
    };
    navigator.serviceWorker.addEventListener("message", surMessage);
    return () => navigator.serviceWorker.removeEventListener("message", surMessage);
  }, [client]);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
