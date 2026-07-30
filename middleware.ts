import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  const isLoginPage = pathname === "/login";
  const isRegisterPage = pathname === "/register";
  const isOnboardingPage = pathname === "/onboarding";
  const isApiRoute = pathname.startsWith("/api");
  const isPublicAsset = pathname.startsWith("/_next") || 
                        pathname.startsWith("/assets") || 
                        pathname.includes("favicon.ico");

  const sessionUser = req.auth?.user as any;

  // 1. Utilisateur non connecté : rediriger vers /login sauf routes publiques
  if (!isLoggedIn) {
    if (isLoginPage || isRegisterPage || isApiRoute || isPublicAsset) {
      return NextResponse.next();
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Utilisateur connecté mais SANS agence (nouveau compte OAuth SSO)
  if (!sessionUser?.agencyId) {
    if (isOnboardingPage || isApiRoute || isPublicAsset) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  // 3. Utilisateur connecté AVEC agence tentant d'accéder aux pages d'auth/onboarding
  if (isLoginPage || isRegisterPage || isOnboardingPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
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
