import React, { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { InspectionFormData } from '@/lib/validations/inspection';
import { Home, User, Mail, Phone, Plus, Search, UserPlus, CheckCircle2, UserCheck, AlertCircle } from 'lucide-react';
import { useTenantStore } from '@/store/useTenantStore';
import { toast } from 'sonner';

export const HeaderSection: React.FC = () => {
  const { register, watch, setValue, formState: { errors }, resetField } = useFormContext<InspectionFormData>();
  const { tenants } = useTenantStore();
  
  const selectedPropertyId = watch('propertyId');
  const selectedTenantId = watch('tenantId');
  const type = watch('type');
  const manualTenant = watch('manualTenant');
  
  const [isManualMode, setIsManualMode] = useState(false);

  // Force le mode sélection si c'est une sortie
  useEffect(() => {
    if (type === 'Sortie') {
      setIsManualMode(false);
      resetField('manualTenant');
    }
  }, [type, resetField]);

  // Filtrer les locataires par propriété
  // RÈGLE : Pour une sortie, on ne montre que les locataires ACTUELS rattachés à ce bien
  const filteredTenants = tenants.filter(t => {
    const isLinked = t.propertyIds.includes(selectedPropertyId);
    if (type === 'Sortie') {
      return isLinked && t.status === 'Actuel';
    }
    return isLinked;
  });

  // Détection de doublons d'email
  const handleEmailBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const email = e.target.value;
    if (!email || !email.includes('@')) return;

    const existing = tenants.find(t => t.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      toast.info("Locataire existant détecté", {
        description: `${existing.name} est déjà dans votre base. Voulez-vous utiliser sa fiche existante ?`,
        duration: 10000,
        action: {
          label: "Rattacher",
          onClick: () => {
            setValue('tenantId', existing.id, { shouldValidate: true });
            setIsManualMode(false);
            resetField('manualTenant');
            toast.success(`C'est fait ! ${existing.name} est maintenant sélectionné.`);
          }
        }
      });
    }
  };

  return (
    <div className="bg-slate-900/50 p-8 rounded-3xl shadow-xl border border-white/5 mb-8 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500/10 p-2 rounded-lg">
            <Home className="text-blue-400" size={24} />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Informations Générales
          </h2>
        </div>
        
        <div className="flex bg-slate-950/50 border border-white/10 rounded-xl p-1">
          <button 
            type="button"
            onClick={() => setValue('type', 'Entrée')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${type === 'Entrée' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            ENTRÉE
          </button>
          <button 
            type="button"
            onClick={() => setValue('type', 'Sortie')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${type === 'Sortie' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            SORTIE
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Adresse */}
        <div className="space-y-1.5 opacity-80">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
            Adresse de la propriété
          </label>
          <div className="relative">
            <Home className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
            <input
              {...register('propertyAddress')}
              readOnly
              className="w-full bg-slate-950/30 border border-white/5 rounded-xl pl-12 pr-4 py-3 text-slate-400 outline-none cursor-not-allowed text-sm"
            />
          </div>
        </div>

        {/* Locataire */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center mb-1">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
              Locataire
            </label>
            {type === 'Entrée' && (
              <div className="flex bg-slate-950/50 border border-white/10 rounded-lg p-0.5">
                <button 
                  type="button"
                  onClick={() => setIsManualMode(false)}
                  className={`px-2 py-1 rounded-md text-[9px] font-bold transition-all ${!isManualMode ? 'bg-slate-800 text-blue-400 shadow-sm' : 'text-slate-600 hover:text-slate-400'}`}
                >
                  SÉLECTION
                </button>
                <button 
                  type="button"
                  onClick={() => setIsManualMode(true)}
                  className={`px-2 py-1 rounded-md text-[9px] font-bold transition-all ${isManualMode ? 'bg-slate-800 text-blue-400 shadow-sm' : 'text-slate-600 hover:text-slate-400'}`}
                >
                  SAISIE LIBRE
                </button>
              </div>
            )}
          </div>

          {!isManualMode ? (
            <div className="relative">
              <UserCheck className={`absolute left-4 top-1/2 -translate-y-1/2 ${selectedTenantId ? 'text-blue-500' : 'text-slate-600'}`} size={18} />
              <select
                {...register('tenantId')}
                className={`w-full bg-slate-950/50 border rounded-xl pl-12 pr-4 py-3 text-white outline-none focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer appearance-none text-sm ${
                  errors.tenantId ? 'border-red-500/50 bg-red-500/5' : 'border-white/10 focus:border-blue-500/50'
                }`}
              >
                <option value="">-- Sélectionner le locataire {type === 'Sortie' ? 'occupant' : ''} --</option>
                {filteredTenants.map(t => (
                  <option key={t.id} value={t.id} className="bg-slate-900 tracking-wide text-white font-medium">
                    {t.name}
                  </option>
                ))}
                {filteredTenants.length === 0 && (
                   <option disabled className="bg-slate-900 text-slate-500 italic">
                     {type === 'Sortie' 
                       ? "Aucun locataire 'Actuel' trouvé pour ce bien" 
                       : "Aucun locataire historiquement rattaché"}
                   </option>
                )}
              </select>
              {errors.tenantId && (
                <p className="text-red-400 text-[10px] mt-1 ml-1 font-medium flex items-center gap-1">
                  <AlertCircle size={10} /> {errors.tenantId.message}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input 
                  placeholder="Nom du nouveau locataire"
                  {...register('manualTenant.name')}
                  className="w-full bg-slate-950/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white outline-none focus:border-blue-500/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                  <input 
                    placeholder="Email"
                    {...register('manualTenant.email')}
                    onBlur={handleEmailBlur}
                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl pl-10 pr-3 py-3 text-xs text-white outline-none focus:border-blue-500/50"
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                  <input 
                    placeholder="Téléphone"
                    {...register('manualTenant.phone')}
                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl pl-10 pr-3 py-3 text-xs text-white outline-none focus:border-blue-500/50"
                  />
                </div>
              </div>
              <p className="text-[9px] text-blue-500/60 ml-1 italic font-medium">
                * Le locataire sera créé automatiquement lors de la finalisation.
              </p>
            </div>
          )}
        </div>

        {/* Date */}
        <div className="space-y-1.5 md:col-span-2 lg:col-span-1">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
            Date de l'inspection
          </label>
          <input
            type="date"
            {...register('date')}
            className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
