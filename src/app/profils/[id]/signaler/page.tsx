import { Suspense } from "react";
import { IDS_PROFILS } from "@/lib/api";
import { SignalerVue } from "./signaler-vue";

export function generateStaticParams() {
  return IDS_PROFILS.map((id) => ({ id }));
}

/** `params` est lu dans un composant sous Suspense : la coque de la page reste instantanée (cacheComponents). */
async function Contenu({ params }: { params: PageProps<"/profils/[id]/signaler">["params"] }) {
  const { id } = await params;
  return <SignalerVue id={id} />;
}

export default function PageSignaler({ params }: PageProps<"/profils/[id]/signaler">) {
  return (
    <Suspense>
      <Contenu params={params} />
    </Suspense>
  );
}
