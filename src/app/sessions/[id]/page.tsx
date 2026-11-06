import { Suspense } from "react";
import { IDS_SESSIONS } from "@/lib/api";
import { SessionDetail } from "./session-detail";

export function generateStaticParams() {
  return IDS_SESSIONS.map((id) => ({ id }));
}

/** `params` est lu dans un composant sous Suspense : la coque de la page reste instantanée (cacheComponents). */
async function Contenu({ params }: { params: PageProps<"/sessions/[id]">["params"] }) {
  const { id } = await params;
  return <SessionDetail id={id} />;
}

export default function PageSessionDetail({ params }: PageProps<"/sessions/[id]">) {
  return (
    <Suspense>
      <Contenu params={params} />
    </Suspense>
  );
}
