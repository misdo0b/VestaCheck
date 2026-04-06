import { create } from 'zustand';
import { User, SyncStatus } from '@/types';
import { db } from '@/lib/db';

interface UserStore {
  users: User[];
  loading: boolean;
  error: string | null;

  // Actions
  initStore: () => Promise<void>;
  fetchUsers: () => Promise<void>; // Fetch from server and update local
  addUser: (user: Omit<User, 'serverVersion' | 'lastModified' | 'syncStatus'>) => Promise<void>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
}

export const useUserStore = create<UserStore>((set, get) => ({
  users: [],
  loading: false,
  error: null,

  initStore: async () => {
    set({ loading: true });
    try {
      const localUsers = await db.users.toArray();
      set({ users: localUsers, loading: false });
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
        // Mise à jour de la base de données locale
        await db.users.bulkPut(serverUsers);
        set({ users: serverUsers, loading: false });
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

    set((state) => ({ users: [...state.users, newUser] }));

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
