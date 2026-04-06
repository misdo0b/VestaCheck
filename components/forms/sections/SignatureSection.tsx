import React from 'react';
import { useFormContext } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import { InspectionFormData } from '@/lib/validations/inspection';
import { SignaturePad } from '../../ui/SignaturePad';
import { PenTool, Lock } from 'lucide-react';

export const SignatureSection: React.FC = () => {
  const { data: session } = useSession();
  const { register, setValue, watch } = useFormContext<InspectionFormData>();

  const agentName = session?.user?.name || "Agent VestaCheck";
  const tenantSig = watch('signatures.tenant');
  const inspectorSig = watch('signatures.inspector');

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
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 text-center">
            Le Locataire
          </label>
          <div className="relative group/sig">
            {tenantSig?.drawData ? (
              <div className="bg-slate-200 rounded-3xl h-64 flex items-center justify-center p-6 border border-slate-300 shadow-inner overflow-hidden">
                 <img src={tenantSig.drawData} alt="Signature Locataire" className="max-h-full max-w-full object-contain mix-blend-multiply transition-transform hover:scale-105 duration-500" />
              </div>
            ) : (
              <SignaturePad 
                title="Signature du Locataire" 
                onSave={(base64) => handleSaveSignature('tenant', base64)} 
                onClose={() => {}}
              />
            )}
          </div>
        </div>

        {/* Signature Agent */}
        <div className="space-y-4">
          <label className="block text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em] mb-4 text-center">
            {agentName} (Agent)
          </label>
          <div className="relative group/sig">
            {inspectorSig?.drawData ? (
              <div className="bg-slate-200 rounded-3xl h-64 flex items-center justify-center p-6 border border-slate-300 shadow-inner overflow-hidden">
                 <img src={inspectorSig.drawData} alt="Signature Agent" className="max-h-full max-w-full object-contain mix-blend-multiply transition-transform hover:scale-105 duration-500" />
              </div>
            ) : (
              <SignaturePad 
                title={`Signature de : ${agentName}`} 
                onSave={(base64) => handleSaveSignature('inspector', base64)} 
                onClose={() => {}}
              />
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
    </div>
  );
};
