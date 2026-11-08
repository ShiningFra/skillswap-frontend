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
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
