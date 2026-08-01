'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useAgencyStore } from '@/store/useAgencyStore';
import { useUserStore } from '@/store/useUserStore';
import { useOrganizationStore } from '@/store/useOrganizationStore';
import { Agency } from '@/types';
import { 
  Building2, 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  MapPin, 
  Edit2, 
  Trash2, 
  X,
  LayoutGrid,
  List
} from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from '@/hooks/useTranslation';

type AgencyFormData = {
  name: string;
  email: string;
  phone: string;
  address: string;
  type: 'Siège' | 'Établissement';
  organizationId: string;
};

export default function AgenciesPage() {
  const { t } = useTranslation();
  const { data: session, status } = useSession();
  const router = useRouter();
  const { agencies, loading, initStore, addAgency, updateAgency, deleteAgency } = useAgencyStore();
  const { organizations, initStore: initOrgs } = useOrganizationStore();
  const { users } = useUserStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const currentUser = session?.user as any;
  const isAdmin = currentUser?.role === 'Administrateur';

  // Dynamic Zod Schema for translation support
  const agencySchema = useMemo(() => z.object({
    name: z.string().min(3, t('adminAgencies.validationNameMin')),
    email: z.string().email(t('adminAgencies.validationEmailInvalid')),
    phone: z.string().min(10, t('adminAgencies.validationPhoneRequired')),
    address: z.string().min(5, t('adminAgencies.validationAddressRequired')),
    type: z.enum(['Siège', 'Établissement']),
    organizationId: z.string().min(1, t('adminAgencies.validationOrgRequired'))
  }), [t]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AgencyFormData>({
    resolver: zodResolver(agencySchema),
    defaultValues: {
      type: 'Établissement',
      organizationId: currentUser?.organizationId || ''
    }
  });

  useEffect(() => {
    if (status === 'unauthenticated' || (status === 'authenticated' && !isAdmin)) {
      router.push('/dashboard');
    }
  }, [status, isAdmin, router]);

  useEffect(() => {
    if (currentUser) {
      initStore(currentUser);
      initOrgs(currentUser);
    }
  }, [initStore, initOrgs, currentUser]);

  const filteredAgencies = useMemo(() => {
    return agencies.filter(a => 
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [agencies, searchQuery]);

  const onSubmit = async (data: AgencyFormData) => {
    try {
      if (editingAgency) {
        await updateAgency(editingAgency.id, data);
        toast.success(t('adminAgencies.updateSuccess'));
      } else {
        await addAgency({
          ...data,
          id: crypto.randomUUID()
        });
        toast.success(t('adminAgencies.createSuccess'));
      }
      setIsModalOpen(false);
      setEditingAgency(null);
      reset();
    } catch (error) {
      toast.error(t('adminAgencies.errorGeneric'));
    }
  };

  const handleEdit = (agency: Agency) => {
    setEditingAgency(agency);
    reset(agency);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('adminAgencies.deleteConfirm'))) {
      await deleteAgency(id);
      toast.success(t('adminAgencies.deleteSuccess'));
    }
  };

  if (status === 'loading' || !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="animate-in fade-in slide-in-from-left duration-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-blue-600/20 rounded-2xl border border-blue-600/30">
                <Building2 className="w-8 h-8 text-blue-500" />
              </div>
              <h1 className="text-4xl font-extrabold text-white tracking-tight">{t('adminAgencies.title')}</h1>
            </div>
            <p className="text-slate-400 ml-1">{t('adminAgencies.subtitle')}</p>
          </div>
          
          <button 
            onClick={() => {
              setEditingAgency(null);
              reset({
                type: 'Établissement',
                organizationId: currentUser?.organizationId || ''
              });
              setIsModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-2xl shadow-blue-600/30 active:scale-95 group"
          >
            <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
            {t('adminAgencies.newAgencyBtn')}
          </button>
        </div>

        {/* Toolbar Section */}
        <div className="bg-slate-900/40 border border-white/5 rounded-[32px] p-4 mb-8 backdrop-blur-2xl shadow-2xl flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input 
              type="text"
              placeholder={t('adminAgencies.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/50 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-white focus:border-blue-500/50 focus:bg-slate-900 outline-none transition-all placeholder:text-slate-600"
            />
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
             <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-white/10 shadow-inner">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-2.5 rounded-xl transition-all ${
                    viewMode === 'grid' 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <LayoutGrid size={20} />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-2.5 rounded-xl transition-all ${
                    viewMode === 'list' 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <List size={20} />
                </button>
              </div>
          </div>
        </div>

        {/* Agencies Grid/List */}
        {filteredAgencies.length > 0 ? (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-700"
            : "flex flex-col gap-4 animate-in fade-in duration-700"
          }>
            {filteredAgencies.map((agency) => (
              <div 
                key={agency.id}
                className={`group relative overflow-hidden bg-slate-900/40 border border-white/5 rounded-[32px] backdrop-blur-xl transition-all hover:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-600/5 p-6 ${
                  viewMode === 'list' ? 'flex items-center justify-between' : ''
                }`}
              >
                <div className={viewMode === 'list' ? 'flex items-center gap-6 flex-1' : ''}>
                  <div className={`p-4 rounded-2xl mb-4 bg-slate-950 border border-white/5 group-hover:scale-110 transition-transform duration-500 ${
                    viewMode === 'list' ? 'mb-0' : 'w-16 h-16 flex items-center justify-center'
                  }`}>
                    <Building2 className={`w-8 h-8 ${agency.type === 'Siège' ? 'text-emerald-500' : 'text-blue-500'}`} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{agency.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        agency.type === 'Siège' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                      }`}>
                        {agency.type === 'Siège' ? t('adminAgencies.typeHeadquarters') : t('adminAgencies.typeBranch')}
                      </span>
                    </div>
                    
                    <div className={viewMode === 'list' ? 'flex items-center gap-6 mt-1' : 'space-y-2 mt-4'}>
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Mail size={14} className="text-slate-600" />
                        <span>{agency.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Phone size={14} className="text-slate-600" />
                        <span>{agency.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <MapPin size={14} className="text-slate-600" />
                        <span className="truncate max-w-[200px]">{agency.address}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`flex gap-2 ${viewMode === 'list' ? '' : 'mt-8 pt-6 border-t border-white/5'}`}>
                  <button 
                    onClick={() => handleEdit(agency)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 py-3 rounded-2xl transition-all flex items-center justify-center gap-2 font-medium"
                  >
                    <Edit2 size={16} />
                    {t('adminAgencies.editTooltip')}
                  </button>
                  <button 
                    onClick={() => handleDelete(agency.id)}
                    className="p-3 bg-red-500/5 hover:bg-red-500/10 text-red-500/70 hover:text-red-500 rounded-2xl transition-all border border-red-500/10"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-slate-900/20 border border-dashed border-white/10 rounded-[48px] backdrop-blur-sm animate-pulse">
            <Building2 className="w-16 h-16 text-slate-800 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-white mb-2">{t('adminAgencies.emptyStateTitle')}</h3>
            <p className="text-slate-500">{t('adminAgencies.emptyStateDesc')}</p>
          </div>
        )}
      </div>

      {/* Modal Glassmorphism */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
          
          <div className="relative bg-slate-900 border border-white/10 rounded-[40px] w-full max-w-xl overflow-hidden shadow-2xl shadow-blue-600/10 animate-in zoom-in-95 duration-500">
            <div className="flex items-center justify-between p-8 border-b border-white/5">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-blue-600/10 rounded-xl">
                  <Building2 size={24} className="text-blue-500" />
                </div>
                {editingAgency ? t('adminAgencies.modalEditTitle') : t('adminAgencies.modalNewTitle')}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white/5 rounded-2xl text-slate-400 transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">{t('adminAgencies.nameLabel')}</label>
                  <input 
                    {...register('name')}
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-blue-500 outline-none transition-all"
                    placeholder={t('adminAgencies.namePlaceholder')}
                  />
                  {errors.name && <p className="text-red-400 text-xs mt-2 ml-1">{errors.name.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">{t('adminAgencies.typeLabel')}</label>
                    <select 
                      {...register('type')}
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="Établissement">{t('adminAgencies.typeBranch')}</option>
                      <option value="Siège">{t('adminAgencies.typeHeadquarters')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">{t('adminAgencies.orgLabel')}</label>
                    <select 
                      {...register('organizationId')}
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="">{t('adminAgencies.orgPlaceholder')}</option>
                      {organizations.map(org => (
                        <option key={org.id} value={org.id}>{org.raisonSociale}</option>
                      ))}
                    </select>
                    {errors.organizationId && <p className="text-red-400 text-xs mt-2 ml-1">{errors.organizationId.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">{t('adminAgencies.emailLabel')}</label>
                  <input 
                    {...register('email')}
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-blue-500 outline-none transition-all"
                    placeholder={t('adminAgencies.emailPlaceholder')}
                  />
                  {errors.email && <p className="text-red-400 text-xs mt-2 ml-1">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">{t('adminAgencies.addressLabel')}</label>
                  <textarea 
                    {...register('address')}
                    rows={3}
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-blue-500 outline-none transition-all resize-none"
                    placeholder={t('adminAgencies.addressPlaceholder')}
                  />
                  {errors.address && <p className="text-red-400 text-xs mt-2 ml-1">{errors.address.message}</p>}
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button 
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-4 font-bold transition-all shadow-xl shadow-blue-600/20 active:scale-95"
                >
                  {editingAgency ? t('adminAgencies.submitEditBtn') : t('adminAgencies.submitCreateBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
