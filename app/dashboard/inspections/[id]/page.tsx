'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useInspectionStore } from '@/store/useInspectionStore';
import { InspectionForm } from '@/components/forms/InspectionForm';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

export default function InspectionDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { inspections, loading } = useInspectionStore();

  const inspection = inspections.find(i => i.id === id);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="bg-red-500/10 p-6 rounded-3xl border border-red-500/20 flex flex-col items-center gap-4 max-w-md text-center">
          <AlertCircle className="text-red-400 w-12 h-12" />
          <h1 className="text-xl font-bold text-white">État des lieux introuvable</h1>
          <p className="text-slate-400 text-sm">L'identifiant spécifié ne correspond à aucun rapport dans votre base de données locale.</p>
          <button 
            onClick={() => router.back()} 
            className="mt-2 px-6 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Petit fil d'Ariane ou bouton retour spécifique au mode consultation */}
      <div className="max-w-5xl mx-auto px-4 pt-6">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
        >
          <ArrowLeft size={14} /> Retour au bien
        </button>
      </div>

      <div className="mt-4">
        <InspectionForm initialData={inspection as any} />
      </div>
    </div>
  );
}
