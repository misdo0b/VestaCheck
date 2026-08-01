import { create } from 'zustand';
import { User, SyncStatus } from '@/types';
import { db } from '@/lib/db';

interface UserStore {
  users: User[];
  loading: boolean;
  error: string | null;
  currentUser?: { id: string; role: string; agencyId: string; organizationId: string };

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
  currentUser: undefined,

  initStore: async (user) => {
    set({ loading: true, currentUser: user });
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
        const localUsers = await db.users.toArray();
        const user = get().currentUser;

        // Cloisonnement : filtrer les utilisateurs locaux par rapport au périmètre de l'utilisateur
        const filteredLocal = user ? localUsers.filter(u => {
          if (user.role === 'Administrateur' || user.role === 'Agent') {
            return u.organizationId === user.organizationId;
          }
          return u.id === user.id;
        }) : localUsers;

        const serverUsersMap = new Map<string, User>(serverUsers.map((u: User) => [u.id, u]));
        
        const mergedUsers: User[] = [];
        const toUpload: User[] = [];

        // 1. Parcourir les utilisateurs locaux filtrés
        for (const lu of filteredLocal) {
          const su = serverUsersMap.get(lu.id);
          if (!su) {
            // Existe localement mais pas sur le serveur -> Upload requis
            toUpload.push(lu);
            mergedUsers.push({
              ...lu,
              syncStatus: 'pending'
            });
          } else {
            // Existe des deux côtés -> Comparer les dates
            const localTime = new Date(lu.lastModified).getTime();
            const serverTime = new Date(su.lastModified).getTime();
            
            if (localTime > serverTime || lu.syncStatus === 'pending' || lu.syncStatus === 'error') {
              toUpload.push(lu);
              mergedUsers.push({
                ...lu,
                syncStatus: 'pending'
              });
            } else {
              mergedUsers.push({
                ...su,
                syncStatus: 'synced'
              });
            }
          }
        }

        // 2. Ajouter les utilisateurs du serveur inexistants localement
        const localIds = new Set(localUsers.map(u => u.id));
        for (const su of serverUsers) {
          if (!localIds.has(su.id)) {
            mergedUsers.push({
              ...su,
              syncStatus: 'synced'
            });
          }
        }

        // 3. Enregistrer les mutations manquantes pour l'upload
        if (toUpload.length > 0) {
          console.log(`[Sync] ${toUpload.length} utilisateurs détectés pour réconciliation vers le serveur.`);
          for (const user of toUpload) {
            const queueItems = await db.mutationQueue.where('entityId').equals(user.id).toArray();
            if (queueItems.length === 0) {
              await db.enqueueMutation({
                type: 'CREATE',
                entity: 'user',
                entityId: user.id,
                data: user
              });
            }
          }
        }

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
