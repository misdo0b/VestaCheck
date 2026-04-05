import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { InspectionFormData } from '@/lib/validations/inspection';
import { SignaturePad } from '../../ui/SignaturePad';
import { PenTool, Mail, CheckCircle, Lock, Smartphone } from 'lucide-react';

export const SignatureSection: React.FC = () => {
  const { register, trigger, setValue, watch, formState: { errors } } = useFormContext<InspectionFormData>();
  const [activePad, setActivePad] = useState<'tenant' | null | 'inspector'>(null);

  const tenantSig = watch('signatures.tenant');
  const inspectorSig = watch('signatures.inspector');

  const openSignaturePad = async (role: 'tenant' | 'inspector') => {
    // On déclenche la validation des champs obligatoires avant de permettre la signature
    const isValid = await trigger(['propertyAddress', 'tenantName', 'tenantEmail', 'tenantPhone', 'date', 'rooms']);
    if (isValid) {
      setActivePad(role);
    } else {
      alert("Veuillez remplir tous les champs obligatoires (adresse, locataire, date, au moins une pièce avec élément) avant de signer.");
    }
  };

  const handleSaveSignature = (role: 'tenant' | 'inspector', base64: string) => {
    setValue(`signatures.${role}`, {
      drawData: base64,
      type: 'Local',
      signedAt: new Date().toISOString()
    });
  };

  const isLocked = !!(tenantSig?.drawData || inspectorSig?.drawData);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8 overflow-hidden relative">
      {isLocked && (
        <div className="absolute top-4 right-6 flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-200 text-xs font-bold animate-pulse">
          <Lock size={12} /> Dossier Verrouillé - Signatures en cours
        </div>
      )}

      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        🖋️ Finalisation & Signatures
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Signature Locataire */}
        <div className="space-y-4">
          <label className="block text-sm font-bold text-gray-700 uppercase tracking-widest text-center">
            Signature du Locataire
          </label>
          <div className="border-2 border-dashed border-gray-100 rounded-2xl h-48 flex flex-col items-center justify-center bg-gray-50/50 p-4 relative group">
            {tenantSig?.drawData ? (
              <img src={tenantSig.drawData} alt="Signature Locataire" className="max-h-full max-w-full object-contain" />
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => openSignaturePad('tenant')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-xs font-bold shadow-lg shadow-blue-100"
                  >
                    <PenTool size={14} /> Signer au doigt
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-all text-xs font-bold"
                  >
                    <Smartphone size={14} /> Lien Magique
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 font-medium">Capture locale ou envoi par SMS/Email</p>
              </div>
            )}
          </div>
        </div>

        {/* Signature Inspecteur */}
        <div className="space-y-4">
          <label className="block text-sm font-bold text-gray-700 uppercase tracking-widest text-center">
            Signature de l'Inspecteur
          </label>
          <div className="border-2 border-dashed border-gray-100 rounded-2xl h-48 flex flex-col items-center justify-center bg-gray-50/50 p-4 relative group">
            {inspectorSig?.drawData ? (
              <img src={inspectorSig.drawData} alt="Signature Inspecteur" className="max-h-full max-w-full object-contain" />
            ) : (
              <button
                type="button"
                onClick={() => openSignaturePad('inspector')}
                className="flex items-center gap-2 px-6 py-3 bg-gray-800 text-white rounded-full hover:bg-gray-900 transition-all text-sm font-bold shadow-xl active:scale-95"
              >
                <CheckCircle size={18} /> Signer le rapport
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-100">
        <label className="flex items-center gap-3 p-4 bg-blue-50/50 rounded-xl border border-blue-100 cursor-pointer hover:bg-blue-50 transition-colors">
          <input
            {...register('isFinalized')}
            type="checkbox"
            disabled={!tenantSig?.drawData || !inspectorSig?.drawData}
            className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-blue-200 disabled:opacity-30"
          />
          <span className="text-sm text-blue-900 font-medium">
            Je certifie que les informations saisies sont exactes et conformes à l'état réel du logement au jour J.
          </span>
        </label>
      </div>

      {activePad && (
        <SignaturePad
          title={activePad === 'tenant' ? 'Signature du Locataire' : "Signature de l'Inspecteur"}
          onSave={(base64) => handleSaveSignature(activePad, base64)}
          onClose={() => setActivePad(null)}
        />
      )}
    </div>
  );
};
