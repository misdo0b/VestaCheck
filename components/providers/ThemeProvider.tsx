'use client';

import React, { useEffect, useState } from 'react';
import { usePreferencesStore } from '@/store/usePreferencesStore';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = usePreferencesStore((state) => state.preferences.theme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [theme, mounted]);

  // Rendu direct pour éviter les problèmes d'hydratation Next.js
  return <>{children}</>;
}
