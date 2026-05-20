import "./globals.css";
import { ReactNode } from "react";
import ConvexClientProvider from "@/components/providers/ConvexClientProvider";

export const metadata = {
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
