import React, { useState, useEffect, useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getInspectionReportSchema, getPropertyTemplateSchema, InspectionFormData } from '@/lib/validations/inspection';
import { HeaderSection } from './sections/HeaderSection';
import { CounterSection } from './sections/CounterSection';
import { RoomSection } from './sections/RoomSection';
import { KeyInventorySection } from './sections/KeyInventorySection';
import { SignatureSection } from './sections/SignatureSection';
import { Stepper } from './Stepper';
import { useSession } from 'next-auth/react';
import {
  Save,
  Send,
  AlertCircle,
  FileDown,
  Loader2,
  LayoutGrid,
  ArrowRight,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';
import { useInspectionStore } from '@/store/useInspectionStore';
import { usePropertyStore } from '@/store/usePropertyStore';
import { useTenantStore } from '@/store/useTenantStore';
import { PhotoBlobStorage } from '@/lib/utils/blob-storage';
import { generatePDF } from '@/lib/utils/generate-pdf';
import { PDFTemplate } from '../pdf/PDFTemplate';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';

interface Props {
  initialData?: Partial<InspectionFormData> & { templateName?: string };
  isTemplateMode?: boolean;
  templateId?: string;
}

export const InspectionForm: React.FC<Props> = ({ initialData, isTemplateMode = false, templateId }) => {
  const { t, language } = useTranslation();
  const finalizeInspection = useInspectionStore((state) => state.finalizeInspection);
  const addTemplate = usePropertyStore((state) => state.addTemplate);
  const updateTemplate = usePropertyStore((state) => state.updateTemplate);
  const { addTenant } = useTenantStore();
  const { data: session } = useSession();
  const currentUser = session?.user as any;

  const [templateName, setTemplateName] = useState(initialData?.templateName || '');
  const [isExporting, setIsExporting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [pdfData, setPdfData] = useState<InspectionFormData | null>(null);
  const router = useRouter();

  // Dynamic translated schemas
  const schema = useMemo(() => {
    return isTemplateMode ? getPropertyTemplateSchema(t) : getInspectionReportSchema(t);
  }, [t, isTemplateMode]);

  // Définition des étapes selon le mode dynamique
  const steps = useMemo(() => {
    return isTemplateMode
      ? [
        { id: 1, label: t('inspection.steps.setup') },
        { id: 2, label: t('inspection.steps.structure') }
      ]
      : [
        { id: 1, label: t('inspection.steps.synthesis') },
        { id: 2, label: t('inspection.steps.rooms') },
        { id: 3, label: t('inspection.steps.keys') },
        { id: 4, label: t('inspection.steps.signatures') }
      ];
  }, [t, isTemplateMode]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const methods = useForm<InspectionFormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      id: initialData?.id || crypto.randomUUID(),
      propertyId: initialData?.propertyId || 'prop1',
      date: initialData?.date ? initialData.date.split('T')[0] : new Date().toISOString().split('T')[0],
      type: initialData?.type || 'Entrée',
      propertyAddress: initialData?.propertyAddress || '',
      tenantId: initialData?.tenantId || '',
      ownerId: initialData?.ownerId || 'owner1',
      inspectorId: initialData?.inspectorId || currentUser?.id || 'agent1',
      agencyId: initialData?.agencyId || currentUser?.agencyId || '',
      organizationId: initialData?.organizationId || currentUser?.organizationId || '',
      counters: {
        water: initialData?.counters?.water ?? 0,
        electricity: initialData?.counters?.electricity ?? 0,
        gas: initialData?.counters?.gas ?? 0,
      },
      keyInventories: (initialData?.keyInventories || [
        { id: crypto.randomUUID(), type: 'Clés du logement', count: 2 }
      ]).map(k => ({
        ...k,
        count: k.count ?? 1,
        type: k.type || 'Clés du logement'
      })),
      signatures: initialData?.signatures || {
        tenant: { type: 'Aucune' },
        inspector: { type: 'Aucune' }
      },
      generalObservations: initialData?.generalObservations || '',
      rooms: (initialData?.rooms || [
        {
          id: crypto.randomUUID(),
          name: t('inspection.defaultRoomSalon'),
          items: [
            { id: crypto.randomUUID(), label: t('inspection.defaultItemMurs'), condition: 'Bon', comment: '', photos: [] },
            { id: crypto.randomUUID(), label: t('inspection.defaultItemSols'), condition: 'Bon', comment: '', photos: [] }
          ]
        }
      ]).map(room => ({
        ...room,
        items: (room.items || []).map(item => ({
          ...item,
          condition: item.condition || 'Bon'
        }))
      })),
      isFinalized: initialData?.isFinalized || false,
      lastModified: new Date().toISOString(),
    },
    mode: 'onTouched'
  });

  const { isValid, errors: formErrors } = methods.formState;
  const isFinalized = methods.watch('isFinalized');
  const tenantSig = methods.watch('signatures.tenant');
  const inspectorSig = methods.watch('signatures.inspector');

  const bothSignaturesPresent = !!(tenantSig?.drawData && inspectorSig?.drawData);
  const isLocked = !!(
    initialData?.isFinalized || 
    isFinalized || 
    tenantSig?.drawData || 
    inspectorSig?.drawData ||
    methods.getValues('isFinalized') ||
    methods.getValues('signatures.tenant.drawData') ||
    methods.getValues('signatures.inspector.drawData')
  );
  const canFinalize = isValid && bothSignaturesPresent && (initialData?.isFinalized || isFinalized);

  const nextStep = async () => {
    if (isLocked) {
      setCurrentStep(s => {
        const next = Math.min(s + 1, steps.length - 1);
        return isNaN(next) ? 0 : next;
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    let fieldsToValidate: any[] = [];
    if (isTemplateMode) {
      if (currentStep === 0) fieldsToValidate = ['counters'];
    } else {
      if (currentStep === 0) fieldsToValidate = ['propertyAddress', 'tenantId', 'manualTenant', 'counters'];
      if (currentStep === 1) fieldsToValidate = ['rooms'];
      if (currentStep === 2) fieldsToValidate = ['keyInventories'];
    }

    const isStepValid = await methods.trigger(fieldsToValidate);
    if (isStepValid) {
      setCurrentStep(s => {
        const next = Math.min(s + 1, steps.length - 1);
        return isNaN(next) ? 0 : next;
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      console.warn("[VestaCheck Validation Debug] Erreurs sur l'étape courante:", methods.formState.errors);
      toast.error(t('inspection.toastErrorSubmit'));
    }
  };

  const prevStep = () => {
    setCurrentStep(s => {
      const prev = Math.max(s - 1, 0);
      return isNaN(prev) ? 0 : prev;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSubmit = async (data: InspectionFormData) => {
    let finalTenantId = data.tenantId;

    if (!finalTenantId && data.manualTenant?.name && data.manualTenant?.email) {
      try {
        const newId = await addTenant({
          id: crypto.randomUUID(),
          name: data.manualTenant.name,
          email: data.manualTenant.email,
          phone: data.manualTenant.phone,
          status: 'Actuel',
          propertyIds: [data.propertyId],
          agencyId: data.agencyId,
          organizationId: data.organizationId
        });
        finalTenantId = newId;
        toast.success(t('tenants.createSuccess') || `Nouveau locataire ${data.manualTenant.name} créé !`);
      } catch (err) {
        toast.error(t('tenants.errorGeneric') || "Erreur lors de la création automatique du locataire.");
        return;
      }
    }

    if (isTemplateMode) {
      if (templateId) {
        // Mode Édition
        updateTemplate(templateId, {
          name: templateName || `Template ${new Date().toLocaleDateString()}`,
          rooms: data.rooms,
          keyInventories: data.keyInventories
        });
        toast.success(t('inspection.toastUpdateTemplate'));
      } else {
        // Mode Création
        const templateData = {
          id: crypto.randomUUID(),
          propertyId: data.propertyId,
          agencyId: data.agencyId || currentUser?.agencyId,
          organizationId: data.organizationId || currentUser?.organizationId,
          name: templateName || `Template ${new Date().toLocaleDateString()}`,
          rooms: data.rooms,
          keyInventories: data.keyInventories
        };
        addTemplate(templateData as any);
        toast.success(t('inspection.toastSuccessTemplate'));
      }
      router.push(`/dashboard/properties/${data.propertyId}`);
      return;
    }

    const finalData = {
      ...data,
      tenantId: finalTenantId,
      agencyId: data.agencyId || currentUser?.agencyId,
      organizationId: data.organizationId || currentUser?.organizationId,
      manualTenant: undefined
    };

    try {
      await finalizeInspection(data.id, finalData as any);
      toast.success(t('inspection.toastSuccessFinalize'));
      router.push(`/dashboard/properties/${data.propertyId}`);
    } catch (err) {
      console.error("Finalization error:", err);
      toast.error(t('inspection.toastErrorFinalize'));
    }
  };

  const handleExportPDF = async () => {
    const data = methods.getValues();
    if (!data.signatures?.tenant?.drawData && !data.signatures?.inspector?.drawData) {
      if (!confirm(t('inspection.draftConfirm'))) {
        return;
      }
    }

    setIsExporting(true);
    toast.info(t('inspection.toastPreparingHD'));

    try {
      const enrichedData = JSON.parse(JSON.stringify(data));

      for (const room of enrichedData.rooms || []) {
        for (const item of room.items || []) {
          for (const photo of item.photos || []) {
            if (photo.hasFullRes) {
              const hdData = await PhotoBlobStorage.getPhotoHD(photo.id);
              if (hdData) {
                photo.fullResBase64 = hdData;
              }
            }
          }
        }
      }

      setPdfData(enrichedData);
      await new Promise(resolve => setTimeout(resolve, 1500));

      const safeTenantName = data.id.slice(0, 8);
      const fileName = `Rapport_${safeTenantName}_${data.date.replace(/\//g, '-')}.pdf`;

      await generatePDF('inspection-report-pdf', fileName, enrichedData, t, language);
      toast.success(t('inspection.toastSuccessPDF'));
    } catch (error) {
      console.error("Export PDF Error:", error);
      toast.error(t('inspection.toastErrorPDF'));
    } finally {
      setIsExporting(false);
      setPdfData(null);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="max-w-5xl mx-auto pb-32 min-h-screen bg-slate-950">
        <div className="sticky top-4 z-40 flex justify-between items-center bg-slate-900/50 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border border-white/5 mb-8 mx-2">
          <div className="flex items-center gap-4">
            <div className={`${isTemplateMode ? 'bg-emerald-600' : 'bg-blue-600'} p-2.5 rounded-xl text-white shadow-lg`}>
              {isTemplateMode ? <LayoutGrid size={20} /> : <Save size={20} />}
            </div>
            <div>
              <p className={`text-[10px] ${isTemplateMode ? 'text-emerald-400' : 'text-blue-400'} font-bold uppercase tracking-[0.2em]`}>Étape {currentStep + 1} sur {steps.length}</p>
              <h1 className="text-lg font-bold text-white tracking-tight">
                {steps[currentStep].label}
              </h1>
            </div>
          </div>

          <div className="flex gap-3">
            {!isTemplateMode && isFinalized && (
              <button
                type="button"
                disabled={isExporting}
                onClick={handleExportPDF}
                className="px-4 py-2 text-sm font-semibold text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl transition-all flex items-center gap-2"
              >
                {isExporting ? <Loader2 size={18} className="animate-spin" /> : <FileDown size={18} />}
                <span className="hidden md:inline">{t('inspection.exportBtn')}</span>
              </button>
            )}

            {(isTemplateMode || (currentStep === steps.length - 1 && !initialData?.isFinalized)) && (
              <button
                type="submit"
                disabled={isTemplateMode ? false : !canFinalize}
                className={`flex items-center gap-2 px-6 py-2 ${isTemplateMode ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-blue-600 hover:bg-blue-500'} text-white rounded-xl font-bold shadow-lg transition-all active:scale-95 disabled:opacity-40`}
              >
                {isTemplateMode ? <Save size={18} /> : <CheckCircle2 size={18} />}
                <span>{isTemplateMode ? t('inspection.saveBtn') : t('inspection.finalizeBtn')}</span>
              </button>
            )}
          </div>
        </div>

        <Stepper currentStep={currentStep} steps={steps} />

        <div className="space-y-4 px-2 relative min-h-[400px]">
          {currentStep === 0 && (
            <fieldset disabled={isLocked} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {isTemplateMode && (
                <div className="mb-6 p-6 bg-slate-900/40 border border-emerald-500/20 rounded-3xl backdrop-blur-sm shadow-xl shadow-emerald-500/5">
                  <label className="block text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-3">{t('inspection.templateName')}</label>
                  <div className="relative group">
                    <LayoutGrid className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500/50 group-focus-within:text-emerald-400 transition-colors" size={20} />
                    <input
                      type="text"
                      placeholder={t('inspection.templateNamePlaceholder')}
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-semibold"
                    />
                  </div>
                </div>
              )}
              {!isTemplateMode && <HeaderSection />}
              <CounterSection isTemplateMode={isTemplateMode} />
            </fieldset>
          )}

          {currentStep === 1 && (
            <fieldset disabled={isLocked} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <RoomSection />
              {isTemplateMode && (
                <div className="mt-8 border-t border-white/5 pt-8">
                  <KeyInventorySection />
                </div>
              )}
            </fieldset>
          )}

          {!isTemplateMode && currentStep === 2 && (
            <fieldset disabled={isLocked} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <KeyInventorySection />
              <div className="bg-slate-900/40 p-6 rounded-3xl border border-white/5 mx-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">{t('inspection.generalObservations')}</label>
                <textarea
                  {...methods.register('generalObservations' as any)}
                  rows={6}
                  placeholder={t('inspection.generalObservationsPlaceholder')}
                  className="w-full bg-slate-950/50 border border-white/10 rounded-2xl p-4 text-sm text-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
              </div>
            </fieldset>
          )}

          {!isTemplateMode && currentStep === 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <SignatureSection />
            </div>
          )}
        </div>

        <div className="fixed bottom-0 inset-x-0 bg-slate-950/80 backdrop-blur-xl border-t border-white/5 p-4 z-50">
          <div className="max-w-5xl mx-auto flex justify-between gap-4">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex-1 max-w-[200px] flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-white/5 border border-white/10 text-slate-400 font-bold hover:bg-white/10 hover:text-white transition-all disabled:opacity-20 disabled:cursor-not-allowed active:scale-95"
            >
              <ArrowLeft size={20} />
              <span>{t('inspection.prevBtn')}</span>
            </button>
 
            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex-1 max-w-[400px] flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-500 shadow-xl shadow-blue-600/20 transition-all active:scale-95"
              >
                <span>{t('inspection.nextBtn')}</span>
                <ArrowRight size={20} />
              </button>
            ) : (
              <div className="flex-1 max-w-[400px]" />
            )}
          </div>
        </div>

        {Object.keys(formErrors).length > 0 && (
          <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-4 mx-2">
            <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={20} />
            <p className="text-red-400 text-xs font-semibold">{t('inspection.alertErrors')}</p>
          </div>
        )}

        <div style={{ position: 'fixed', top: 0, left: 0, opacity: 0, pointerEvents: 'none', zIndex: -100 }}>
          <PDFTemplate data={pdfData || methods.getValues()} />
        </div>
      </form>
    </FormProvider>
  );
};
