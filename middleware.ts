import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  // 1. Redirection si non connecté
  if (!isLoggedIn && (pathname.startsWith("/dashboard") || pathname.startsWith("/inspections"))) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 2. Redirection si déjà connecté vers le dashboard (évite la page login)
  if (isLoggedIn && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // 3. Gestion des accès par rôle (basé sur l'existant)
  const userRole = (req.auth?.user as any)?.role;

  const ROLE_ACCESS: Record<string, string[]> = {
    '/admin': ['Administrateur'],
    '/agent': ['Administrateur', 'Agent'],
    '/inspections': ['Administrateur', 'Agent', 'Propriétaire'],
  };

  for (const [route, allowedRoles] of Object.entries(ROLE_ACCESS)) {
    if (pathname.startsWith(route)) {
        if (!userRole || !allowedRoles.includes(userRole)) {
            // Si le rôle ne correspond pas, redirection vers dashboard principal
            return NextResponse.redirect(new URL("/dashboard", req.url));
        }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
