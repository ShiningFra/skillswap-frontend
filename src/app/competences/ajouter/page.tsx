import { Suspense } from "react";
import { AjoutCompetenceVue } from "./ajout-vue";

export default function PageAjoutCompetence() {
  return (
    <Suspense>
      <AjoutCompetenceVue />
    </Suspense>
  );
}
