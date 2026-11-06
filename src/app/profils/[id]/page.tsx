import { Suspense } from "react";
import { IDS_PROFILS } from "@/lib/api";
import { ProfilVue } from "./profil-vue";

export function generateStaticParams() {
  return IDS_PROFILS.map((id) => ({ id }));
}

/** `params` est lu dans un composant sous Suspense : la coque de la page reste instantanée (cacheComponents). */
async function Contenu({ params }: { params: PageProps<"/profils/[id]">["params"] }) {
  const { id } = await params;
  return <ProfilVue id={id} />;
}

export default function PageProfil({ params }: PageProps<"/profils/[id]">) {
  return (
    <Suspense>
      <Contenu params={params} />
    </Suspense>
  );
}
