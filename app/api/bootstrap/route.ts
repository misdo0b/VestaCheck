import { NextResponse } from 'next/server';
import { mockProperties, mockUsers } from '@/data/mock-data';

/**
 * GET /api/bootstrap
 * Renvoie les Biens et les Utilisateurs pour l'initialisation du cache local.
 */
export async function GET() {
  try {
    // Dans une application réelle, on filtrerait ici les données selon l'utilisateur
    // en fonction de son rôle et de son organisation / agence.
    
    return NextResponse.json({
      properties: mockProperties,
      users: mockUsers,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Bootstrap error:', error);
    return NextResponse.json({ error: 'Erreur lors du bootstrap' }, { status: 500 });
  }
}
