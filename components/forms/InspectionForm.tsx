'use client';

import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { InspectionReportSchema, InspectionFormData, PropertyTemplateSchema } from '@/lib/validations/inspection';
import { HeaderSection } from './sections/HeaderSection';
import { CounterSection } from './sections/CounterSection';
import { RoomSection } from './sections/RoomSection';
import { SignatureSection } from './sections/SignatureSection';
import { Save, Send, AlertCircle, FileDown, Loader2, LayoutGrid } from 'lucide-react';
import { useInspectionStore } from '@/store/useInspectionStore';
import { usePropertyStore } from '@/store/usePropertyStore';
import { generatePDF } from '@/lib/utils/generate-pdf';
import { PDFTemplate } from '../pdf/PDFTemplate';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  initialData?: Partial<InspectionFormData>;
  isTemplateMode?: boolean;
}

export const InspectionForm: React.FC<Props> = ({ initialData, isTemplateMode = false }) => {
  const finalizeInspection = useInspectionStore((state) => state.finalizeInspection);
  const addTemplate = usePropertyStore((state) => state.addTemplate);
  const [isExporting, setIsExporting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  React.useEffect(() => {
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

  const { isValid } = methods.formState;
  const isFinalized = methods.watch('isFinalized');
  const tenantSig = methods.watch('signatures.tenant');
  const inspectorSig = methods.watch('signatures.inspector');

  const bothSignaturesPresent = !!tenantSig?.drawData && !!inspectorSig?.drawData;
  const isLocked = isFinalized || !!tenantSig?.drawData || !!inspectorSig?.drawData;
  const canFinalize = isValid && bothSignaturesPresent && isFinalized;

  const onSubmit = (data: InspectionFormData) => {
    if (isTemplateMode) {
      const templateData = {
        id: crypto.randomUUID(),
        propertyId: data.propertyId,
        name: `Template ${new Date().toLocaleDateString()}`,
        rooms: data.rooms,
        keyInventories: data.keyInventories
      };
      addTemplate(templateData);
      alert("Template enregistré avec succès !");
      router.push(`/dashboard/properties/${data.propertyId}`);
      return;
    }

    finalizeInspection(data.id, data as any);
    alert("Rapport finalisé et enregistré avec succès !");
    router.push(`/dashboard/properties/${data.propertyId}`);
  };

  const handleExportPDF = async () => {
    const data = methods.getValues();
    
    // Vérification minimale des signatures
    if (!data.signatures.tenant.drawData && !data.signatures.inspector.drawData) {
      if (!confirm("Le rapport n'est pas encore signé. Souhaitez-vous quand même exporter un brouillon ?")) {
        return;
      }
    }

    setIsExporting(true);
    try {
      // Un court délai pour s'assurer que le DOM du template est prêt si besoin
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Sanitisation robuste du nom de fichier
      const safeTenantName = data.tenantName
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Supprime les accents
        .replace(/[^a-z0-9]/gi, '_') // Remplace tout ce qui n'est pas alphanumérique par _
        .toLowerCase();
      
      const fileName = `Rapport_${safeTenantName}_${data.date.replace(/\//g, '-')}.pdf`;
      console.log("Lancement du téléchargement PDF :", fileName);
      
      await generatePDF('inspection-report-pdf', fileName);
    } catch (error) {
      console.error("Erreur lors de l'export PDF:", error);
      alert("Une erreur est survenue lors de la génération du PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  if (!mounted) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-500" size={40} />
    </div>;
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="max-w-5xl mx-auto pb-24 min-h-screen bg-slate-950">
        {/* Barre d'Action Supérieure */}
        <div className="sticky top-4 z-20 flex justify-between items-center bg-slate-900/50 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border border-white/5 mb-10 mx-2 transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className={`${isTemplateMode ? 'bg-emerald-600' : 'bg-blue-600'} p-2.5 rounded-xl text-white shadow-lg ${isTemplateMode ? 'shadow-emerald-500/20' : 'shadow-blue-500/20'}`}>
              {isTemplateMode ? <LayoutGrid size={20} /> : <Save size={20} />}
            </div>
            <div>
              <p className={`text-[10px] ${isTemplateMode ? 'text-emerald-400' : 'text-blue-400'} font-bold uppercase tracking-[0.2em]`}>VestaCheck</p>
              <h1 className="text-xl font-bold text-white tracking-tight">
                {isTemplateMode ? "Configuration du Template" : "Rapport d'Inspection"}
              </h1>
            </div>
          </div>
          
          <div className="flex gap-3">
            {!isTemplateMode && isFinalized && (
              <button
                type="button"
                disabled={isExporting}
                onClick={handleExportPDF}
                className="px-4 py-2 text-sm font-semibold text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 rounded-xl transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isExporting ? <Loader2 size={18} className="animate-spin" /> : <FileDown size={18} />}
                <span className="hidden md:inline">Exporter PDF</span>
              </button>
            )}
            
            <button
              type="submit"
              disabled={isTemplateMode ? false : !canFinalize}
              className={`flex items-center gap-2 px-6 py-2 ${isTemplateMode ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'} text-white rounded-xl font-bold shadow-lg transition-all active:scale-95 border border-white/10 disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {isTemplateMode ? <Save size={18} /> : <Send size={18} />} 
              <span>{isTemplateMode ? "Enregistrer le Template" : "Finaliser"}</span>
            </button>
          </div>
        </div>

        {/* Sections du Formulaire */}
        <div className="space-y-4 px-2 relative">
          <fieldset disabled={isLocked} className="space-y-4 relative group/locked">
            {isLocked && !isTemplateMode && (
              <div className="absolute inset-x-0 -inset-y-2 z-10 pointer-events-none rounded-2xl border-2 border-amber-500/20 bg-slate-950/20 backdrop-blur-[0.5px] transition-all" />
            )}
            
            {!isTemplateMode && <HeaderSection />}
            
            <CounterSection isTemplateMode={isTemplateMode} />
            
            <RoomSection />
          </fieldset>
          
          {!isTemplateMode && <SignatureSection />}
        </div>

        {/* Resume des Erreurs Globales */}
        {Object.keys(methods.formState.errors).length > 0 && (
          <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-4 mx-2">
            <div className="bg-red-500/20 p-2 rounded-lg">
              <AlertCircle className="text-red-400 shrink-0" size={20} />
            </div>
            <div>
              <p className="text-red-400 font-bold text-sm">Des erreurs subsistent dans le formulaire :</p>
              <ul className="list-disc list-inside text-red-400/80 text-xs mt-1.5 space-y-1">
                {!isTemplateMode && methods.formState.errors.propertyAddress && <li>Adresse manquante ou trop courte</li>}
                {!isTemplateMode && methods.formState.errors.tenantName && <li>Nom du locataire requis</li>}
                {!isTemplateMode && methods.formState.errors.counters && <li>Index de compteurs non valides</li>}
                {methods.formState.errors.keyInventories && <li>Inventaire des clés requis</li>}
                {methods.formState.errors.rooms && <li>Configurez au moins une pièce</li>}
              </ul>
            </div>
          </div>
        )}

        {/* Template PDF (Caché mais présent pour html2canvas) */}
        <div style={{ position: 'fixed', top: 0, left: 0, opacity: 0, pointerEvents: 'none', zIndex: -100 }}>
           <PDFTemplate data={methods.watch()} />
        </div>
      </form>
    </FormProvider>
  );
};
