'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Save, Trash2, Home, MapPin, Maximize, Layers, User } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Property, User as UserType } from '@/types';
import { usePropertyStore } from '@/store/usePropertyStore';
import { useUserStore } from '@/store/useUserStore';
import { toast } from 'sonner';

const propertySchema = z.object({
  name: z.string().min(3, "Le nom doit faire au moins 3 caractères"),
  address: z.string().min(5, "L'adresse est requise"),
  surface: z.number().min(9, "La surface minimum est de 9 m²"),
  type: z.enum(['Appartement', 'Maison']),
  roomCount: z.number().min(1, "Au moins une pièce"),
  ownerId: z.string().min(1, "Propriétaire requis"),
  agentId: z.string().optional(),
});

type PropertyFormData = z.infer<typeof propertySchema>;

interface PropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  property?: Property; // If provided, we are in Edit mode
}

export function PropertyModal({ isOpen, onClose, property }: PropertyModalProps) {
  const { data: session } = useSession();
  const { addProperty, updateProperty, deleteProperty } = usePropertyStore();
  const { users } = useUserStore();
  
  const currentUser = session?.user as any;
  const isAdmin = currentUser?.role === 'Administrateur';
  const isAgent = currentUser?.role === 'Agent';

  const owners = users.filter(u => u.role === 'Propriétaire');
  const availableAgents = users.filter(u => u.role === 'Agent' || u.role === 'Administrateur');

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
      });
    }
  }, [property, reset, isOpen, isAgent, currentUser?.id]);

  const onSubmit = (data: PropertyFormData) => {
    if (property) {
      updateProperty(property.id, data);
      toast.success("Bien immobilier mis à jour !");
    } else {
      addProperty({
        ...data,
        id: `prop_${Date.now()}`,
        templateIds: [],
        agentId: data.agentId || (isAgent ? currentUser?.id : undefined),
        serverVersion: 1,
        lastModified: new Date().toISOString(),
        syncStatus: 'pending', // Marqué comme en attente de synchro initiale
      });
      toast.success("Nouveau bien immobilier ajouté !");
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-slate-900 border border-white/10 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Home className="w-5 h-5 text-blue-500" />
            {property ? 'Modifier le bien' : 'Ajouter un bien'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Nom du bien</label>
            <input 
              {...register('name')}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 transition-colors"
              placeholder="Ex: Appartement Haussmannien"
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Adresse complète</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
              <input 
                {...register('address')}
                className="w-full bg-slate-950 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:border-blue-500 transition-colors"
                placeholder="123 rue de la Paix, 75000 Paris"
              />
            </div>
            {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Type de bien</label>
              <select 
                {...register('type')}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 transition-colors"
              >
                <option value="Appartement">Appartement</option>
                <option value="Maison">Maison</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Propriétaire</label>
              <select 
                {...register('ownerId')}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 transition-colors cursor-pointer"
              >
                <option value="">Sélectionner...</option>
                {owners.map(owner => (
                  <option key={owner.id} value={owner.id}>{owner.name}</option>
                ))}
              </select>
              {errors.ownerId && <p className="text-red-400 text-xs mt-1 text-nowrap">{errors.ownerId.message}</p>}
            </div>

            {/* Agent Field */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Agent responsable</label>
              {isAdmin ? (
                <select 
                  {...register('agentId')}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 transition-colors cursor-pointer"
                >
                  <option value="">Non assigné</option>
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
              <label className="block text-sm font-medium text-slate-400 mb-1">Surface (m²)</label>
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
              <label className="block text-sm font-medium text-slate-400 mb-1">Nb. de pièces</label>
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
                  if (confirm('Supprimer ce bien ?')) {
                    deleteProperty(property.id);
                    toast.success("Le bien a été supprimé.");
                    onClose();
                  }
                }}
                className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl py-3 font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                Supprimer
              </button>
            )}
            <button 
              type="submit"
              className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {property ? 'Enregistrer' : 'Créer le bien'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
