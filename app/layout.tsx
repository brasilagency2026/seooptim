import "./globals.css";
import { ReactNode } from "react";
import ConvexClientProvider from "@/components/providers/ConvexClientProvider";

export const metadata = {
  title: "Blog Portail SEO",
  description: "Portail optimisé SEO sémantique et indexation LLM",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-slate-50 text-slate-900 min-h-screen">
        <ConvexClientProvider>
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  );
}
