import "./globals.css";
import { ReactNode } from "react";
import ConvexClientProvider from "@/components/providers/ConvexClientProvider";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://votre-portail.com";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: "BDSM BRASIL | Blog & Portal Fetichista",
  description: "O maior portal de conteúdo BDSM e cultura fetichista do Brasil. Guias práticos, análises de especialistas e respostas diretas sobre fetiches.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-slate-50 text-slate-900 min-h-screen">
        <ConvexClientProvider>
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  );
}
