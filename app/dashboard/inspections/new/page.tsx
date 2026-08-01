'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePropertyStore } from '@/store/usePropertyStore';
import { useInspectionStore } from '@/store/useInspectionStore';
import { InspectionForm } from '@/components/forms/InspectionForm';
import { ArrowLeft, LayoutGrid, FileText, Sparkles, ShieldAlert } from 'lucide-react';
import { PropertyTemplate } from '@/types';
import { cloneWithNewIds } from '@/lib/utils/mapping';
import { useTranslation } from '@/hooks/useTranslation';

function NewInspectionForm() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const propertyId = searchParams.get('propertyId');
  const { properties, getTemplatesByProperty } = usePropertyStore();
  
  const [selectedTemplate, setSelectedTemplate] = useState<PropertyTemplate | null>(null);
  const [showForm, setShowForm] = useState(false);

  const property = properties.find(p => p.id === propertyId);
  const templates = propertyId ? getTemplatesByProperty(propertyId) : [];

  const currentUser = session?.user as any;
  const userRole = currentUser?.role;
  const userId = currentUser?.id;

  const isAuthorized = !property || 
    userRole === 'Administrateur' || 
    (userRole === 'Agent' && property.agentId === userId) ||
    (userRole === 'Propriétaire' && property.ownerId === userId);

  if (!propertyId || !property || !isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <ShieldAlert className="w-16 h-16 text-slate-800 mb-4" />
        <h1 className="text-xl font-bold text-white mb-4">
          {!property ? t('newInspection.notFoundTitle') : t('newInspection.unauthorizedTitle')}
        </h1>
        <button onClick={() => router.push('/dashboard/properties')} className="text-blue-400 hover:underline">
          {t('newInspection.backToProperties')}
        </button>
      </div>
    );
  }

  const handleStartBlank = () => {
    setShowForm(true);
  };

  const handleStartWithTemplate = (template: PropertyTemplate) => {
    setSelectedTemplate(template);
    setShowForm(true);
  };

  if (showForm) {
    let initialData: any = {
      propertyId: property.id,
      propertyAddress: property.address,
      ownerId: property.ownerId,
      agencyId: property.agencyId,
      organizationId: property.organizationId,
    };

    if (selectedTemplate) {
      const cloned = cloneWithNewIds(selectedTemplate as any);
      initialData = {
        ...initialData,
        rooms: cloned.rooms,
        keyInventories: cloned.keyInventories
      };
    }

    return (
      <div className="min-h-screen bg-slate-950">
        <div className="max-w-5xl mx-auto px-4 pt-6">
          <button 
            onClick={() => setShowForm(false)}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('newInspection.backToChoice')}
          </button>
        </div>
        <InspectionForm initialData={initialData as any} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6">
      <div className="max-w-3xl mx-auto py-12">
        <header className="mb-12 text-center">
          <h1 className="text-3xl font-bold text-white mb-4">{t('newInspection.newInspectionTitle')}</h1>
          <p className="text-slate-400">{t('newInspection.forProperty')} <span className="text-blue-400 font-semibold">{property.name}</span></p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Option A: Blank */}
          <button 
            onClick={handleStartBlank}
            className="bg-slate-900/50 border border-white/5 p-8 rounded-3xl hover:border-blue-500/30 transition-all group text-left"
          >
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{t('newInspection.optionBlankTitle')}</h3>
            <p className="text-slate-400 text-sm">{t('newInspection.optionBlankDesc')}</p>
          </button>

          {/* Option B: Template */}
          <div className="bg-slate-900/50 border border-white/5 p-8 rounded-3xl backdrop-blur-xl flex flex-col">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6">
              <LayoutGrid className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{t('newInspection.optionTemplateTitle')}</h3>
            <p className="text-slate-400 text-sm mb-6">{t('newInspection.optionTemplateDesc')}</p>
            
            <div className="space-y-3 mt-auto">
              {templates.length > 0 ? (
                templates.map(tpl => (
                  <button 
                    key={tpl.id}
                    onClick={() => handleStartWithTemplate(tpl)}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all text-sm group"
                  >
                    <span className="text-slate-300 font-medium group-hover:text-emerald-400">{tpl.name}</span>
                    <Sparkles className="w-4 h-4 text-slate-600 group-hover:text-emerald-500" />
                  </button>
                ))
              ) : (
                <div className="text-slate-600 text-xs italic p-4 bg-white/5 border border-dashed border-white/5 rounded-xl">
                  {t('newInspection.noTemplatesAvailable')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewInspectionPage() {
  const { t } = useTranslation();
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">{t('newInspection.loading')}</div>}>
      <NewInspectionForm />
    </Suspense>
  );
}
