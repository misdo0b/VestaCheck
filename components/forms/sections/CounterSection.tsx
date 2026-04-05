import React from 'react';
import { useFormContext, useFieldArray, useWatch } from 'react-hook-form';
import { InspectionFormData } from '@/lib/validations/inspection';
import { Droplets, Zap, Flame, Key, Plus, Trash2, Hash } from 'lucide-react';

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
    <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8 ${
      isLocked ? 'opacity-75' : ''
    }`}>
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        📊 Index des Compteurs & Clés
      </h2>
      
      <fieldset disabled={isLocked}>
        {/* Section Compteurs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <label className="flex items-center gap-2 text-sm font-semibold text-blue-800 mb-2">
              <Droplets size={18} /> Eau (m³)
            </label>
            <input
              type="number"
              step="0.01"
              {...register('counters.water', { valueAsNumber: true })}
              className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                errors.counters?.water ? 'border-red-500' : 'border-blue-200'
              }`}
            />
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
            <label className="flex items-center gap-2 text-sm font-semibold text-yellow-800 mb-2">
              <Zap size={18} /> Électricité (kWh)
            </label>
            <input
              type="number"
              step="1"
              {...register('counters.electricity', { valueAsNumber: true })}
              className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none ${
                errors.counters?.electricity ? 'border-red-500' : 'border-yellow-200'
              }`}
            />
          </div>

          <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
            <label className="flex items-center gap-2 text-sm font-semibold text-orange-800 mb-2">
              <Flame size={18} /> Gaz (m³)
            </label>
            <input
              type="number"
              step="0.01"
              {...register('counters.gas', { valueAsNumber: true })}
              className="w-full p-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>
        </div>
        
        {/* Section Clés Dynamique */}
        <div className="border-t border-gray-50 pt-6">
          <div className="flex justify-between items-center mb-4">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wider">
              <Key size={18} className="text-blue-600" /> Inventaire des Clés & Badges
            </label>
            {!isLocked && (
              <button
                type="button"
                onClick={() => append({ id: crypto.randomUUID(), type: '', count: 1 })}
                className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
              >
                <Plus size={14} /> Ajouter un type
              </button>
            )}
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg group">
                <div className="flex-1">
                  <input
                    {...register(`keyInventories.${index}.type` as const)}
                    list="key-types"
                    placeholder="Type de clé (Ex: Clés logement...)"
                    className="w-full bg-transparent border-b border-gray-200 focus:border-blue-400 outline-none text-sm font-medium"
                  />
                  <datalist id="key-types">
                    {KEY_SUGGESTIONS.map(s => <option key={s} value={s} />)}
                  </datalist>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Quantité</span>
                  <input
                    type="number"
                    {...register(`keyInventories.${index}.count` as const, { valueAsNumber: true })}
                    className="w-16 p-1 border border-gray-200 rounded text-center text-sm font-bold outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {!isLocked && index > 0 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-colors p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Total des Clés */}
          <div className="mt-4 flex justify-end items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2 text-blue-800">
              <Hash size={16} />
              <span className="text-sm font-bold">TOTAL des clés et badges remis :</span>
            </div>
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border-2 border-blue-400 text-blue-900 font-black text-lg shadow-sm">
              {totalKeys}
            </div>
          </div>
        </div>
      </fieldset>
    </div>
  );
};
