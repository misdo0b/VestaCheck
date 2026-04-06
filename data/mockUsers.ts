import { User } from '@/types';

export const mockUsers: (User & { password: string })[] = [
  {
    id: 'admin_1',
    name: 'Amélie Admin',
    email: 'admin@vestacheck.com',
    password: 'password123',
    role: 'Administrateur',
    agencyId: 'agency_75',
    serverVersion: 1,
    lastModified: new Date().toISOString(),
    syncStatus: 'synced'
  },
  {
    id: 'agent_1',
    name: 'Jean Agent',
    email: 'agent@vestacheck.com',
    password: 'password123',
    role: 'Agent',
    agencyId: 'agency_75',
    serverVersion: 1,
    lastModified: new Date().toISOString(),
    syncStatus: 'synced'
  },
  {
    id: 'owner_1',
    name: 'Robert Propriétaire',
    email: 'owner@vestacheck.com',
    password: 'password123',
    role: 'Propriétaire',
    serverVersion: 1,
    lastModified: new Date().toISOString(),
    syncStatus: 'synced'
  }
];
