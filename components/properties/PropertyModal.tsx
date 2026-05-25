'use client';

import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Save, Trash2, Home, MapPin, Maximize, Layers, User } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Property } from '@/types';
import { usePropertyStore } from '@/store/usePropertyStore';
import { useUserStore } from '@/store/useUserStore';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';

type PropertyFormData = {
  name: string;
  address: string;
  surface: number;
  type: 'Appartement' | 'Maison';
  roomCount: number;
  ownerId: string;
  agentId?: string;
  agencyId: string;
  organizationId: string;
};

interface PropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  property?: Property; // If provided, we are in Edit mode
}

export function PropertyModal({ isOpen, onClose, property }: PropertyModalProps) {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const { addProperty, updateProperty, deleteProperty } = usePropertyStore();
  const { users } = useUserStore();
  
  const currentUser = session?.user as any;
  const isAdmin = currentUser?.role === 'Administrateur';
  const isAgent = currentUser?.role === 'Agent';

  const owners = users.filter(u => u.role === 'Propriétaire' || u.role === 'Administrateur');
  const availableAgents = users.filter(u => u.role === 'Agent' || u.role === 'Administrateur');

  // Dynamic Zod Schema for translation support
  const propertySchema = useMemo(() => z.object({
    name: z.string().min(3, t('properties.validationNameMin')),
    address: z.string().min(5, t('properties.validationAddressRequired')),
    surface: z.number().min(9, t('properties.validationSurfaceMin')),
    type: z.enum(['Appartement', 'Maison']),
    roomCount: z.number().min(1, t('properties.validationRoomsMin')),
    ownerId: z.string().min(1, t('properties.validationOwnerRequired')),
    agentId: z.string().optional(),
    agencyId: z.string().min(1, t('properties.validationAgencyRequired')),
    organizationId: z.string().min(1, t('properties.validationOrgRequired')),
  }), [t]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: property || {
      name: '',
      address: '',
      surface: 0,
      type: 'Appartement',
      roomCount: 1,
      ownerId: '',
      agentId: isAgent ? currentUser.id : '',
      agencyId: currentUser?.agencyId || '',
      organizationId: currentUser?.organizationId || '',
    }
  });

  useEffect(() => {
    if (property) {
      reset(property);
    } else {
      reset({
        name: '',
        address: '',
        surface: 0,
        type: 'Appartement',
        roomCount: 1,
        ownerId: '',
        agentId: isAgent ? currentUser?.id : '',
        agencyId: currentUser?.agencyId || '',
        organizationId: currentUser?.organizationId || '',
      });
    }
  }, [property, reset, isOpen, isAgent, currentUser?.id, currentUser?.agencyId, currentUser?.organizationId]);

  const onSubmit = (data: PropertyFormData) => {
    if (property) {
      updateProperty(property.id, data);
      toast.success(t('properties.updateSuccess'));
    } else {
      addProperty({
        ...data,
        id: crypto.randomUUID(),
        templateIds: [],
        agentId: data.agentId || (isAgent ? currentUser?.id : undefined),
        agencyId: data.agencyId || currentUser?.agencyId,
        organizationId: data.organizationId || currentUser?.organizationId,
        serverVersion: 1,
        lastModified: new Date().toISOString(),
        syncStatus: 'pending', 
      });
      toast.success(t('properties.createSuccess'));
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-slate-900 border border-white/10 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Home className="w-5 h-5 text-blue-500" />
            {property ? t('properties.modalEditTitle') : t('properties.modalNewTitle')}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">{t('properties.nameLabel')}</label>
            <input 
              {...register('name')}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 transition-colors"
              placeholder={t('properties.namePlaceholder')}
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">{t('properties.addressLabel')}</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
              <input 
                {...register('address')}
                className="w-full bg-slate-950 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:border-blue-500 transition-colors"
                placeholder={t('properties.addressPlaceholder')}
              />
            </div>
            {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">{t('properties.typeLabel')}</label>
              <select 
                {...register('type')}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 transition-colors cursor-pointer"
              >
                <option value="Appartement">{t('properties.typeAppartement')}</option>
                <option value="Maison">{t('properties.typeMaison')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">{t('properties.ownerLabel')}</label>
              <select 
                {...register('ownerId')}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 transition-colors cursor-pointer"
              >
                <option value="">{t('properties.ownerPlaceholder')}</option>
                {owners.map(owner => (
                  <option key={owner.id} value={owner.id}>{owner.name}</option>
                ))}
              </select>
              {errors.ownerId && <p className="text-red-400 text-xs mt-1 text-nowrap">{errors.ownerId.message}</p>}
            </div>

            {/* Agent Field */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">{t('properties.agentLabel')}</label>
              {isAdmin ? (
                <select 
                  {...register('agentId')}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 transition-colors cursor-pointer"
                >
                  <option value="">{t('properties.agentUnassigned')}</option>
                  {availableAgents.map(agent => (
                    <option key={agent.id} value={agent.id}>{agent.name}</option>
                  ))}
                </select>
              ) : (
                <div className="relative group">
                  <User className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
                  <input 
                    type="text"
                    disabled
                    value={currentUser?.name || ''}
                    className="w-full bg-slate-950/50 border border-white/5 rounded-xl pl-12 pr-4 py-3 text-sm text-slate-500 cursor-not-allowed"
                  />
                  <input type="hidden" {...register('agentId')} />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">{t('properties.surfaceLabel')}</label>
              <div className="relative">
                <Maximize className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                <input 
                  type="number"
                  {...register('surface', { valueAsNumber: true })}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:border-blue-500 transition-colors"
                />
              </div>
              {errors.surface && <p className="text-red-400 text-xs mt-1">{errors.surface.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">{t('properties.roomsLabel')}</label>
              <div className="relative">
                <Layers className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                <input 
                  type="number"
                  {...register('roomCount', { valueAsNumber: true })}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:border-blue-500 transition-colors"
                />
              </div>
              {errors.roomCount && <p className="text-red-400 text-xs mt-1">{errors.roomCount.message}</p>}
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            {property && (
              <button 
                type="button"
                onClick={() => {
                  if (confirm(t('properties.deleteConfirm'))) {
                    deleteProperty(property.id);
                    toast.success(t('properties.deleteSuccess'));
                    onClose();
                  }
                }}
                className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl py-3 font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                {t('properties.deleteBtn')}
              </button>
            )}
            <button 
              type="submit"
              className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 font-semibold transition-colors flex items-center justify-center gap-2 active:scale-95"
            >
              <Save className="w-5 h-5" />
              {property ? t('properties.saveBtn') : t('properties.submitCreateBtn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
