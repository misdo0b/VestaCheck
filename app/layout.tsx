import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { StoreInitializer } from "@/components/providers/StoreInitializer";
import { Navbar } from "@/components/layout/Navbar";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

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
      <body className="antialiased font-sans bg-slate-950 text-slate-200 min-h-screen">
        <AuthProvider>
          <ThemeProvider>
            <StoreInitializer />
            <Navbar />
            {children}
          <Analytics />
          <SpeedInsights />
          <Toaster 
            theme="dark" 
            position="top-right" 
            richColors 
            closeButton 
            toastOptions={{
              style: {
                background: 'rgba(15, 23, 42, 0.8)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#f1f5f9',
              },
            }}
          />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

