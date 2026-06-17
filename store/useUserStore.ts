import { create } from 'zustand';
import { User, SyncStatus } from '@/types';
import { db } from '@/lib/db';

interface UserStore {
  users: User[];
  loading: boolean;
  error: string | null;

  // Actions
  initStore: (user: { id: string; role: string; agencyId: string; organizationId: string }) => Promise<void>;
  fetchUsers: () => Promise<void>; // Fetch from server and update local
  addUser: (user: Omit<User, 'serverVersion' | 'lastModified' | 'syncStatus'>) => Promise<void>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
}

export const useUserStore = create<UserStore>((set, get) => ({
  users: [],
  loading: false,
  error: null,

  initStore: async (user) => {
    set({ loading: true });
    try {
      const allLocalUsers = await db.users.toArray();
      
      // Segmentation des données
      const filteredUsers = allLocalUsers.filter(u => {
        if (user.role === 'Administrateur') {
          // L'admin voit les utilisateurs de son organisation
          return u.organizationId === user.organizationId;
        }
        if (user.role === 'Agent') {
          // L'agent voit les utilisateurs de son agence (ou au moins les propriétaires/locataires liés)
          // Pour simplifier, on limite à l'organisation pour l'instant
          return u.organizationId === user.organizationId;
        }
        return u.id === user.id;
      });

      set({ users: filteredUsers, loading: false });
    } catch (err) {
      console.error('Failed to init UserStore:', err);
      set({ loading: false, error: 'Erreur lors du chargement local' });
    }
  },

  fetchUsers: async () => {
    set({ loading: true });
    try {
      const res = await fetch('/api/users');
      const serverUsers = await res.json();
      
      if (Array.isArray(serverUsers)) {
        // On récupère les utilisateurs locaux pour préserver les modifications non synchronisées
        const localUsers = await db.users.toArray();
        const localPendingOrError = new Map(
          localUsers
            .filter(u => u.syncStatus === 'pending' || u.syncStatus === 'error')
            .map(u => [u.id, u])
        );

        const mergedUsers = serverUsers.map((su: User) => {
          const local = localPendingOrError.get(su.id);
          if (local) {
            return local;
          }
          return {
            ...su,
            syncStatus: 'synced' as const
          };
        });

        // Ajouter aussi les utilisateurs créés localement qui ne sont pas encore sur le serveur
        const serverIds = new Set(serverUsers.map((u: User) => u.id));
        localUsers.forEach(lu => {
          if ((lu.syncStatus === 'pending' || lu.syncStatus === 'error') && !serverIds.has(lu.id)) {
            mergedUsers.push(lu);
          }
        });

        await db.users.bulkPut(mergedUsers);
        set({ users: mergedUsers, loading: false });
      }
    } catch (error) {
      console.warn('Fetch users failed, using local data:', error);
      const localUsers = await db.users.toArray();
      set({ users: localUsers, loading: false });
    }
  },
  
  addUser: async (userData) => {
    const newUser: User = {
      ...userData,
      serverVersion: 0,
      lastModified: new Date().toISOString(),
      syncStatus: 'pending'
    };

    set((state) => {
      const exists = state.users.some(u => u.id === newUser.id);
      if (exists) {
        return { users: state.users.map(u => u.id === newUser.id ? newUser : u) };
      }
      return { users: [...state.users, newUser] };
    });

    try {
      await db.users.add(newUser);
      await db.enqueueMutation({
        type: 'CREATE',
        entity: 'user',
        entityId: newUser.id,
        data: newUser
      });
      // La synchro effective sera gérée par le hook useSync
    } catch (err) {
      console.error('Failed to add user locally:', err);
    }
  },

  updateUser: async (id, updates) => {
    set((state) => ({
      users: state.users.map(u => u.id === id ? { 
        ...u, 
        ...updates, 
        syncStatus: 'pending',
        lastModified: new Date().toISOString() 
      } : u)
    }));

    try {
      await db.users.update(id, { 
        ...updates, 
        syncStatus: 'pending',
        lastModified: new Date().toISOString() 
      });
      
      await db.enqueueMutation({
        type: 'UPDATE',
        entity: 'user',
        entityId: id,
        data: updates
      });
    } catch (err) {
      console.error('Failed to update user locally:', err);
    }
  },

  deleteUser: async (id) => {
    set((state) => ({
      users: state.users.filter(u => u.id !== id)
    }));

    try {
      await db.users.delete(id);
      await db.enqueueMutation({
        type: 'DELETE',
        entity: 'user',
        entityId: id,
        data: { id }
      });
    } catch (err) {
      console.error('Failed to delete user locally:', err);
    }
  },
}));
