import React from 'react';
import { useFormContext, useFieldArray, useWatch } from 'react-hook-form';
import { InspectionFormData } from '@/lib/validations/inspection';
import { Droplets, Zap, Flame, Key, Plus, Trash2, Hash, Activity } from 'lucide-react';

const KEY_SUGGESTIONS = [
  "Clés du logement", 
  "Clés de la chambre", 
  "Badges d'accès", 
  "Clés de la boîte aux lettres", 
  "Badge de parking",
  "Vigik",
  "Télécommande portail"
];

export const CounterSection: React.FC = () => {
  const { register, control, watch, formState: { errors } } = useFormContext<InspectionFormData>();
  
  const tenantSig = watch('signatures.tenant.drawData');
  const inspectorSig = watch('signatures.inspector.drawData');
  const isLocked = !!(tenantSig || inspectorSig);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "keyInventories"
  });

  // Pour calculer le total des clés en temps réel
  const watchKeys = useWatch({
    control,
    name: "keyInventories"
  });

  const totalKeys = watchKeys?.reduce((acc, curr) => acc + (Number(curr.count) || 0), 0) || 0;

  return (
    <div className={`bg-slate-900/50 p-8 rounded-2xl shadow-xl border border-white/5 mb-8 backdrop-blur-sm ${
      isLocked ? 'opacity-75' : ''
    }`}>
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-indigo-500/10 p-2 rounded-lg">
          <Activity className="text-indigo-400" size={24} />
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Compteurs & Clés
        </h2>
      </div>
      
      <fieldset disabled={isLocked}>
        {/* Section Compteurs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-blue-500/5 p-5 rounded-2xl border border-blue-500/10 hover:border-blue-500/20 transition-colors group">
            <label className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">
              <Droplets size={16} className="group-hover:scale-110 transition-transform" /> Eau (m³)
            </label>
            <input
              type="number"
              step="0.01"
              {...register('counters.water', { valueAsNumber: true })}
              className={`w-full bg-slate-950/50 border rounded-xl px-4 py-2.5 text-white outline-none focus:ring-4 focus:ring-blue-500/10 transition-all ${
                errors.counters?.water ? 'border-red-500/50 bg-red-500/5' : 'border-white/10 focus:border-blue-500/50'
              }`}
            />
          </div>

          <div className="bg-amber-500/5 p-5 rounded-2xl border border-amber-500/10 hover:border-amber-500/20 transition-colors group">
            <label className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-widest mb-3">
              <Zap size={16} className="group-hover:scale-110 transition-transform" /> Électricité (kWh)
            </label>
            <input
              type="number"
              step="1"
              {...register('counters.electricity', { valueAsNumber: true })}
              className={`w-full bg-slate-950/50 border rounded-xl px-4 py-2.5 text-white outline-none focus:ring-4 focus:ring-amber-500/10 transition-all ${
                errors.counters?.electricity ? 'border-red-500/50 bg-red-500/5' : 'border-white/10 focus:border-amber-500/50'
              }`}
            />
          </div>

          <div className="bg-orange-500/5 p-5 rounded-2xl border border-orange-500/10 hover:border-orange-500/20 transition-colors group">
            <label className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-widest mb-3">
              <Flame size={16} className="group-hover:scale-110 transition-transform" /> Gaz (m³)
            </label>
            <input
              type="number"
              step="0.01"
              {...register('counters.gas', { valueAsNumber: true })}
              className="w-full bg-slate-950/50 border border-white/10 focus:border-orange-500/50 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-4 focus:ring-orange-500/10 transition-all"
            />
          </div>
        </div>
        
        {/* Section Clés Dynamique */}
        <div className="border-t border-white/5 pt-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Key size={18} className="text-blue-400" />
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Inventaire des Clés & Badges
              </label>
            </div>
            {!isLocked && (
              <button
                type="button"
                onClick={() => append({ id: crypto.randomUUID(), type: '', count: 1 })}
                className="flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20"
              >
                <Plus size={14} /> Ajouter un type
              </button>
            )}
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-4 bg-slate-950/40 p-4 rounded-xl group border border-white/[0.02] hover:border-white/5 transition-all">
                <div className="flex-1">
                  <input
                    {...register(`keyInventories.${index}.type` as const)}
                    list="key-types"
                    placeholder="Ex: Clés logement, Badge parking..."
                    className="w-full bg-transparent border-b border-white/10 focus:border-blue-500/50 outline-none text-sm font-medium text-white placeholder:text-slate-600 pb-1 py-1"
                  />
                  <datalist id="key-types">
                    {KEY_SUGGESTIONS.map(s => <option key={s} value={s} />)}
                  </datalist>
                </div>
                
                <div className="flex items-center gap-3 bg-slate-900 px-3 py-1.5 rounded-lg border border-white/5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Quantité</span>
                  <input
                    type="number"
                    {...register(`keyInventories.${index}.count` as const, { valueAsNumber: true })}
                    className="w-12 bg-transparent text-center text-sm font-bold text-blue-400 outline-none"
                  />
                </div>

                {!isLocked && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all p-1.5 hover:bg-red-500/10 rounded-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Total des Clés */}
          <div className="mt-8 flex justify-end items-center gap-4 p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
            <div className="flex items-center gap-2 text-indigo-300">
              <Hash size={18} />
              <span className="text-sm font-bold tracking-tight">TOTAL des clés et badges remis :</span>
            </div>
            <div className="w-14 h-14 bg-indigo-500 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-500/20">
              {totalKeys}
            </div>
          </div>
        </div>
      </fieldset>
    </div>
  );
};
