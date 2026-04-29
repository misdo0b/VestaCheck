import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  const isLoginPage = pathname === "/login";
  const isRegisterPage = pathname === "/register";
  const isApiRoute = pathname.startsWith("/api");
  const isPublicAsset = pathname.startsWith("/_next") || 
                        pathname.startsWith("/assets") || 
                        pathname.includes("favicon.ico");

  // On laisse passer les routes publiques (login, register, api, assets)
  if (isLoginPage || isRegisterPage || isApiRoute || isPublicAsset) {
    // Si on est déjà connecté et qu'on va sur le login ou register, redirection dashboard
    if (isLoggedIn && (isLoginPage || isRegisterPage)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // 1. Redirection si non connecté pour TOUT le reste
  if (!isLoggedIn) {
     const loginUrl = new URL("/login", req.url);
     // Optionnel : ajouter callbackUrl pour revenir après login
     loginUrl.searchParams.set("callbackUrl", pathname);
     return NextResponse.redirect(loginUrl);
  }

  // 2. Gestion des accès par rôle (basé sur l'existant)
  const userRole = (req.auth?.user as any)?.role;

  const ROLE_ACCESS: Record<string, string[]> = {
    '/admin': ['Administrateur'],
    '/agent': ['Administrateur', 'Agent'],
    '/dashboard/inspections': ['Administrateur', 'Agent', 'Propriétaire'],
  };

  for (const [route, allowedRoles] of Object.entries(ROLE_ACCESS)) {
    if (pathname.startsWith(route)) {
        if (!userRole || !allowedRoles.includes(userRole)) {
            return NextResponse.redirect(new URL("/dashboard", req.url));
        }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
