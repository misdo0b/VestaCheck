import React from 'react';
import { useFormContext } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import { InspectionFormData } from '@/lib/validations/inspection';
import { SignaturePad } from '../../ui/SignaturePad';
import { PenTool, Lock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export const SignatureSection: React.FC = () => {
  const { data: session } = useSession();
  const { register, trigger, setValue, watch, formState: { errors } } = useFormContext<InspectionFormData>();
  const [activePad, setActivePad] = React.useState<'tenant' | 'inspector' | null>(null);

  const agentName = session?.user?.name || "Agent VestaCheck";
  const tenantSig = watch('signatures.tenant');
  const inspectorSig = watch('signatures.inspector');

  const openSignaturePad = async (role: 'tenant' | 'inspector') => {
    // On déclenche la validation de TOUT le formulaire avant de permettre la signature (Exigence du verrouillage)
    const isValid = await trigger();
    if (isValid) {
      setActivePad(role);
    } else {
      toast.error("Veuillez remplir les informations obligatoires (ADRESSE, LOCATAIRE, DATE, PIÈCES) avant de signer.", {
        description: "Le formulaire sera ensuite verrouillé pour garantir l'intégrité du rapport.",
        duration: 5000
      });
    }
  };

  const handleSaveSignature = (role: 'tenant' | 'inspector', base64: string) => {
    setValue(`signatures.${role}`, {
      drawData: base64,
      type: 'Local',
      signedAt: new Date().toISOString()
    });
    setActivePad(null);
  };

  const isLocked = !!(tenantSig?.drawData && inspectorSig?.drawData);
  const isDataLocked = !!(tenantSig?.drawData || inspectorSig?.drawData);

  // Composant réutilisable pour la boîte de signature
  const SignatureBox = ({ role, label, data }: { role: 'tenant' | 'inspector', label: string, data?: string }) => (
    <div className="space-y-4">
      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 text-center">
        {label}
      </label>
      <div className="relative group/sig">
        {data ? (
          <div className="bg-slate-200 rounded-3xl h-64 flex items-center justify-center p-6 border border-slate-300 shadow-inner overflow-hidden">
             <img src={data} alt={`Signature ${label}`} className="max-h-full max-w-full object-contain mix-blend-multiply transition-transform hover:scale-105 duration-500" />
          </div>
        ) : (
          <div className="bg-slate-900/40 border-2 border-dashed border-white/5 rounded-3xl h-64 flex flex-col items-center justify-center p-6 transition-all hover:border-blue-500/20 group-hover/sig:bg-slate-900/60">
            <button
              type="button"
              onClick={() => openSignaturePad(role)}
              className="flex items-center gap-3 px-8 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-500 transition-all text-sm font-black shadow-xl shadow-blue-600/20 active:scale-95"
            >
              <PenTool size={18} />
              <span>Signer le rapport</span>
            </button>
            <p className="mt-4 text-[9px] text-slate-600 font-bold uppercase tracking-wider">Capture locale sécurisée</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-slate-900/50 p-8 rounded-2xl shadow-xl border border-white/5 mb-8 overflow-hidden relative backdrop-blur-sm">
      {isDataLocked && !isLocked && (
        <div className="absolute top-6 right-8 flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20 text-[10px] font-bold uppercase tracking-wider animate-pulse transition-all">
          <Lock size={12} /> Données Verrouillées - Signatures en cours
        </div>
      )}

      {isLocked && (
        <div className="absolute top-6 right-8 flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider transition-all">
          <CheckCircle2 size={12} className="text-emerald-400" /> Signatures Complètes
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
        <SignatureBox role="tenant" label="Le Locataire" data={tenantSig?.drawData} />
        <SignatureBox role="inspector" label={`${agentName} (Agent)`} data={inspectorSig?.drawData} />
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

      {/* MODAL DE SIGNATURE */}
      {activePad && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
          <div 
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" 
            onClick={() => setActivePad(null)} 
          />
          <div className="relative w-full max-w-2xl transform transition-all animate-in zoom-in-95 duration-300">
            <SignaturePad
              title={activePad === 'tenant' ? 'Signature du Locataire' : `Signature de : ${agentName}`}
              onSave={(base64) => handleSaveSignature(activePad, base64)}
              onClose={() => setActivePad(null)}
            />
            <button
               onClick={() => setActivePad(null)}
               className="absolute -top-12 right-0 p-2 text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
            >
               Fermer <Lock size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
