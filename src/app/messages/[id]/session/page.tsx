import { Suspense } from "react";
import { IDS_PROFILS } from "@/lib/api";
import { SessionVue } from "./session-vue";

export function generateStaticParams() {
  return IDS_PROFILS.map((id) => ({ id: `conv-${id}` }));
}

/** `params` est lu dans un composant sous Suspense : la coque de la page reste instantanée (cacheComponents). */
async function Contenu({ params }: { params: PageProps<"/messages/[id]/session">["params"] }) {
  const { id } = await params;
  return <SessionVue id={id} />;
}

export default function PageSession({ params }: PageProps<"/messages/[id]/session">) {
  return (
    <Suspense>
      <Contenu params={params} />
    </Suspense>
  );
}
