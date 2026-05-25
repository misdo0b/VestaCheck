import React from 'react';
import { useFormContext } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import { InspectionFormData } from '@/lib/validations/inspection';
import { SignaturePad } from '../../ui/SignaturePad';
import { PenTool, Lock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';

export const SignatureSection: React.FC = () => {
  const { data: session } = useSession();
  const { register, trigger, setValue, watch, formState: { errors } } = useFormContext<InspectionFormData>();
  const [activePad, setActivePad] = React.useState<'tenant' | 'inspector' | null>(null);
  const { t } = useTranslation();

  const agentName = session?.user?.name || "Agent VestaCheck";
  const tenantSig = watch('signatures.tenant');
  const inspectorSig = watch('signatures.inspector');
  const isFinalized = watch('isFinalized');

  const openSignaturePad = async (role: 'tenant' | 'inspector') => {
    // On ne permet pas de signer si le rapport est déjà finalisé
    if (isFinalized) return;
    
    // On déclenche la validation de TOUT le formulaire avant de permettre la signature (Exigence du verrouillage)
    const isValid = await trigger();
    
    if (isValid) {
      setActivePad(role);
    } else {
      console.log("Validation errors before signature:", errors);
      
      // Diagnostic précis pour l'utilisateur
      const missingFields = new Set<string>();
      
      if (errors.propertyAddress) missingFields.add(t('inspection.propertyAddress').toUpperCase());
      if (errors.tenantId || errors.manualTenant) missingFields.add(t('inspection.tenant').toUpperCase());
      if (errors.date) missingFields.add(t('inspection.date').toUpperCase());
      if (errors.rooms) missingFields.add(t('inspection.addRoomCardTitle').toUpperCase());
      if (errors.counters) missingFields.add(t('pdf.counterType').toUpperCase());
      if (errors.keyInventories) missingFields.add(t('inspection.keysTitle').toUpperCase());
      
      // Cas spécifique pour les sous-champs des compteurs si l'objet parent n'est pas marqué
      if (!errors.counters && (errors as any).counters) {
        missingFields.add(t('pdf.counterType').toUpperCase());
      }

      const message = missingFields.size > 0 
        ? `${t('inspection.missingFields')} : ${Array.from(missingFields).join(', ')}`
        : t('inspection.invalidFormInfo');

      // Si aucune catégorie n'est trouvée mais qu'il y a des erreurs, on affiche la première erreur brute pour aider
      let detailMessage = t('inspection.completeRequiredSections');
      if (missingFields.size === 0 && Object.keys(errors).length > 0) {
        const firstErrorKey = Object.keys(errors)[0];
        const error = (errors as any)[firstErrorKey];
        if (error?.message) {
          detailMessage = `Erreur sur ${firstErrorKey} : ${error.message}`;
        }
      }

      toast.error(message, {
        description: detailMessage,
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
              disabled={isFinalized}
              className="flex items-center gap-3 px-8 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-500 transition-all text-sm font-black shadow-xl shadow-blue-600/20 active:scale-95 disabled:opacity-50 disabled:scale-100"
            >
              <PenTool size={18} />
              <span>{t('inspection.signBtn')}</span>
            </button>
            <p className="mt-4 text-[9px] text-slate-600 font-bold uppercase tracking-wider">{t('inspection.secureCaptureNote')}</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-slate-900/50 p-8 rounded-2xl shadow-xl border border-white/5 mb-8 overflow-hidden relative backdrop-blur-sm">
      {isDataLocked && !isLocked && (
        <div className="absolute top-6 right-8 flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20 text-[10px] font-bold uppercase tracking-wider animate-pulse transition-all">
          <Lock size={12} /> {t('inspection.signaturesLocked')}
        </div>
      )}

      {isLocked && (
        <div className="absolute top-6 right-8 flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider transition-all">
          <CheckCircle2 size={12} className="text-emerald-400" /> {t('inspection.signaturesComplete')}
        </div>
      )}

      <div className="flex items-center gap-3 mb-10">
        <div className="bg-blue-500/10 p-2 rounded-lg">
          <PenTool className="text-blue-400" size={24} />
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          {t('inspection.signaturesTitle')}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <SignatureBox role="tenant" label={t('pdf.tenantRole')} data={tenantSig?.drawData} />
        <SignatureBox role="inspector" label={`${agentName} (${t('roles.Agent')})`} data={inspectorSig?.drawData} />
      </div>

      <div className="mt-10 pt-8 border-t border-white/5">
        <label className={`flex items-start gap-4 p-5 rounded-2xl border transition-all group ${
          isFinalized 
            ? 'bg-slate-900/40 border-white/5 cursor-default' 
            : 'bg-blue-500/5 border-blue-500/10 cursor-pointer hover:bg-blue-500/10'
        }`}>
          <div className="mt-0.5">
            <input
              {...register('isFinalized')}
              type="checkbox"
              disabled={isFinalized || !tenantSig?.drawData || !inspectorSig?.drawData}
              className="w-5 h-5 rounded-lg bg-slate-900 border-white/10 text-blue-600 focus:ring-blue-500/20 focus:ring-offset-0 disabled:opacity-30 cursor-pointer transition-all disabled:cursor-not-allowed"
            />
          </div>
          <span className={`text-sm font-medium leading-relaxed transition-colors ${
            isFinalized ? 'text-slate-500' : 'text-slate-300 group-hover:text-white'
          }`}>
            {t('inspection.certifyAccuracy')}
            <span className="block text-xs text-slate-500 mt-1 font-normal italic">{t('inspection.legalValueNote')}</span>
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
              title={activePad === 'tenant' ? t('inspection.signatureTenantTitle') : t('inspection.signatureInspectorTitle').replace('{name}', agentName)}
              onSave={(base64) => handleSaveSignature(activePad, base64)}
              onClose={() => setActivePad(null)}
            />
            <button
               onClick={() => setActivePad(null)}
               className="absolute -top-12 right-0 p-2 text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
            >
               {t('inspection.closeBtn')} <Lock size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
