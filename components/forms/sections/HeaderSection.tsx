import React from 'react';
import { useFormContext } from 'react-hook-form';
import { InspectionFormData } from '@/lib/validations/inspection';
import { Home } from 'lucide-react';

export const HeaderSection: React.FC = () => {
  const { register, formState: { errors } } = useFormContext<InspectionFormData>();

  return (
    <div className="bg-slate-900/50 p-8 rounded-2xl shadow-xl border border-white/5 mb-8 backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-blue-500/10 p-2 rounded-lg">
          <Home className="text-blue-400" size={24} />
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Informations Générales
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
            Adresse de la propriété
          </label>
          <input
            {...register('propertyAddress')}
            className={`w-full bg-slate-950/50 border rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all ${
              errors.propertyAddress ? 'border-red-500/50 bg-red-500/5' : 'border-white/10 focus:border-blue-500/50'
            }`}
            placeholder="Ex: 123 Rue de Rivoli, Paris"
          />
          {errors.propertyAddress && (
            <p className="text-red-400 text-xs mt-1 ml-1 font-medium">{errors.propertyAddress.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
            Nom du locataire
          </label>
          <input
            {...register('tenantName')}
            className={`w-full bg-slate-950/50 border rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all ${
              errors.tenantName ? 'border-red-500/50 bg-red-500/5' : 'border-white/10 focus:border-blue-500/50'
            }`}
            placeholder="Nom Complet"
          />
          {errors.tenantName && (
            <p className="text-red-400 text-xs mt-1 ml-1 font-medium">{errors.tenantName.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
            Email du locataire
          </label>
          <input
            {...register('tenantEmail')}
            className={`w-full bg-slate-950/50 border rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all ${
              errors.tenantEmail ? 'border-red-500/50 bg-red-500/5' : 'border-white/10 focus:border-blue-500/50'
            }`}
            placeholder="email@exemple.com"
          />
          {errors.tenantEmail && (
            <p className="text-red-400 text-xs mt-1 ml-1 font-medium">{errors.tenantEmail.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
            Téléphone du locataire
          </label>
          <input
            {...register('tenantPhone')}
            className={`w-full bg-slate-950/50 border rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all ${
              errors.tenantPhone ? 'border-red-500/50 bg-red-500/5' : 'border-white/10 focus:border-blue-500/50'
            }`}
            placeholder="06 00 00 00 00"
          />
          {errors.tenantPhone && (
            <p className="text-red-400 text-xs mt-1 ml-1 font-medium">{errors.tenantPhone.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
            Type d'état des lieux
          </label>
          <select
            {...register('type')}
            className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
          >
            <option value="Entrée" className="bg-slate-900 text-white">Entrée</option>
            <option value="Sortie" className="bg-slate-900 text-white">Sortie</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
            Date de l'inspection
          </label>
          <input
            type="date"
            {...register('date')}
            className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
