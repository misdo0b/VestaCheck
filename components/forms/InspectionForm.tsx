import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { InspectionReportSchema, InspectionFormData, PropertyTemplateSchema } from '@/lib/validations/inspection';
import { HeaderSection } from './sections/HeaderSection';
import { CounterSection } from './sections/CounterSection';
import { RoomSection } from './sections/RoomSection';
import { KeyInventorySection } from './sections/KeyInventorySection';
import { SignatureSection } from './sections/SignatureSection';
import { Stepper } from './Stepper';
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
import { PhotoBlobStorage } from '@/lib/utils/blob-storage';
import { generatePDF } from '@/lib/utils/generate-pdf';
import { PDFTemplate } from '../pdf/PDFTemplate';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface Props {
  initialData?: Partial<InspectionFormData> & { templateName?: string };
  isTemplateMode?: boolean;
  templateId?: string;
}

export const InspectionForm: React.FC<Props> = ({ initialData, isTemplateMode = false, templateId }) => {
  const finalizeInspection = useInspectionStore((state) => state.finalizeInspection);
  const addTemplate = usePropertyStore((state) => state.addTemplate);
  const updateTemplate = usePropertyStore((state) => state.updateTemplate);
  const [templateName, setTemplateName] = useState(initialData?.templateName || '');
  const [isExporting, setIsExporting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [pdfData, setPdfData] = useState<InspectionFormData | null>(null);
  const router = useRouter();

  // Définition des étapes selon le mode
  const steps = isTemplateMode 
    ? [
        { id: 1, label: 'Configuration' },
        { id: 2, label: 'Structure & Clés' }
      ]
    : [
        { id: 1, label: 'Synthèse' },
        { id: 2, label: 'Pièces & État' },
        { id: 3, label: 'Clés & Accès' },
        { id: 4, label: 'Signatures' }
      ];

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const methods = useForm<InspectionFormData>({
    resolver: zodResolver(isTemplateMode ? PropertyTemplateSchema : InspectionReportSchema) as any,
    defaultValues: {
      id: initialData?.id || crypto.randomUUID(),
      propertyId: (initialData as any)?.propertyId || 'prop1',
      date: initialData?.date || new Date().toISOString().split('T')[0],
      type: initialData?.type || 'Entrée',
      propertyAddress: initialData?.propertyAddress || '',
      tenantName: initialData?.tenantName || '',
      tenantEmail: initialData?.tenantEmail || '',
      tenantPhone: initialData?.tenantPhone || '',
      ownerId: initialData?.ownerId || 'owner1',
      inspectorId: initialData?.inspectorId || 'agent1',
      counters: initialData?.counters || { water: 0, electricity: 0, gas: 0 },
      keyInventories: initialData?.keyInventories || [
        { id: crypto.randomUUID(), type: 'Clés du logement', count: 2 }
      ],
      signatures: initialData?.signatures || {
        tenant: { type: 'Aucune' },
        inspector: { type: 'Aucune' }
      },
      generalObservations: initialData?.generalObservations || '',
      rooms: (initialData?.rooms as any) || [
        {
          id: crypto.randomUUID(),
          name: 'Salon',
          items: [
            { id: crypto.randomUUID(), label: 'Murs', condition: 'Bon', comment: '', photos: [] },
            { id: crypto.randomUUID(), label: 'Sols', condition: 'Bon', comment: '', photos: [] }
          ]
        }
      ],
      isFinalized: initialData?.isFinalized || false,
    },
    mode: 'onTouched'
  });

  const { isValid, errors: formErrors } = methods.formState;
  const isFinalized = methods.watch('isFinalized');
  const tenantSig = methods.watch('signatures.tenant');
  const inspectorSig = methods.watch('signatures.inspector');

  const bothSignaturesPresent = !!tenantSig?.drawData && !!inspectorSig?.drawData;
  const isLocked = isFinalized || !!tenantSig?.drawData || !!inspectorSig?.drawData;
  const canFinalize = isValid && bothSignaturesPresent && isFinalized;

  const nextStep = async () => {
    // Validation spécifique à l'étape avant de passer à la suivante
    let fieldsToValidate: any[] = [];
    if (isTemplateMode) {
      if (currentStep === 0) fieldsToValidate = ['counters'];
    } else {
      if (currentStep === 0) fieldsToValidate = ['propertyAddress', 'tenantName', 'tenantEmail', 'tenantPhone', 'counters'];
      if (currentStep === 1) fieldsToValidate = ['rooms'];
      if (currentStep === 2) fieldsToValidate = ['keyInventories'];
    }

    const isStepValid = await methods.trigger(fieldsToValidate);
    if (isStepValid) {
      setCurrentStep(s => Math.min(s + 1, steps.length - 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      toast.error("Veuillez corriger les erreurs avant de continuer.");
    }
  };

  const prevStep = () => {
    setCurrentStep(s => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSubmit = (data: InspectionFormData) => {
    if (isTemplateMode) {
      if (templateId) {
        updateTemplate(templateId, {
          name: templateName || `Template ${new Date().toLocaleDateString()}`,
          rooms: data.rooms,
          keyInventories: data.keyInventories
        });
        toast.success("Template mis à jour avec succès !");
      } else {
        const templateData = {
          id: crypto.randomUUID(),
          propertyId: data.propertyId,
          name: templateName || `Template ${new Date().toLocaleDateString()}`,
          rooms: data.rooms,
          keyInventories: data.keyInventories
        };
        addTemplate(templateData);
        toast.success("Template enregistré avec succès !");
      }
      router.push(`/dashboard/properties/${data.propertyId}`);
      return;
    }

    finalizeInspection(data.id, data as any);
    toast.success("Rapport finalisé et enregistré avec succès !");
    router.push(`/dashboard/properties/${data.propertyId}`);
  };

  const handleExportPDF = async () => {
    const data = methods.getValues();
    if (!data.signatures.tenant.drawData && !data.signatures.inspector.drawData) {
      if (!confirm("Le rapport n'est pas encore signé. Souhaitez-vous quand même exporter un brouillon ?")) {
        return;
      }
    }

    setIsExporting(true);
    toast.info("Préparation des photos HD... Veuillez patienter.");

    try {
      // 1. Ré-hydratation des photos HD
      const enrichedData = JSON.parse(JSON.stringify(data)); // Clone profond
      
      for (const room of enrichedData.rooms) {
        for (const item of room.items) {
          for (const photo of item.photos) {
            if (photo.hasFullRes) {
              const hdData = await PhotoBlobStorage.getPhotoHD(photo.id);
              if (hdData) {
                photo.fullResBase64 = hdData; // Injection temporaire pour le PDF
              }
            }
          }
        }
      }

      // Mettre à jour les données pour le template PDF
      setPdfData(enrichedData);
 
      // Un court délai pour laisser React mettre à jour le DOM caché avec les images HD
      await new Promise(resolve => setTimeout(resolve, 1500));

      const safeTenantName = data.tenantName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const fileName = `Rapport_${safeTenantName}_${data.date.replace(/\//g, '-')}.pdf`;
      
      await generatePDF('inspection-report-pdf', fileName);
      toast.success("PDF HD généré avec succès !");
    } catch (error) {
      console.error("Export PDF Error:", error);
      toast.error("Erreur lors de la génération du PDF.");
    } finally {
      setIsExporting(false);
      setPdfData(null); // Nettoyage immédiat pour libérer la RAM
    }
  };

  if (!mounted) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-500" size={40} />
    </div>;
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="max-w-5xl mx-auto pb-32 min-h-screen bg-slate-950">
        {/* Barre d'Action Supérieure */}
        <div className="sticky top-4 z-40 flex justify-between items-center bg-slate-900/50 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border border-white/5 mb-8 mx-2 transition-all duration-300">
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
                <span className="hidden md:inline">Exporter</span>
              </button>
            )}
            
            {/* Bouton Sauvegarder/Finaliser (Toujours visible en mode Template, ou à la fin en mode normal) */}
            {(isTemplateMode || currentStep === steps.length - 1) && (
              <button
                type="submit"
                disabled={isTemplateMode ? false : !canFinalize}
                className={`flex items-center gap-2 px-6 py-2 ${isTemplateMode ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-blue-600 hover:bg-blue-500'} text-white rounded-xl font-bold shadow-lg transition-all active:scale-95 disabled:opacity-40`}
              >
                {isTemplateMode ? <Save size={18} /> : <CheckCircle2 size={18} />} 
                <span>{isTemplateMode ? "Enregistrer" : "Finaliser"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Stepper Visuel */}
        <Stepper currentStep={currentStep} steps={steps} />

        {/* Contenu de l'étape */}
        <div className="space-y-4 px-2 relative min-h-[400px]">
            {/* Étape 0: Général & Compteurs */}
            {currentStep === 0 && (
              <fieldset disabled={isLocked} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {isTemplateMode && (
                  <div className="mb-6 p-6 bg-slate-900/40 border border-emerald-500/20 rounded-3xl backdrop-blur-sm shadow-xl shadow-emerald-500/5">
                    <label className="block text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-3">Nom du Template</label>
                    <div className="relative group">
                      <LayoutGrid className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500/50 group-focus-within:text-emerald-400 transition-colors" size={20} />
                      <input 
                        type="text"
                        placeholder="Ex: Configuration Standard Studio..."
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

            {/* Étape 1 (Normal) / Étape 1 (Template): Pièces */}
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

            {/* Étape 2 (Normal): Clés & Inventaire */}
            {!isTemplateMode && currentStep === 2 && (
              <fieldset disabled={isLocked} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <KeyInventorySection />
                <div className="bg-slate-900/40 p-6 rounded-3xl border border-white/5 mx-2">
                   <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Observations Générales</label>
                   <textarea 
                     {...methods.register('generalObservations')}
                     rows={6}
                     placeholder="Ajoutez ici des commentaires globaux sur l'état du logement..."
                     className="w-full bg-slate-950/50 border border-white/10 rounded-2xl p-4 text-sm text-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                   />
                </div>
              </fieldset>
            )}

            {/* Étape 3 (Normal): Signatures - JAMAIS DISABLÉ PAR FIELDSET pour permettre la 2ème signature */}
            {!isTemplateMode && currentStep === 3 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <SignatureSection />
              </div>
            )}
        </div>

        {/* Navigation Stepper (Footer) */}
        <div className="fixed bottom-0 inset-x-0 bg-slate-950/80 backdrop-blur-xl border-t border-white/5 p-4 z-50">
          <div className="max-w-5xl mx-auto flex justify-between gap-4">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex-1 max-w-[200px] flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-white/5 border border-white/10 text-slate-400 font-bold hover:bg-white/10 hover:text-white transition-all disabled:opacity-20 disabled:cursor-not-allowed active:scale-95"
            >
              <ArrowLeft size={20} />
              <span>Précédent</span>
            </button>
            
            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex-1 max-w-[400px] flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-500 shadow-xl shadow-blue-600/20 transition-all active:scale-95"
              >
                <span>Étape Suivante</span>
                <ArrowRight size={20} />
              </button>
            ) : (
              <div className="flex-1 max-w-[400px]" /> /* Espaceur pour l'equilibre visuel */
            )}
          </div>
        </div>

        {/* Erreurs de l'étape actuelle */}
        {Object.keys(formErrors).length > 0 && (
          <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-4 mx-2">
            <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={20} />
            <p className="text-red-400 text-xs font-semibold">Certains champs de cette étape nécessitent votre attention.</p>
          </div>
        )}

        {/* Template PDF (Caché) */}
        <div style={{ position: 'fixed', top: 0, left: 0, opacity: 0, pointerEvents: 'none', zIndex: -100 }}>
           <PDFTemplate data={pdfData || methods.watch()} />
        </div>
      </form>
    </FormProvider>
  );
};
