'use client';

import React, { useState } from 'react';
import { usePropertyStore } from '@/store/usePropertyStore';
import { useInspectionStore } from '@/store/useInspectionStore';
import { PropertyCard } from '@/components/properties/PropertyCard';
import { PropertyModal } from '@/components/properties/PropertyModal';
import { Plus, Search, Building2, Filter, LayoutGrid, List } from 'lucide-react';

export default function PropertiesPage() {
  const { properties } = usePropertyStore();
  const { inspections } = useInspectionStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProperties = properties.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getLastInspection = (propertyId: string) => {
    return inspections
      .filter(i => i.propertyId === propertyId && i.isFinalized)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
              <Building2 className="w-8 h-8 text-blue-500" />
              Parc Immobilier
            </h1>
            <p className="text-slate-400">Gérez vos biens et consultez leur historique d'occupation.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-5 h-5" />
            Nouveau Bien
          </button>
        </div>

        {/* Toolbar */}
        <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between backdrop-blur-xl">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-3 w-5 h-5 text-slate-500" />
            <input 
              type="text"
              placeholder="Rechercher un bien, une adresse..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:border-blue-500 outline-none transition-colors"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-300 hover:bg-white/10 transition-colors">
              <Filter className="w-4 h-4" />
              <span>Filtres</span>
            </button>
            <div className="h-10 w-[1px] bg-white/10 hidden md:block mx-2" />
            <div className="flex bg-slate-950 p-1 rounded-lg border border-white/10">
              <button className="p-2 bg-blue-600 rounded-md text-white shadow-sm">
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button className="p-2 text-slate-500 hover:text-slate-300 transition-colors">
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Grid */}
        {filteredProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map(property => (
              <PropertyCard 
                key={property.id} 
                property={property} 
                lastInspection={getLastInspection(property.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-900/50 border border-dashed border-white/10 rounded-3xl">
            <Building2 className="w-16 h-16 text-slate-700 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-1">Aucun bien trouvé</h3>
            <p className="text-slate-500">Essayez de modifier vos critères de recherche ou ajoutez un nouveau bien.</p>
          </div>
        )}
      </div>

      <PropertyModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
