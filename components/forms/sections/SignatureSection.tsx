import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import { InspectionFormData } from '@/lib/validations/inspection';
import { SignaturePad } from '../../ui/SignaturePad';
import { PenTool, Mail, CheckCircle, Lock, Smartphone } from 'lucide-react';

export const SignatureSection: React.FC = () => {
  const { data: session } = useSession();
  const { register, trigger, setValue, watch, formState: { errors } } = useFormContext<InspectionFormData>();
  const [activePad, setActivePad] = useState<'tenant' | null | 'inspector'>(null);

  const agentName = session?.user?.name || "Agent VestaCheck";

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
    <div className="bg-slate-900/50 p-8 rounded-2xl shadow-xl border border-white/5 mb-8 overflow-hidden relative backdrop-blur-sm">
      {isLocked && (
        <div className="absolute top-6 right-8 flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20 text-[10px] font-bold uppercase tracking-wider animate-pulse transition-all">
          <Lock size={12} /> Dossier Verrouillé - Signatures en cours
        </div>
      )}

      <div className="flex items-center gap-3 mb-10">
        <div className="bg-blue-500/10 p-2 rounded-lg">
          <PenTool className="text-blue-400" size={24} />
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Finalisation & Signatures
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Signature Locataire */}
        <div className="space-y-4">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] text-center">
            Signature du Locataire
          </label>
          <div className="border-2 border-dashed border-white/5 rounded-3xl h-56 flex flex-col items-center justify-center bg-slate-950/40 p-6 relative group/sig overflow-hidden shadow-inner">
            {tenantSig?.drawData ? (
              <img src={tenantSig.drawData} alt="Signature Locataire" className="max-h-full max-w-full object-contain brightness-110 contrast-125" />
            ) : (
              <div className="flex flex-col items-center gap-5">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => openSignaturePad('tenant')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all text-xs font-bold shadow-lg shadow-blue-600/20"
                  >
                    <PenTool size={14} /> Signer au doigt
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-all text-xs font-bold"
                  >
                    <Smartphone size={14} /> SMS
                  </button>
                </div>
                <p className="text-[10px] text-slate-600 font-medium tracking-wide uppercase">Capture locale ou distante</p>
              </div>
            )}
          </div>
        </div>

        {/* Signature Inspecteur */}
        <div className="space-y-4">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] text-center">
            Signature de : {agentName}
          </label>
          <div className="border-2 border-dashed border-white/5 rounded-3xl h-56 flex flex-col items-center justify-center bg-slate-950/40 p-6 relative group/sig overflow-hidden shadow-inner">
            {inspectorSig?.drawData ? (
              <img src={inspectorSig.drawData} alt="Signature Inspecteur" className="max-h-full max-w-full object-contain brightness-110 contrast-125" />
            ) : (
              <button
                type="button"
                onClick={() => openSignaturePad('inspector')}
                className="flex items-center gap-3 px-6 py-3 bg-slate-100 text-slate-900 rounded-2xl hover:bg-white transition-all text-sm font-bold shadow-xl active:scale-95 flex items-center"
              >
                <CheckCircle size={18} className="text-blue-600 focus:ring-4 focus:ring-blue-500/10" /> 
                <span>Signer le rapport</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-10 pt-8 border-t border-white/5">
        <label className="flex items-start gap-4 p-5 bg-blue-500/5 rounded-2xl border border-blue-500/10 cursor-pointer hover:bg-blue-500/10 transition-all group">
          <div className="mt-0.5">
            <input
              {...register('isFinalized')}
              type="checkbox"
              disabled={!tenantSig?.drawData || !inspectorSig?.drawData}
              className="w-5 h-5 rounded-lg bg-slate-900 border-white/10 text-blue-600 focus:ring-blue-500/20 focus:ring-offset-0 disabled:opacity-30 cursor-pointer transition-all"
            />
          </div>
          <span className="text-sm text-slate-300 font-medium leading-relaxed group-hover:text-white transition-colors">
            Je certifie que les informations saisies sont exactes et conformes à l'état réel du logement au jour de l'inspection. 
            <span className="block text-xs text-slate-500 mt-1 font-normal italic">Ce document a valeur légale une fois signé et finalisé.</span>
          </span>
        </label>
      </div>

      {activePad && (
        <SignaturePad
          title={activePad === 'tenant' ? 'Signature du Locataire' : `Signature de : ${agentName}`}
          onSave={(base64) => handleSaveSignature(activePad, base64)}
          onClose={() => setActivePad(null)}
        />
      )}
    </div>
  );
};
