import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Configuration des rôles autorisés par route
const ROLE_ACCESS = {
  '/admin': ['Administrateur'],
  '/agent': ['Administrateur', 'Agent'],
  '/reports': ['Administrateur', 'Agent', 'Propriétaire'],
};

export function middleware(request: NextRequest) {
  // Dans un cas réel, nous extrairions l'utilisateur de la session (JWT, Cookie, etc.)
  // Simulation d'un utilisateur connecté :
  const user = {
    role: 'Agent' as const, // Simulé
    id: 'agent1',
  };

  const { pathname } = request.nextUrl;

  // 1. Vérification de la protection de route
  for (const [route, allowedRoles] of Object.entries(ROLE_ACCESS)) {
    if (pathname.startsWith(route)) {
      if (!allowedRoles.includes(user.role)) {
        // Redirection vers une page non autorisée ou dashboard
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
  }

  // 2. Logique de filtrage par ID (appliquée normalement au niveau des API)
  // Le middleware peut injecter des headers ou vérifier des permissions globales.

  return NextResponse.next();
}

// Configuration optionnelle pour matcher les routes
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
