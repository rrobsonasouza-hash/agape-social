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
  title: {
    default: siteConfig.nome,
    template: `%s | ${siteConfig.nome}`,
  },
  description: siteConfig.descricao,
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
