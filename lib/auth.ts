import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import fs from 'fs/promises';
import path from 'path';
import { UserRole } from "@/types";

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
          // Lecture dynamique de la "Base de données" JSON
          const DB_PATH = path.join(process.cwd(), 'data', 'users-db.json');
          const data = await fs.readFile(DB_PATH, 'utf8');
          const users = JSON.parse(data);

          const loginEmail = (credentials.email as string).toLowerCase();
          const user = users.find((u: any) => u.email.toLowerCase() === loginEmail);
          const { comparePassword } = await import('@/lib/utils/password');

          if (user && await comparePassword(credentials.password as string, user.password)) {
            // On ne renvoie pas le mot de passe vers le client
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
          }
        } catch (error) {
          console.error("Auth DB Error:", error);
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
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role as UserRole;
        (session.user as any).id = token.id as string;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-for-dev-only",
});
