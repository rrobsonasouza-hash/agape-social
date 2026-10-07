import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";

import { siteConfig } from "@/config/site";
import { AuthProvider } from "@/modules/auth/hooks/useAuth";
import { PwaRegistrar } from "@/components/pwa/PwaRegistrar";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  applicationName: siteConfig.nome,
  title: {
    default: "Ágape Social — Sistema de Gestão para a Igreja Católica",
    template: `%s | ${siteConfig.nome}`,
  },
  description: siteConfig.descricao,
  keywords: [
    "sistema para igreja católica",
    "sistema de gestão paroquial",
    "software para paróquia católica",
    "gestão de pastoral social",
    "secretaria paroquial",
    "tesouraria paroquial",
    "gestão de dízimos",
    "sistema para ECC",
  ],
  category: "business software",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: siteConfig.nome,
    title: "Ágape Social — Sistema de Gestão para a Igreja Católica",
    description: siteConfig.descricao,
  },
  twitter: {
    card: "summary",
    title: "Ágape Social — Gestão Paroquial Católica Integrada",
    description: siteConfig.descricao,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  manifest: "/manifest.webmanifest",
  icons: { icon: "/agape-icon.svg", apple: "/agape-icon.svg" },
  appleWebApp: { capable: true, title: "Ágape" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen font-sans`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "@id": `${siteConfig.url}/#website`,
                  name: siteConfig.nome,
                  alternateName: ["Ágape", "Agape Social", "agape-social.vercel.app"],
                  url: `${siteConfig.url}/`,
                  inLanguage: siteConfig.locale,
                },
                {
                  "@type": "Organization",
                  "@id": `${siteConfig.url}/#organization`,
                  name: siteConfig.nome,
                  url: `${siteConfig.url}/`,
                  logo: `${siteConfig.url}/agape-icon.svg`,
                  telephone: siteConfig.telefoneLink,
                },
              ],
            }),
          }}
        />
        <PwaRegistrar /><AuthProvider>{children}</AuthProvider>

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
          }}
        />
      </body>
    </html>
  );
}
