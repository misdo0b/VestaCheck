'use client';

import React from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogOut, User as UserIcon, ShieldCheck, Building2, Users } from 'lucide-react';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const user = session?.user as any;
  const role = user?.role || 'Utilisateur';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pt-16">
      <main className="max-w-7xl mx-auto px-4 py-12">
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">Bienvenue, {user?.name || 'Utilisateur'}</h1>
          <p className="text-slate-400">Connecté en tant que <span className="text-blue-400 font-medium">{role}</span></p>
        </header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Parc Immobilier - Visible pour tous les rôles connectés */}
          <Link href="/dashboard/properties" className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 hover:border-blue-500/30 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Building2 className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Parc Immobilier</h3>
            <p className="text-slate-400 text-sm mb-4">Gérez vos biens, consultez l'historique et lancez de nouveaux états des lieux.</p>
            <div className="text-blue-400 text-sm font-medium hover:underline flex items-center gap-1">
              Accéder <span>→</span>
            </div>
          </Link>

          {/* Gestion Locataires */}
          <Link href="/dashboard/tenants" className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 hover:border-emerald-500/30 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Locataires</h3>
            <p className="text-slate-400 text-sm mb-4">Gérez la base des locataires, suivez leur statut et leurs rattachements.</p>
            <div className="text-emerald-400 text-sm font-medium hover:underline flex items-center gap-1">
              Accéder <span>→</span>
            </div>
          </Link>

          {role === 'Administrateur' && (
            <Link href="/admin/users" className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 hover:border-purple-500/30 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <UserIcon className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">Administration</h3>
              <p className="text-slate-400 text-sm mb-4">Gestion des utilisateurs et agences.</p>
              <div className="text-purple-400 text-sm font-medium hover:underline flex items-center gap-1">
                Accéder <span>→</span>
              </div>
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
