import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SkillSwap",
    short_name: "SkillSwap",
    description: "Échange des compétences avec des personnes près de chez toi ou à distance.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f6f2",
    theme_color: "#0e6b5c",
    lang: "fr",
  };
}
