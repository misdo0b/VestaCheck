import React from 'react';
import { useFormContext } from 'react-hook-form';
import { InspectionFormData } from '@/lib/validations/inspection';
import { Droplets, Zap, Flame, Activity } from 'lucide-react';

interface CounterSectionProps {
  isTemplateMode?: boolean;
}

export const CounterSection: React.FC<CounterSectionProps> = ({ isTemplateMode = false }) => {
  const { register, watch, formState: { errors } } = useFormContext<InspectionFormData>();
  
  const tenantSig = watch('signatures.tenant.drawData');
  const inspectorSig = watch('signatures.inspector.drawData');
  const isLocked = !!(tenantSig || inspectorSig);

  return (
    <div className={`bg-slate-900/50 p-8 rounded-2xl shadow-xl border border-white/5 mb-8 backdrop-blur-sm ${
      isLocked ? 'opacity-75' : ''
    }`}>
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-indigo-500/10 p-2 rounded-lg">
          <Activity className="text-indigo-400" size={24} />
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Relevé des Compteurs
        </h2>
      </div>
      
      <fieldset disabled={isLocked}>
        {/* Section Compteurs - Masquée en mode Template car non pertinente */}
        {!isTemplateMode && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        )}
      </fieldset>
    </div>
  );
};
