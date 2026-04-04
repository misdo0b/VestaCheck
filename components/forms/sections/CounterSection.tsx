import React from 'react';
import { useFormContext } from 'react-hook-form';
import { InspectionFormData } from '@/lib/validations/inspection';
import { Droplets, Zap, Flame } from 'lucide-react';

export const CounterSection: React.FC = () => {
  const { register, formState: { errors } } = useFormContext<InspectionFormData>();

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        📊 Index des Compteurs (Conformité)
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
          {errors.counters?.water && (
            <p className="text-red-500 text-xs mt-1">{errors.counters.water.message}</p>
          )}
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
          {errors.counters?.electricity && (
            <p className="text-red-500 text-xs mt-1">{errors.counters.electricity.message}</p>
          )}
        </div>

        <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
          <label className="flex items-center gap-2 text-sm font-semibold text-orange-800 mb-2">
            <Flame size={18} /> Gaz (Facultatif - m³)
          </label>
          <input
            type="number"
            step="0.01"
            {...register('counters.gas', { valueAsNumber: true })}
            className="w-full p-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
          />
        </div>
      </div>
      
      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre de clés remises
        </label>
        <div className="flex items-center gap-4">
          <input
            type="number"
            {...register('keysCount', { valueAsNumber: true })}
            className={`w-24 p-2 border rounded-lg outline-none ${
              errors.keysCount ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          <span className="text-sm text-gray-500 italic">Inclut les badges, pass et clés de boîte aux lettres.</span>
        </div>
        {errors.keysCount && (
          <p className="text-red-500 text-xs mt-1">{errors.keysCount.message}</p>
        )}
      </div>
    </div>
  );
};
