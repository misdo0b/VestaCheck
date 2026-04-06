'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, UserPlus, Save, Mail, User as UserIcon, Building } from 'lucide-react';
import { User, UserRole } from '@/types';

const userSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères').optional().or(z.literal('')),
  role: z.enum(['Administrateur', 'Agent', 'Propriétaire']),
  agencyId: z.string().optional(),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UserFormData) => void;
  user?: User; // If provided, it's an edit mode
}

export default function UserModal({ isOpen, onClose, onSubmit, user }: UserModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      role: user?.role || 'Agent',
      agencyId: user?.agencyId || '',
    },
  });

  if (!isOpen) return null;

  const handleFormSubmit = (data: UserFormData) => {
    onSubmit(data);
    reset(); // Reset form after successful submit
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl shadow-blue-500/10 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              {user ? <Save className="w-5 h-5 text-blue-500" /> : <UserPlus className="w-5 h-5 text-blue-500" />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white leading-none mb-1">
                {user ? 'Modifier l\'utilisateur' : 'Nouvel Utilisateur'}
              </h2>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-tight">VestaCheck Administration</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/5 text-slate-500 hover:text-white transition-all border border-transparent hover:border-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-5">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Nom complet</label>
            <div className="relative group">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                {...register('name')}
                placeholder="Ex: Jean Martin"
                className={`w-full bg-slate-950 border ${errors.name ? 'border-red-500/50' : 'border-white/5'} rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 ${errors.name ? 'focus:ring-red-500/20' : 'focus:ring-blue-500/20'} transition-all`}
              />
            </div>
            {errors.name && <p className="text-xs text-red-500 mt-1 ml-1">{errors.name.message}</p>}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Adresse Email</label>
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                {...register('email')}
                type="email"
                placeholder="jean.martin@exemple.com"
                className={`w-full bg-slate-950 border ${errors.email ? 'border-red-500/50' : 'border-white/5'} rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 ${errors.email ? 'focus:ring-red-500/20' : 'focus:ring-blue-500/20'} transition-all`}
              />
            </div>
            {errors.email && <p className="text-xs text-red-500 mt-1 ml-1">{errors.email.message}</p>}
          </div>

          {/* Password (for new users) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
              {user ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe initial'}
            </label>
            <div className="relative group">
              <Save className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                {...register('password')}
                type="password"
                placeholder="••••••••"
                className={`w-full bg-slate-950 border ${errors.password ? 'border-red-500/50' : 'border-white/5'} rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 ${errors.password ? 'focus:ring-red-500/20' : 'focus:ring-blue-500/20'} transition-all`}
              />
            </div>
            {errors.password && <p className="text-xs text-red-500 mt-1 ml-1">{errors.password.message}</p>}
          </div>

          {/* Role & Agency Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Rôle</label>
              <select 
                {...register('role')}
                className="w-full bg-slate-950 border border-white/5 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer"
              >
                <option value="Agent">Agent</option>
                <option value="Administrateur">Administrateur</option>
                <option value="Propriétaire">Propriétaire</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Agence (ID)</label>
              <div className="relative group">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  {...register('agencyId')}
                  placeholder="ID Agence"
                  className="w-full bg-slate-950 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-sm font-medium transition-all"
            >
              Annuler
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-[2] px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {user ? <Save className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  {user ? 'Enregistrer les modifications' : 'Créer l\'utilisateur'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
