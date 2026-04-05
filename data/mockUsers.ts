import { User } from '@/types';

export const mockUsers: (User & { password: string })[] = [
  {
    id: 'admin_1',
    name: 'Amélie Admin',
    email: 'admin@vestacheck.com',
    password: 'password123',
    role: 'Administrateur',
    agencyId: 'agency_75'
  },
  {
    id: 'agent_1',
    name: 'Jean Agent',
    email: 'agent@vestacheck.com',
    password: 'password123',
    role: 'Agent',
    agencyId: 'agency_75'
  },
  {
    id: 'owner_1',
    name: 'Robert Propriétaire',
    email: 'owner@vestacheck.com',
    password: 'password123',
    role: 'Propriétaire'
  }
];
