'use client';

import React, { useState, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Trash2, 
  Key, 
  ShieldCheck, 
  ArrowLeft,
  Mail,
  Building,
  MoreVertical,
  Filter,
  Pencil
} from 'lucide-react';
import Link from 'next/link';
import { User, UserRole } from '@/types';
import { useUserStore } from '@/store/useUserStore';
import UserModal from '@/components/admin/UserModal';
import ConfirmationDialog from '@/components/admin/ConfirmationDialog';
import ResetPasswordModal from '@/components/admin/ResetPasswordModal';

export default function UserManagement() {
  const { users, addUser, updateUser, deleteUser } = useUserStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'All'>('All');
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [confirmAction, setConfirmAction] = useState<'delete' | 'reset' | null>(null);

  // Filtering
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'All' || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  // Actions
  const handleCreateOrUpdate = async (data: any) => {
    if (selectedUser) {
      await updateUser(selectedUser.id, data);
    } else {
      // Create
      const newUser: User = {
        id: `user_${Math.random().toString(36).substr(2, 9)}`,
        name: data.name!,
        email: data.email!,
        password: data.password || 'password123',
        role: data.role as UserRole,
        agencyId: data.agencyId || 'N/A'
      };
      await addUser(newUser);
    }
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleDelete = async () => {
    if (selectedUser) {
      await deleteUser(selectedUser.id);
      setIsConfirmOpen(false);
      setSelectedUser(null);
    }
  };

  const handleResetPassword = (newPassword: string) => {
    if (selectedUser) {
      updateUser(selectedUser.id, { password: newPassword } as any);
      console.log(`Password updated for ${selectedUser.email}: ${newPassword}`);
    }
  };

  const openConfirm = (user: User, action: 'delete' | 'reset') => {
    setSelectedUser(user);
    if (action === 'reset') {
      setIsResetModalOpen(true);
    } else {
      setConfirmAction(action);
      setIsConfirmOpen(true);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'Administrateur':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">Administrateur</span>;
      case 'Agent':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">Agent</span>;
      case 'Propriétaire':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Propriétaire</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400">Utilisateur</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-blue-500/30">
      {/* Header / Nav */}
      <nav className="border-b border-white/5 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard" 
              className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all border border-transparent hover:border-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight text-white hidden sm:block">VestaCheck <span className="text-blue-500">Admin</span></span>
            </div>
          </div>
          
          <button 
            onClick={() => { setSelectedUser(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-95 font-medium text-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Ajouter un utilisateur</span>
            <span className="sm:hidden">Ajouter</span>
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Title & Stats */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-500" />
            Gestion des Utilisateurs
          </h1>
          <p className="text-slate-400">Gérez les accès, les rôles et les paramètres de sécurité de la plateforme.</p>
        </div>

        {/* Filters bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 bg-slate-900/30 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Rechercher par nom ou email..."
              className="w-full bg-slate-900 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-4 items-center">
            <div className="relative group min-w-[180px]">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <select 
                className="w-full bg-slate-900 border border-white/5 rounded-xl py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
              >
                <option value="All">Tous les rôles</option>
                <option value="Administrateur">Administrateur</option>
                <option value="Agent">Agent</option>
                <option value="Propriétaire">Propriétaire</option>
              </select>
            </div>
            <div className="px-4 py-2.5 bg-slate-800 text-slate-400 rounded-xl text-sm font-medium border border-white/5">
              {filteredUsers.length} Utilisateurs
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/5">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Utilisateur</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">Rôle</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Agence</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                  <tr key={user.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center border border-white/5 text-blue-500 font-bold">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">{user.name}</p>
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                             <Mail className="w-3 h-3" />
                             {user.email}
                          </div>
                          <div className="md:hidden mt-1">{getRoleBadge(user.role)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <div className="flex items-center gap-2 text-sm text-slate-400 uppercase tracking-tight">
                        <Building className="w-4 h-4 text-slate-600" />
                        {user.agencyId || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => { setSelectedUser(user); setIsModalOpen(true); }}
                          className="p-2 rounded-lg text-slate-500 hover:text-blue-500 hover:bg-blue-500/10 transition-all border border-transparent hover:border-blue-500/20"
                          title="Modifier l'utilisateur"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => openConfirm(user, 'reset')}
                          className="p-2 rounded-lg text-slate-500 hover:text-amber-500 hover:bg-amber-500/10 transition-all border border-transparent hover:border-amber-500/20"
                          title="Réinitialiser le mot de passe"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => openConfirm(user, 'delete')}
                          className="p-2 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
                          title="Supprimer l'utilisateur"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                      Aucun utilisateur trouvé correspondant à vos critères.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modals */}
      {isModalOpen && (
        <UserModal 
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setSelectedUser(null); }}
          onSubmit={handleCreateOrUpdate}
          user={selectedUser || undefined}
        />
      )}

      {isConfirmOpen && selectedUser && (
        <ConfirmationDialog 
          isOpen={isConfirmOpen}
          title={confirmAction === 'delete' ? 'Supprimer l\'utilisateur' : 'Réinitialiser le mot de passe'}
          message={confirmAction === 'delete' 
            ? `Êtes-vous sûr de vouloir supprimer définitivement ${selectedUser.name} ? Cette action est irréversible.`
            : `Confirmez-vous l'envoi d'un email de réinitialisation à ${selectedUser.email} ?`
          }
          onClose={() => setIsConfirmOpen(false)}
          onConfirm={handleDelete}
          type="danger"
        />
      )}

      {isResetModalOpen && selectedUser && (
        <ResetPasswordModal 
          isOpen={isResetModalOpen}
          user={selectedUser}
          initialPassword={(selectedUser as any).password}
          onClose={() => { setIsResetModalOpen(false); setSelectedUser(null); }}
          onSubmit={handleResetPassword}
        />
      )}
    </div>
  );
}
