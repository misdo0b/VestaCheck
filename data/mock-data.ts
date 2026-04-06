import { InspectionReport, User, Property } from '@/types';

export const mockUsers: User[] = [
  {
    id: 'admin1',
    name: 'Mehdi Architecte',
    email: 'admin@vestacheck.fr',
    role: 'Administrateur',
  },
  {
    id: 'agent1',
    name: 'Jean Agent',
    email: 'jean.agent@agence.fr',
    role: 'Agent',
    agencyId: 'agence_nord',
  },
  {
    id: 'owner1',
    name: 'Paul Propriétaire',
    email: 'paul.p@gmail.com',
    role: 'Propriétaire',
  }
];

export const mockProperties: Property[] = [
  {
    id: 'prop_001',
    name: 'Appartement Haussmann - Élysée',
    address: '12 rue de la Paix, 75002 Paris',
    surface: 85,
    type: 'Appartement',
    roomCount: 3,
    ownerId: 'owner1'
  },
  {
    id: 'prop_002',
    name: 'Studio Bastille',
    address: '45 rue de Lappe, 75011 Paris',
    surface: 28,
    type: 'Appartement',
    roomCount: 1,
    ownerId: 'owner1'
  }
];

export const mockInspections: InspectionReport[] = [
  {
    id: 'rep_001',
    propertyId: 'prop_001',
    propertyAddress: '12 rue de la Paix, 75002 Paris',
    date: '2026-04-10',
    type: 'Entrée',
    ownerId: 'owner1',
    inspectorId: 'agent1',
    tenantName: 'Sophie Locataire',
    tenantEmail: 'sophie.l@gmail.com',
    tenantPhone: '06 12 34 56 78',
    counters: {
      water: 125,
      electricity: 4567,
    },
    keyInventories: [
      { id: 'key_1', type: 'Entrée principale', count: 2 },
      { id: 'key_2', type: 'Boîte aux lettres', count: 1 }
    ],
    generalObservations: 'Logement en excellent état général.',
    signatures: {
      tenant: { type: 'Aucune' },
      inspector: { type: 'Aucune' }
    },
    rooms: [
      {
        id: 'room_salon',
        name: 'Salon',
        items: [
          {
            id: 'item_porte',
            label: 'Porte d\'entrée',
            condition: 'Neuf',
            comment: 'Parfait état, serrure fonctionnelle.',
            photos: []
          },
          {
            id: 'item_parquet',
            label: 'Parquet',
            condition: 'Très Bon',
            comment: 'Une légère rayure près du radiateur.',
            photos: []
          }
        ]
      }
    ],
    isFinalized: false,
  }
];
