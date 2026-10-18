import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dimarclub — Marketplace B2C con red de afiliados",
  description:
    "Dimarclub es un marketplace B2C con comisiones por ventas, red de afiliados de 3 niveles, beneficios exclusivos para clientes, socios capitalistas, logística integrada y CRM.",
  keywords: [
    "Dimarclub", "marketplace", "afiliados", "B2C", "comisiones",
    "red de afiliados", "logística", "CRM", "email marketing", "Ecuador",
  ],
  icons: { icon: "/logo.svg" },
  openGraph: {
    title: "Dimarclub",
    description: "Compra, recomienda y gana. El marketplace con comunidad.",
    siteName: "Dimarclub",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${geistSans.variable} antialiased bg-background text-foreground`}>
        {children}
        <Toaster />
        <SonnerToaster richColors position="top-right" />
      </body>
    </html>
  );
}
