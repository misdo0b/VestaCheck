'use client';

import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { InspectionReportSchema, InspectionFormData } from '@/lib/validations/inspection';
import { HeaderSection } from './sections/HeaderSection';
import { CounterSection } from './sections/CounterSection';
import { RoomSection } from './sections/RoomSection';
import { SignatureSection } from './sections/SignatureSection';
import { Save, Send, AlertCircle, FileDown, Loader2 } from 'lucide-react';
import { useInspectionStore } from '@/store/useInspectionStore';
import { generatePDF } from '@/lib/utils/generate-pdf';
import { PDFTemplate } from '../pdf/PDFTemplate';
import { useState } from 'react';

interface Props {
  initialData?: Partial<InspectionFormData>;
}

export const InspectionForm: React.FC<Props> = ({ initialData }) => {
  const setCurrentInspection = useInspectionStore((state) => state.setCurrentInspection);
  const [isExporting, setIsExporting] = useState(false);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);
  
  const methods = useForm<InspectionFormData>({
    resolver: zodResolver(InspectionReportSchema) as any,
    defaultValues: {
      id: initialData?.id || crypto.randomUUID(),
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

  const onSubmit = (data: InspectionFormData) => {
    console.log("Données validées prêtes à l'envoi :", data);
    setCurrentInspection(data);
    alert("Rapport enregistré avec succès !");
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
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-600" size={40} />
    </div>;
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="max-w-5xl mx-auto pb-24">
        {/* Barre d'Action Supérieure */}
        <div className="sticky top-4 z-20 flex justify-between items-center bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-white/20 mb-10 mx-2">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <Save size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest">VestaCheck</p>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">Édition du Rapport</h1>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              type="button"
              disabled={isExporting}
              onClick={handleExportPDF}
              className="px-4 py-2 text-sm font-bold text-blue-600 bg-blue-50 border border-blue-100 hover:bg-blue-100 rounded-xl transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isExporting ? <Loader2 size={18} className="animate-spin" /> : <FileDown size={18} />}
              <span className="hidden md:inline">Exporter PDF</span>
            </button>
            <button
              type="button"
              onClick={() => console.log("Sauvegarde temporaire contextuelle")}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors hidden lg:block"
            >
              Brouillon
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-200 transition-all active:scale-95"
            >
              <Send size={18} /> Finaliser
            </button>
          </div>
        </div>

        {/* Sections du Formulaire */}
        <div className="space-y-4 px-2">
          <HeaderSection />
          <CounterSection />
          <RoomSection />
          <SignatureSection />
        </div>

        {/* Resume des Erreurs Globales */}
        {Object.keys(methods.formState.errors).length > 0 && (
          <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-red-800 font-bold text-sm">Des erreurs subsistent dans le formulaire :</p>
              <ul className="list-disc list-inside text-red-700 text-xs mt-1 space-y-1">
                {methods.formState.errors.propertyAddress && <li>Adresse manquante ou trop courte</li>}
                {methods.formState.errors.tenantName && <li>Nom du locataire requis</li>}
                {methods.formState.errors.counters && <li>Index de compteurs non valides</li>}
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
