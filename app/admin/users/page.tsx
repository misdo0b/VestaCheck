import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import UserManagement from "@/components/admin/UserManagement";

/**
 * Admin Users Page
 * Protected by role-based access control (Administrateur only)
 */
export default async function AdminUsersPage() {
  const session = await auth();

  // Basic security check (already handled by middleware, but good for SSR redundancy)
  if (!session?.user) {
    redirect("/login");
  }

  // Double check role
  const role = (session.user as any).role;
  if (role !== "Administrateur") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <UserManagement />
    </div>
  );
}
