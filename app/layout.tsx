import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VestaCheck - État des Lieux Numérique",
  description: "Application professionnelle d'état des lieux pour agents et propriétaires.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>
        {children}
      </body>
    </html>
  );
}
