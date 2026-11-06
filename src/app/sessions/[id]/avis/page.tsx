import { Suspense } from "react";
import { IDS_SESSIONS } from "@/lib/api";
import { AvisVue } from "./avis-vue";

export function generateStaticParams() {
  return IDS_SESSIONS.map((id) => ({ id }));
}

/** `params` est lu dans un composant sous Suspense : la coque de la page reste instantanée (cacheComponents). */
async function Contenu({ params }: { params: PageProps<"/sessions/[id]/avis">["params"] }) {
  const { id } = await params;
  return <AvisVue id={id} />;
}

export default function PageAvis({ params }: PageProps<"/sessions/[id]/avis">) {
  return (
    <Suspense>
      <Contenu params={params} />
    </Suspense>
  );
}
