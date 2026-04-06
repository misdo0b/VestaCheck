'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { usePropertyStore } from '@/store/usePropertyStore';
import { InspectionForm } from '@/components/forms/InspectionForm';
import { ArrowLeft, LayoutGrid } from 'lucide-react';

function NewTemplateForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const propertyId = searchParams.get('propertyId');
  const templateId = searchParams.get('templateId');
  const { properties, templates } = usePropertyStore();
  
  const property = properties.find(p => p.id === propertyId);
  const existingTemplate = templateId ? templates.find(t => t.id === templateId) : null;

  if (!propertyId || !property) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <h1 className="text-xl font-bold text-white mb-4">Aucun bien sélectionné</h1>
        <button onClick={() => router.push('/dashboard/properties')} className="text-blue-400 hover:underline">Retour aux biens</button>
      </div>
    );
  }

  const initialData = existingTemplate ? {
    propertyId: property.id,
    propertyAddress: property.address,
    ownerId: property.ownerId,
    templateName: existingTemplate.name,
    rooms: existingTemplate.rooms,
    keyInventories: existingTemplate.keyInventories || []
  } : {
    propertyId: property.id,
    propertyAddress: property.address,
    ownerId: property.ownerId,
    rooms: [
      {
        id: 'initial_room_1',
        name: '', 
        items: [
          { id: 'initial_item_1', label: 'Murs', condition: 'Bon' as const, comment: '', photos: [] },
          { id: 'initial_item_2', label: 'Sols', condition: 'Bon' as const, comment: '', photos: [] }
        ]
      }
    ]
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-5xl mx-auto px-4 pt-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-white/5 rounded-lg border border-white/10 transition-colors text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">
              {templateId ? 'Modifier le Template' : 'Nouveau Template'}
            </h1>
            <p className="text-xs text-blue-400 font-semibold">{property.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full text-xs font-bold ring-1 ring-emerald-400/20">
          <LayoutGrid size={14} />
          MODE TEMPLATE
        </div>
      </div>
      
      <div className="mt-8">
        <InspectionForm 
          initialData={initialData as any} 
          isTemplateMode={true} 
          templateId={templateId || undefined} 
        />
      </div>
    </div>
  );
}

export default function NewTemplatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Chargement du configurateur...</div>}>
      <NewTemplateForm />
    </Suspense>
  );
}
