'use client';

import React, { useState, useMemo } from 'react';
import { useTenantStore } from '@/store/useTenantStore';
import { useSearchParams } from 'next/navigation';
import { usePropertyStore } from '@/store/usePropertyStore';
import { useSession } from 'next-auth/react';
import { 
  Search, Plus, Filter, Users, User as UserIcon, Mail, Phone, Home, 
  ArrowUpDown, Pencil, Trash2, X, CheckCircle2, UserPlus, Building 
} from 'lucide-react';
import { Tenant } from '@/types';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';

// Composant Modale de Gestion (Création / Édition)
interface TenantModalProps {
  tenant?: Tenant;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Tenant>) => Promise<void>;
}

const TenantModal: React.FC<TenantModalProps> = ({ tenant, isOpen, onClose, onSubmit }) => {
  const { t } = useTranslation();
  const { properties } = usePropertyStore();
  const [formData, setFormData] = useState({
    name: tenant?.name || '',
    email: tenant?.email || '',
    phone: tenant?.phone || '',
    status: tenant?.status || 'Actuel',
    propertyIds: tenant?.propertyIds || []
  });

  if (!isOpen) return null;

  const toggleProperty = (id: string) => {
    setFormData(prev => ({
      ...prev,
      propertyIds: prev.propertyIds.includes(id)
        ? prev.propertyIds.filter(pid => pid !== id)
        : [...prev.propertyIds, id]
    }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 flex items-center justify-center text-blue-500">
              {tenant ? <Pencil size={24} /> : <UserPlus size={24} />}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {tenant ? t('tenants.modalEditTitle') : t('tenants.modalNewTitle')}
              </h2>
              <p className="text-sm text-slate-500">{t('tenants.modalSubtitle')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-slate-500 transition-all">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Infos de base */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t('tenants.fullNameLabel')}</label>
              <input 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder={t('tenants.fullNamePlaceholder')}
                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/50 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t('tenants.statusLabel')}</label>
              <select 
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value as any})}
                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/50 transition-all cursor-pointer appearance-none animate-none"
              >
                <option value="Actuel" className="bg-slate-900">{t('tenants.statusActiveOption')}</option>
                <option value="Sorti" className="bg-slate-900">{t('tenants.statusInactiveOption')}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t('tenants.emailLabel')}</label>
              <input 
                type="email"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                placeholder={t('tenants.emailPlaceholder')}
                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/50 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t('tenants.phoneLabel')}</label>
              <input 
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                placeholder={t('tenants.phonePlaceholder')}
                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/50 transition-all"
              />
            </div>
          </div>

          {/* Rattachements de biens */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex justify-between">
              {t('tenants.assignedPropertiesLabel')}
              <span className="text-blue-500">{t('tenants.selectedCountSuffix').replace('{count}', String((formData.propertyIds || []).length))}</span>
            </label>
            <div className="grid grid-cols-1 gap-2">
              {properties.map(prop => (
                <button
                  key={prop.id}
                  type="button"
                  onClick={() => toggleProperty(prop.id)}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all text-left ${
                    formData.propertyIds.includes(prop.id)
                      ? 'bg-blue-600/10 border-blue-500/50 text-white'
                      : 'bg-slate-950/30 border-white/5 text-slate-400 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Building size={16} className={formData.propertyIds.includes(prop.id) ? 'text-blue-400' : 'text-slate-600'} />
                    <span className="text-sm font-medium">{prop.address}</span>
                  </div>
                  {formData.propertyIds.includes(prop.id) && <CheckCircle2 size={16} className="text-blue-500" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-8 bg-slate-950/50 flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 py-4 rounded-xl font-bold text-slate-400 hover:bg-white/5 transition-all text-sm uppercase tracking-widest"
          >
            {t('tenants.cancelBtn')}
          </button>
          <button 
            onClick={() => onSubmit(formData)}
            className="flex-[2] py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-xl shadow-blue-600/20 text-sm uppercase tracking-widest active:scale-95"
          >
            {tenant ? t('tenants.submitEditBtn') : t('tenants.submitCreateBtn')}
          </button>
        </div>
      </div>
    </div>
  );
};

import { Suspense } from 'react';

function TenantsPageContent() {
  const { t } = useTranslation();
  const { tenants, loading, addTenant, updateTenant, deleteTenant, fetchTenants } = useTenantStore();
  const { properties, fetchProperties } = usePropertyStore();
  const { data: session } = useSession();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Actuel' | 'Sorti' | 'Tous'>('Actuel');
  
  React.useEffect(() => {
    fetchTenants();
    fetchProperties();
  }, [fetchTenants, fetchProperties]);

  const [sortBy, setSortBy] = useState<'name' | 'lastModified'>('name');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | undefined>();
  
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search');

  // Initialisation de la recherche via URL
  React.useEffect(() => {
    if (initialSearch) {
      setSearchQuery(initialSearch);
    }
  }, [initialSearch]);

  // 1. Filtrage de Sécurité & Recherche
  const filteredTenants = useMemo(() => {
    // Collecter les IDs des propriétés accessibles
    const userRole = (session?.user as any)?.role;
    const userId = (session?.user as any)?.id;

    let accessiblePropertyIds: string[] = [];
    
    if (userRole === 'Administrateur' || userRole === 'Agent') {
      // Pour Admin et Agent, tous les biens déjà chargés par le store sont accessibles
      accessiblePropertyIds = properties.map(p => p.id);
    } else if (userRole === 'Propriétaire') {
      accessiblePropertyIds = properties.filter(p => p.ownerId === userId).map(p => p.id);
    }

    return tenants
      .filter(t => {
        // Sécurité : au moins un bien rattaché accessible (ou Admin)
        const pIds = t.propertyIds || [];
        const isAccessible = userRole === 'Administrateur' || pIds.some(pid => accessiblePropertyIds.includes(pid));
        
        const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             t.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'Tous' || t.status === statusFilter;
        
        return isAccessible && matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
      });
  }, [tenants, properties, session, searchQuery, statusFilter, sortBy]);

  const handleCreateOrUpdate = async (data: Partial<Tenant>) => {
    try {
      if (selectedTenant) {
        await updateTenant(selectedTenant.id, data);
        toast.success(t('tenants.updateSuccess'));
      } else {
        const currentUser = session?.user as any;
        await addTenant({
          id: crypto.randomUUID(),
          name: data.name!,
          email: data.email!,
          phone: data.phone!,
          status: data.status as any,
          propertyIds: data.propertyIds || [],
          agencyId: currentUser?.agencyId,
          organizationId: currentUser?.organizationId
        });
        toast.success(t('tenants.createSuccess'));
      }
      setIsModalOpen(false);
      setSelectedTenant(undefined);
    } catch (err) {
      toast.error(t('tenants.errorGeneric'));
    }
  };

  const handleEdit = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(t('tenants.deleteConfirm').replace('{name}', name))) {
      await deleteTenant(id);
      toast.success(t('tenants.deleteSuccess'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <main className="max-w-7xl mx-auto px-4 py-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <Users className="text-blue-500" size={36} />
              {t('tenants.title')}
            </h1>
            <p className="text-slate-400">
              {t('tenants.subtitle')}
            </p>
          </div>
          
          <button 
            onClick={() => { setSelectedTenant(undefined); setIsModalOpen(true); }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-600/20"
          >
            <Plus size={20} />
            {t('tenants.newTenantBtn')}
          </button>
        </header>

        {/* Filters & Search */}
        <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 mb-8 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                placeholder={t('tenants.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-slate-600 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none transition-all"
              />
            </div>
            
            <div className="flex gap-4">
              <div className="flex items-center gap-2 bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2">
                <Filter size={16} className="text-slate-500" />
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-transparent text-sm text-slate-300 outline-none cursor-pointer"
                >
                  <option value="Tous" className="bg-slate-900">{t('tenants.statusFilterAll')}</option>
                  <option value="Actuel" className="bg-slate-900">{t('tenants.statusFilterActive')}</option>
                  <option value="Sorti" className="bg-slate-900">{t('tenants.statusFilterInactive')}</option>
                </select>
              </div>

              <button 
                onClick={() => setSortBy(sortBy === 'name' ? 'lastModified' : 'name')}
                className="flex items-center gap-2 bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2 hover:bg-white/5 transition-colors"
                title={t('tenants.sortBy')}
              >
                <ArrowUpDown size={16} className="text-slate-500" />
                <span className="text-sm text-slate-300">{sortBy === 'name' ? t('tenants.sortByName') : t('tenants.sortByDate')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTenants.length > 0 ? (
            filteredTenants.map((tenant) => (
              <div 
                key={tenant.id}
                className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 hover:border-blue-500/30 transition-all group relative"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <UserIcon className="w-6 h-6 text-blue-500" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      tenant.status === 'Actuel' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-slate-800 text-slate-400 border border-white/5'
                    }`}>
                      {tenant.status === 'Actuel' ? t('tenants.statusActive') : t('tenants.statusInactive')}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEdit(tenant)}
                        className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition-all shadow-lg shadow-blue-500/10"
                        title={t('tenants.editTooltip')}
                      >
                        <Pencil size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(tenant.id, tenant.name)}
                        className="p-1.5 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/10"
                        title={t('tenants.deleteTooltip')}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-4 group-hover:text-blue-400 transition-colors">
                  {tenant.name}
                </h3>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Mail size={14} className="text-slate-500" />
                    <span className="truncate">{tenant.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Phone size={14} className="text-slate-500" />
                    <span>{tenant.phone}</span>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-4 mt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Home size={14} className="text-slate-500" />
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{t('tenants.linkedPropertiesTitle')}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(tenant.propertyIds || []).map(propId => {
                      const prop = properties.find(p => p.id === propId);
                      return (
                        <span 
                          key={propId} 
                          className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] text-slate-300"
                          title={prop?.address || 'Adresse inconnue'}
                        >
                          {prop?.address ? prop.address.split(',')[0] : 'Propriété...'}
                        </span>
                      );
                    })}
                    {(!tenant.propertyIds || tenant.propertyIds.length === 0) && (
                      <span className="text-xs italic text-slate-600">{t('tenants.noLinkedProperties')}</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center bg-slate-900/20 border border-dashed border-white/10 rounded-3xl">
              <Users className="mx-auto text-slate-700 mb-4" size={48} />
              <h3 className="text-xl font-semibold text-white mb-2">{t('tenants.emptyStateTitle')}</h3>
              <p className="text-slate-500">{t('tenants.emptyStateDesc')}</p>
            </div>
          )}
        </div>
      </main>

      {/* MODAL UNIFIÉE */}
      {isModalOpen && (
        <TenantModal 
          isOpen={isModalOpen}
          tenant={selectedTenant}
          onClose={() => { setIsModalOpen(false); setSelectedTenant(undefined); }}
          onSubmit={handleCreateOrUpdate}
        />
      )}
    </div>
  );
}

export default function TenantsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>}>
      <TenantsPageContent />
    </Suspense>
  );
}
