import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { UserRole } from "@/types";
import { getSupabase } from "@/lib/supabase";
import { sendWelcomeEmail } from "@/lib/mail";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET,
    }),
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
            return {
              id: userWithoutPassword.id,
              name: userWithoutPassword.name,
              email: userWithoutPassword.email,
              role: userWithoutPassword.role as UserRole,
              organizationId: userWithoutPassword.organization_id,
              agencyId: userWithoutPassword.agency_id,
            };
          }
        } catch (error) {
          console.error("Auth Supabase Error:", error);
        }

        return null;
      }
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        const email = user.email?.toLowerCase();
        if (!email) return false;

        try {
          const supabase = await getSupabase(true);
          const { data: dbUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

          if (!dbUser) {
            const { randomUUID } = await import('crypto');
            const newUserId = randomUUID();
            const defaultOrgId = "00000000-0000-0000-0000-000000000002";
            const defaultAgencyId = "00000000-0000-0000-0000-000000000001";

            const { error: insertError } = await supabase
              .from('users')
              .insert({
                id: newUserId,
                email: email,
                name: user.name || email.split('@')[0],
                role: 'Agent',
                organization_id: defaultOrgId,
                agency_id: defaultAgencyId,
                server_version: 1,
                last_modified: new Date().toISOString(),
                sync_status: 'synced'
              });

            if (insertError) {
              console.error("SSO Signin Auto-Create Error:", insertError);
              return false;
            }

            // Envoi asynchrone non-bloquant du mail de bienvenue pour le nouvel Agent SSO
            const welcomeName = user.name || email.split('@')[0];
            sendWelcomeEmail(email, welcomeName, "Agence Principale").catch((err) => {
              console.error("[Mail] Échec d'envoi du mail de bienvenue SSO:", err);
            });
          }
        } catch (err) {
          console.error("SSO Signin Callback Error:", err);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account, trigger, session }) {
      if (trigger === "update" && session?.user) {
        if (session.user.name) token.name = session.user.name;
        if (session.user.email) token.email = session.user.email;
        if (session.user.role) token.role = session.user.role;
        if (session.user.agencyId) token.agencyId = session.user.agencyId;
        if (session.user.organizationId) token.organizationId = session.user.organizationId;
      }
      if (user) {
        if (account && account.provider === 'google') {
          const email = user.email?.toLowerCase();
          if (email) {
            try {
              const supabase = await getSupabase(true);
              const { data: dbUser } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .single();

              if (dbUser) {
                token.id = dbUser.id;
                token.role = dbUser.role as UserRole;
                token.organizationId = dbUser.organization_id;
                token.agencyId = dbUser.agency_id;
              }
            } catch (err) {
              console.error("SSO JWT Error:", err);
            }
          }
        } else {
          // For Credentials login, user is already returned from authorize() with camelCase mapped fields
          token.id = user.id;
          token.role = user.role;
          token.organizationId = user.organizationId;
          token.agencyId = user.agencyId;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as UserRole;
        session.user.id = token.id as string;
        session.user.organizationId = token.organizationId as string;
        session.user.agencyId = token.agencyId as string;
        if (token.name) session.user.name = token.name;
        if (token.email) session.user.email = token.email;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-for-dev-only",
});

