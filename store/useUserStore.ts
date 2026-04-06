import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '@/types';
import { mockUsers } from '@/data/mock-data';
import { idbStorage } from '@/lib/utils/store-storage';

interface UserStore {
  users: User[];
  loading: boolean;

  // Actions
  fetchUsers: () => Promise<void>;
  addUser: (user: User) => Promise<void>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
}

// Helper pour synchroniser avec le serveur
const syncWithServer = async (users: User[]) => {
  try {
    await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(users),
    });
  } catch (error) {
    console.error('Sync failed:', error);
  }
};

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      users: [], // Initialisé vide, sera rempli par fetchUsers ou la persistance IDB
      loading: false,

      fetchUsers: async () => {
        set({ loading: true });
        try {
          const res = await fetch('/api/users');
          const users = await res.json();
          if (Array.isArray(users)) {
            set({ users, loading: false });
          }
        } catch (error) {
          console.error('Fetch users failed:', error);
          set({ loading: false });
        }
      },
      
      addUser: async (user) => {
        set((state) => ({
          users: [...state.users, user]
        }));
        await syncWithServer(get().users);
      },

      updateUser: async (id, updates) => {
        set((state) => ({
          users: state.users.map(u => u.id === id ? { ...u, ...updates } : u)
        }));
        await syncWithServer(get().users);
      },

      deleteUser: async (id) => {
        set((state) => ({
          users: state.users.filter(u => u.id !== id)
        }));
        await syncWithServer(get().users);
      },
    }),
    {
      name: 'vestacheck-users-storage',
      storage: createJSONStorage(() => idbStorage),
    }
  )
);
