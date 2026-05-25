'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useUserStore } from '@/store/useUserStore';
import { Settings, Save, User as UserIcon, Mail, Key } from 'lucide-react';
import { toast } from 'sonner';
import PreferencesForm from '@/components/settings/PreferencesForm';

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const { updateUser } = useUserStore();
  const user = session?.user as any;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: ''
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setIsSubmitting(true);
    try {
      const updates: any = {
        name: formData.name,
        email: formData.email
      };

      if (formData.password) {
        updates.password = formData.password;
      }

      await updateUser(user.id, updates);
      
      // Update local session to reflect name/email changes in UI
      await updateSession({
        ...session,
        user: {
          ...session?.user,
          name: formData.name,
          email: formData.email
        }
      });

      toast.success("Paramètres mis à jour avec succès");
      
      // Reset password field after save
      setFormData(prev => ({ ...prev, password: '' }));
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pt-16">
      <main className="max-w-3xl mx-auto px-4 py-12">
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Settings className="text-blue-500 w-10 h-10" />
            Paramètres du Profil
          </h1>
          <p className="text-slate-400">Gérez vos informations personnelles et vos paramètres de connexion.</p>
        </header>

        <form onSubmit={handleSubmit} className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-sm space-y-6">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <UserIcon size={14} /> Nom complet
            </label>
            <input 
              required
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all"
            />
          </div>
          
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <Mail size={14} /> Adresse Email
            </label>
            <input 
              type="email"
              required
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all"
            />
          </div>

          <div className="space-y-2 pt-4 border-t border-white/5">
            <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <Key size={14} /> Nouveau mot de passe (optionnel)
            </label>
            <input 
              type="password"
              placeholder="Laisser vide pour ne pas modifier"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all"
            />
          </div>

          <div className="pt-6 flex justify-end">
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50"
            >
              <Save size={18} />
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </form>

        <div className="mt-8">
          <PreferencesForm />
        </div>
      </main>
    </div>
  );
}
