'use client';

import { useEffect } from 'react';
import { useUserStore } from '@/store/useUserStore';

export function StoreInitializer() {
  const fetchUsers = useUserStore((state) => state.fetchUsers);

  useEffect(() => {
    // Synchronisation initiale au chargement de l'application
    fetchUsers();
  }, [fetchUsers]);

  return null; // Composant invisible
}
