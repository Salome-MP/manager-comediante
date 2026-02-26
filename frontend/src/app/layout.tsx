import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";
import LayoutWrapper from "@/components/layout/layout-wrapper";

export const metadata: Metadata = {
  title: "Comediantes.com - El humor que estás buscando",
  description: "Plataforma que centraliza el ecosistema del humor en Latinoamérica. Encuentra a tus comediantes favoritos, compra mercancía oficial y entradas a shows.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <LayoutWrapper>{children}</LayoutWrapper>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
