import { InspectionReport, User } from '@/types';

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

export const mockInspections: InspectionReport[] = [
  {
    id: 'rep_001',
    propertyAddress: '12 rue de la Paix, 75002 Paris',
    date: '2026-04-10',
    type: 'Entrée',
    ownerId: 'owner1',
    inspectorId: 'agent1',
    tenantName: 'Sophie Locataire',
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
