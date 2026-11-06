import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { Providers } from "@/components/providers";
import "@fontsource-variable/manrope";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "SkillSwap", template: "%s · SkillSwap" },
  description: "Échange des compétences avec des personnes près de chez toi ou à distance.",
};

export const viewport: Viewport = {
  themeColor: "#0e6b5c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
