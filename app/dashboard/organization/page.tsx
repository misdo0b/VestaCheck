'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useOrganizationStore } from '@/store/useOrganizationStore';
import { useUserStore } from '@/store/useUserStore';
import { useAgencyStore } from '@/store/useAgencyStore';
import { Building, Save, ShieldCheck, MapPin, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

export default function OrganizationPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const isAdmin = user?.role === 'Administrateur';

  const { users } = useUserStore();
  const { agencies } = useAgencyStore();
  const { organizations, updateOrganization } = useOrganizationStore();
  
  const [formData, setFormData] = useState({
    raisonSociale: '',
    siret: '',
    adressePostale: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentOrg, setCurrentOrg] = useState<any>(null);

  // Retrieve full user from store to get agencyId or organizationId
  const currentUser = users.find(u => u.id === user?.id);
  let resolvedOrgId = currentUser?.organizationId;
  
  if (!resolvedOrgId && currentUser?.agencyId) {
    const userAgency = agencies.find(a => a.id === currentUser.agencyId);
    resolvedOrgId = userAgency?.organizationId;
  }

  useEffect(() => {
    if (resolvedOrgId) {
      const org = organizations.find(o => o.id === resolvedOrgId);
      if (org) {
        setCurrentOrg(org);
        setFormData({
          raisonSociale: org.raisonSociale,
          siret: org.siret,
          adressePostale: org.adressePostale
        });
      }
    }
  }, [resolvedOrgId, organizations]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !currentOrg) return;

    setIsSubmitting(true);
    try {
      await updateOrganization(currentOrg.id, {
        raisonSociale: formData.raisonSociale,
        siret: formData.siret,
        adressePostale: formData.adressePostale
      });
      toast.success("Organisation mise à jour avec succès");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la mise à jour de l'organisation");
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
            <Building className="text-purple-500 w-10 h-10" />
            Mon Organisation
          </h1>
          <p className="text-slate-400">
            {isAdmin 
              ? "Gérez les informations légales de votre entité de rattachement." 
              : "Consultez les informations légales de votre entité de rattachement."}
          </p>
        </header>

        {!resolvedOrgId ? (
          <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 text-center backdrop-blur-sm">
            <ShieldCheck className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Aucune organisation</h2>
            <p className="text-slate-400">Vous n'êtes actuellement rattaché(e) à aucune organisation.</p>
          </div>
        ) : !currentOrg ? (
          <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 text-center backdrop-blur-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
            <p className="text-slate-400 mt-4">Chargement des données...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-sm space-y-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <Building size={14} /> Raison Sociale
              </label>
              <input 
                required
                readOnly={!isAdmin}
                value={formData.raisonSociale}
                onChange={e => setFormData({...formData, raisonSociale: e.target.value})}
                className={`w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none transition-all ${
                  isAdmin ? 'focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10' : 'opacity-70 cursor-not-allowed'
                }`}
              />
            </div>
            
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <CreditCard size={14} /> SIRET
              </label>
              <input 
                required
                readOnly={!isAdmin}
                value={formData.siret}
                onChange={e => setFormData({...formData, siret: e.target.value})}
                className={`w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none transition-all ${
                  isAdmin ? 'focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10' : 'opacity-70 cursor-not-allowed'
                }`}
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <MapPin size={14} /> Adresse Postale
              </label>
              <textarea 
                required
                readOnly={!isAdmin}
                value={formData.adressePostale}
                onChange={e => setFormData({...formData, adressePostale: e.target.value})}
                className={`w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none h-24 resize-none transition-all ${
                  isAdmin ? 'focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10' : 'opacity-70 cursor-not-allowed'
                }`}
              />
            </div>

            {isAdmin && (
              <div className="pt-6 flex justify-end">
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-600/20 active:scale-95 disabled:opacity-50"
                >
                  <Save size={18} />
                  {isSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </button>
              </div>
            )}
          </form>
        )}
      </main>
    </div>
  );
}
