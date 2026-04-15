import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { InspectionFormData } from '@/lib/validations/inspection';
import { Key, Plus, Trash2, ShieldCheck, Minus } from 'lucide-react';

export const KeyInventorySection: React.FC = () => {
  const { register, control, watch } = useFormContext<InspectionFormData>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'keyInventories'
  });

  const tenantSig = watch('signatures.tenant.drawData');
  const inspectorSig = watch('signatures.inspector.drawData');
  const isLocked = !!(tenantSig || inspectorSig);

  return (
    <div className={`mb-12 ${isLocked ? 'opacity-75' : ''}`}>
      <div className="flex items-center gap-3 mb-8 mx-2">
        <div className="bg-amber-500/10 p-2 rounded-lg">
          <Key className="text-amber-400" size={24} />
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Inventaire des Clés & Accès
        </h2>
      </div>

      <div className="space-y-4 px-2">
        {fields.map((field, index) => (
          <div 
            key={field.id}
            className="flex flex-col md:flex-row gap-4 p-4 bg-slate-900/40 rounded-2xl border border-white/5 backdrop-blur-sm group transition-all hover:border-white/10 items-center"
          >
            <div className="flex-1 w-full">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Type de clé / Accès</label>
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                <input 
                  {...register(`keyInventories.${index}.type` as const)}
                  placeholder="Ex: Clés porte entrée, Badge parking..."
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/5 rounded-xl text-sm text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/40 transition-all font-medium"
                />
              </div>
            </div>

            <div className="w-full md:w-32">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Nombre</label>
              <input 
                type="number"
                {...register(`keyInventories.${index}.count` as const, { valueAsNumber: true })}
                className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-sm text-white text-center font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            {!isLocked && (
              <button
                type="button"
                onClick={() => remove(index)}
                className="p-3 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all self-end md:self-center"
              >
                <Trash2 size={20} />
              </button>
            )}
          </div>
        ))}

        {!isLocked && (
          <button
            type="button"
            onClick={() => append({ id: crypto.randomUUID(), type: '', count: 1 })}
            className="w-full py-4 flex items-center justify-center gap-2 border-2 border-dashed border-white/5 rounded-2xl text-slate-500 hover:text-amber-400 hover:border-amber-500/20 hover:bg-amber-500/5 transition-all text-sm font-bold active:scale-[0.98]"
          >
            <Plus size={18} /> Ajouter un accès
          </button>
        )}
      </div>
    </div>
  );
};
