import { Suspense } from "react";
import { ListeCompetencesVue } from "./liste-vue";

export default function PageCompetences() {
  return (
    <Suspense>
      <ListeCompetencesVue />
    </Suspense>
  );
}
