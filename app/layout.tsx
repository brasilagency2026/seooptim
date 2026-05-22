import "./globals.css";
import { ReactNode } from "react";
import ConvexClientProvider from "@/components/providers/ConvexClientProvider";
import Script from "next/script";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://votre-portail.com";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: "BDSM BRASIL | Blog & Portal Fetichista",
  description: "O maior portal de conteúdo BDSM e cultura fetichista do Brasil. Guias práticos, análises de especialistas e respostas diretas sobre fetiches.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="pt-BR">
      <body className="bg-slate-50 text-slate-900 min-h-screen">
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}
        <ConvexClientProvider>
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  );
}
