'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePropertyStore } from '@/store/usePropertyStore';
import { useInspectionStore } from '@/store/useInspectionStore';
import { 
  Building2, MapPin, Maximize, Layers, User, Calendar, 
  ArrowLeft, Edit3, Plus, FileText, CheckCircle2, Clock, ChevronRight
} from 'lucide-react';
import { PropertyModal } from '@/components/properties/PropertyModal';
import Link from 'next/link';

export default function PropertyDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { properties, templates, getTemplatesByProperty } = usePropertyStore();
  const { inspections } = useInspectionStore();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const property = properties.find(p => p.id === id);
  const propertyTemplates = id ? getTemplatesByProperty(id as string) : [];
  const propertyInspections = inspections
    .filter(i => i.propertyId === id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (!property) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <Building2 className="w-16 h-16 text-slate-800 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Bien non trouvé</h1>
        <button onClick={() => router.back()} className="text-blue-400 hover:underline">Retourner à la liste</button>
      </div>
    );
  }

  const lastInspection = propertyInspections[0];
  const isOccupied = lastInspection ? lastInspection.type === 'Entrée' : false;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Header */}
      <div className="bg-slate-900/50 border-b border-white/5 sticky top-0 z-40 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/dashboard/properties')}
              className="p-2 hover:bg-white/5 rounded-lg border border-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">{property.name}</h1>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Détails du bien</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              Modifier
            </button>
            <Link 
              href={`/dashboard/inspections/new?propertyId=${property.id}`}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-blue-600/20"
            >
              <Plus className="w-4 h-4" />
              Nouvel État
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-slate-900/40 border border-white/5 rounded-3xl p-8 backdrop-blur-sm">
              <div className="flex flex-wrap gap-6 mb-8 mt-2">
                <div className="flex-1 min-w-[140px] p-4 rounded-2xl bg-white/5 border border-white/5">
                  <div className="text-slate-500 text-xs mb-1 uppercase font-bold tracking-widest">Status</div>
                  <div className={`text-lg font-bold ${isOccupied ? 'text-green-400' : 'text-amber-400'}`}>
                    {isOccupied ? 'Occupé' : 'Vacant'}
                  </div>
                </div>
                <div className="flex-1 min-w-[140px] p-4 rounded-2xl bg-white/5 border border-white/5">
                  <div className="text-slate-500 text-xs mb-1 uppercase font-bold tracking-widest">Surface</div>
                  <div className="text-lg font-bold text-white">{property.surface} m²</div>
                </div>
                <div className="flex-1 min-w-[140px] p-4 rounded-2xl bg-white/5 border border-white/5">
                  <div className="text-slate-500 text-xs mb-1 uppercase font-bold tracking-widest">Pièces</div>
                  <div className="text-lg font-bold text-white">{property.roomCount} Pièces</div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">Adresse</h4>
                    <p className="text-lg text-white">{property.address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">Propriétaire</h4>
                    <p className="text-lg text-white">ID: {property.ownerId}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Timeline */}
            <section>
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Clock className="w-6 h-6 text-blue-500" />
                Historique des États des Lieux
              </h3>
              
              <div className="space-y-4">
                {propertyInspections.length > 0 ? (
                  propertyInspections.map((inspection, index) => (
                    <div key={inspection.id} className="relative pl-8 pb-4 group">
                      {/* Timeline line */}
                      {index !== propertyInspections.length - 1 && (
                        <div className="absolute left-[11px] top-6 bottom-0 w-[2px] bg-white/5 group-hover:bg-blue-500/20 transition-colors" />
                      )}
                      
                      {/* Dot */}
                      <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                        inspection.type === 'Entrée' 
                          ? 'border-green-500 bg-green-500/10' 
                          : 'border-red-500 bg-red-500/10'
                      } z-10`}>
                        <div className={`w-2 h-2 rounded-full ${
                          inspection.type === 'Entrée' ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                      </div>

                      <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              inspection.type === 'Entrée' 
                                ? 'bg-green-500/10 text-green-400' 
                                : 'bg-red-500/10 text-red-400'
                            }`}>
                              {inspection.type}
                            </span>
                            <span className="text-slate-500 text-sm flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(inspection.date).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                          {inspection.isFinalized ? (
                            <span className="text-green-500 flex items-center gap-1 text-xs">
                              <CheckCircle2 className="w-3 h-3" /> finalisé
                            </span>
                          ) : (
                            <span className="text-amber-500 flex items-center gap-1 text-xs font-medium">
                              En cours
                            </span>
                          )}
                        </div>
                        <h4 className="text-white font-semibold mb-1">Locataire: {inspection.tenantName}</h4>
                        <p className="text-slate-500 text-xs italic">Inspecteur: {inspection.inspectorId}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-slate-900/40 border border-dashed border-white/10 rounded-2xl p-8 text-center">
                    <FileText className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-500">Aucun état des lieux enregistré pour ce bien.</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar / Actions */}
          <div className="space-y-6">
            <div className="bg-blue-600 rounded-3xl p-6 shadow-xl shadow-blue-600/20">
              <h4 className="text-white font-bold mb-2">Prêt pour un état ?</h4>
              <p className="text-blue-100 text-sm mb-6">Utilisez un template existant ou commencez à blanc pour ce bien.</p>
              <Link 
                href={`/dashboard/inspections/new?propertyId=${property.id}`}
                className="w-full bg-white text-blue-600 rounded-xl py-3 font-bold hover:bg-blue-50 transition-colors shadow-lg flex items-center justify-center"
              >
                Démarrer l'inspection
              </Link>
            </div>

            <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6">
              <h4 className="text-white font-bold mb-4">Templates du bien</h4>
              <div className="space-y-3">
                {propertyTemplates.length > 0 ? (
                  propertyTemplates.map(template => (
                    <button key={template.id} className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-sm transition-colors text-left">
                      <div className="flex flex-col">
                        <span className="text-white font-medium">{template.name}</span>
                        <span className="text-[10px] text-slate-500 uppercase">{template.rooms.length} pièces configurées</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </button>
                  ))
                ) : (
                  <p className="text-slate-500 text-xs">Aucun template spécifique lié.</p>
                )}
                <Link 
                  href={`/dashboard/templates/new?propertyId=${property.id}`}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-white/10 text-slate-500 hover:text-slate-300 hover:border-white/20 text-xs transition-colors mt-4"
                >
                  <Plus className="w-3 h-3" /> Créer un template
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <PropertyModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        property={property}
      />
    </div>
  );
}
