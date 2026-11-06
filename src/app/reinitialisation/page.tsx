import { Suspense } from "react";
import { ReinitialisationVue } from "./reinitialisation-vue";

export default function PageReinitialisation() {
  return (
    <Suspense>
      <ReinitialisationVue />
    </Suspense>
  );
}
