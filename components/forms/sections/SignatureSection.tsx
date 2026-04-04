import React from 'react';
import { useFormContext } from 'react-hook-form';
import { InspectionFormData } from '@/lib/validations/inspection';
import { FileSignature, PenTool } from 'lucide-react';

export const SignatureSection: React.FC = () => {
  const { register, formState: { errors } } = useFormContext<InspectionFormData>();

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        🖋️ Finalisation & Signatures
      </h2>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <FileSignature size={16} className="text-blue-600" /> Observations Générales
        </label>
        <textarea
          {...register('generalObservations')}
          placeholder="Résumé des points marquants, commentaires sur le logement en général..."
          className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none min-h-[120px] text-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="border-2 border-dashed border-gray-200 p-8 rounded-xl text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-400 group-hover:text-blue-500 transition-colors">
              <PenTool size={32} />
            </div>
            <div>
              <p className="font-bold text-gray-800">Signature du Locataire</p>
              <p className="text-xs text-gray-500 mt-1 uppercase tracking-tighter italic">Cliquez pour signer numériquement</p>
            </div>
          </div>
        </div>

        <div className="border-2 border-dashed border-gray-200 p-8 rounded-xl text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-400 group-hover:text-blue-500 transition-colors">
              <PenTool size={32} />
            </div>
            <div>
              <p className="font-bold text-gray-800">Signature de l'Inspecteur</p>
              <p className="text-xs text-gray-500 mt-1 uppercase tracking-tighter italic">Cliquez pour signer numériquement</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-3 p-4 bg-blue-50 rounded-lg text-blue-800 border border-blue-100">
        <div className="shrink-0">
          <input 
            type="checkbox" 
            {...register('isFinalized')}
            id="finalized-check" 
            className="w-5 h-5 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
          />
        </div>
        <label htmlFor="finalized-check" className="text-sm font-medium leading-tight select-none cursor-pointer">
          Je certifie que les informations saisies sont exactes et conformes à l'état réel du logement au jour J.
        </label>
      </div>
    </div>
  );
};
