import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { UserRole } from "@/types";
import { getSupabase } from "@/lib/supabase";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const supabase = await getSupabase(true); // Service role pour bypass RLS lors du login
          
          const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', (credentials.email as string).toLowerCase())
            .single();

          if (error || !user) {
            console.warn("Auth: Utilisateur non trouvé");
            return null;
          }

          const { comparePassword } = await import('@/lib/utils/password');

          if (await comparePassword(credentials.password as string, user.password)) {
            // On ne renvoie pas le mot de passe vers le client
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
          }
        } catch (error) {
          console.error("Auth Supabase Error:", error);
        }

        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
        token.organizationId = (user as any).organizationId || (user as any).organization_id;
        token.agencyId = (user as any).agencyId || (user as any).agency_id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role as UserRole;
        (session.user as any).id = token.id as string;
        (session.user as any).organizationId = token.organizationId as string;
        (session.user as any).agencyId = token.agencyId as string;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-for-dev-only",
});
