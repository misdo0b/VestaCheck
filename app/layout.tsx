import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { StoreInitializer } from "@/components/providers/StoreInitializer";
import { Navbar } from "@/components/layout/Navbar";
import { Toaster } from "sonner";

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
    <html lang="fr" className="dark">
      <body className="antialiased font-sans bg-slate-950 text-slate-200 min-h-screen">
        <AuthProvider>
          <StoreInitializer />
          <Navbar />
          {children}
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
        </AuthProvider>
      </body>
    </html>
  );
}

