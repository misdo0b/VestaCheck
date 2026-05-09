'use client';

import React, { useState } from 'react';
import { useOrganizationStore } from '@/store/useOrganizationStore';
import { 
  Building, Plus, Search, Pencil, Trash2, X, 
  CheckCircle2, Globe, Shield, CreditCard, MapPin 
} from 'lucide-react';
import { Organization } from '@/types';
import { toast } from 'sonner';

export default function OrganizationsPage() {
  const { organizations, addOrganization, updateOrganization } = useOrganizationStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

  const [formData, setFormData] = useState<Partial<Organization>>({
    raisonSociale: '',
    siret: '',
    adressePostale: ''
  });

  const filteredOrgs = organizations.filter(o => 
    o.raisonSociale.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.siret.includes(searchQuery)
  );

  const handleOpenModal = (org?: Organization) => {
    if (org) {
      setSelectedOrg(org);
      setFormData(org);
    } else {
      setSelectedOrg(null);
      setFormData({ raisonSociale: '', siret: '', adressePostale: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedOrg) {
        await updateOrganization(selectedOrg.id, formData);
        toast.success("Organisation mise à jour");
      } else {
        const newId = crypto.randomUUID();
        await addOrganization({
          ...formData as any,
          id: newId
        });
        toast.success("Organisation créée");
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error("Une erreur est survenue");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pt-20">
      <main className="max-w-7xl mx-auto px-4 py-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <Globe className="text-purple-500" size={36} />
              Organisations
            </h1>
            <p className="text-slate-400">
              Gérez les entités juridiques parentes et leurs informations légales.
            </p>
          </div>
          
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-purple-600/20"
          >
            <Plus size={20} />
            Nouvelle Organisation
          </button>
        </header>

        <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 mb-8 backdrop-blur-sm">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Rechercher par raison sociale ou SIRET..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-slate-600 focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500/50 outline-none transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrgs.map((org) => (
            <div 
              key={org.id}
              className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 hover:border-purple-500/30 transition-all group relative"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Shield className="w-6 h-6 text-purple-500" />
                </div>
                <button 
                  onClick={() => handleOpenModal(org)}
                  className="p-2 bg-white/5 text-slate-400 rounded-lg hover:bg-purple-500 hover:text-white transition-all"
                >
                  <Pencil size={16} />
                </button>
              </div>

              <h3 className="text-xl font-bold text-white mb-1">{org.raisonSociale}</h3>
              <p className="text-[10px] text-purple-400 font-black uppercase tracking-widest mb-4">ID: {org.id}</p>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <CreditCard size={14} className="text-slate-600" />
                  <span>SIRET: {org.siret}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <MapPin size={14} className="text-slate-600" />
                  <span className="truncate">{org.adressePostale}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
          <form 
            onSubmit={handleSubmit}
            className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
          >
            <div className="p-8 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">{selectedOrg ? 'Modifier' : 'Créer'} l'Organisation</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Raison Sociale</label>
                <input 
                  required
                  value={formData.raisonSociale}
                  onChange={e => setFormData({...formData, raisonSociale: e.target.value})}
                  className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500/50 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">SIRET</label>
                <input 
                  required
                  value={formData.siret}
                  onChange={e => setFormData({...formData, siret: e.target.value})}
                  className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500/50 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Adresse Postale</label>
                <textarea 
                  required
                  value={formData.adressePostale}
                  onChange={e => setFormData({...formData, adressePostale: e.target.value})}
                  className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500/50 transition-all h-24 resize-none"
                />
              </div>
            </div>

            <div className="p-8 bg-slate-950/50 flex gap-4">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-4 text-slate-400 font-bold uppercase tracking-widest text-xs hover:bg-white/5 rounded-xl transition-all"
              >
                Annuler
              </button>
              <button 
                type="submit"
                className="flex-[2] py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold uppercase tracking-widest text-xs rounded-xl transition-all shadow-lg shadow-purple-600/20"
              >
                {selectedOrg ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
