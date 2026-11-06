import { Suspense } from "react";
import { IDS_PROFILS } from "@/lib/api";
import { ConversationVue } from "./conversation-vue";

export function generateStaticParams() {
  return IDS_PROFILS.map((id) => ({ id: `conv-${id}` }));
}

/** `params` est lu dans un composant sous Suspense : la coque de la page reste instantanée (cacheComponents). */
async function Contenu({ params }: { params: PageProps<"/messages/[id]">["params"] }) {
  const { id } = await params;
  return <ConversationVue id={id} />;
}

export default function PageConversation({ params }: PageProps<"/messages/[id]">) {
  return (
    <Suspense>
      <Contenu params={params} />
    </Suspense>
  );
}
