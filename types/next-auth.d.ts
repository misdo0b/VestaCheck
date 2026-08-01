import { UserRole } from "./index";
import DefaultAuth from "next-auth";

declare module "next-auth" {
  interface User {
    role?: UserRole;
    organizationId?: string;
    agencyId?: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      organizationId: string;
      agencyId: string;
    } & DefaultAuth.Session["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole;
    organizationId?: string;
    agencyId?: string;
  }
}
