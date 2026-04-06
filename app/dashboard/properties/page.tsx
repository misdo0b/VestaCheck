'use client';

import React, { useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { usePropertyStore } from '@/store/usePropertyStore';
import { useInspectionStore } from '@/store/useInspectionStore';
import { PropertyCard } from '@/components/properties/PropertyCard';
import { PropertyListItem } from '@/components/properties/PropertyListItem';
import { PropertyModal } from '@/components/properties/PropertyModal';
import { Plus, Search, Building2, Filter, LayoutGrid, List, X, SlidersHorizontal } from 'lucide-react';

export default function PropertiesPage() {
  const { data: session } = useSession();
  const { properties } = usePropertyStore();
  const { inspections } = useInspectionStore();
  
  const user = session?.user as any;
  const userRole = user?.role;
  const userId = user?.id;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // New States
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all', // 'all', 'occupied', 'vacant'
    type: 'all',   // 'all', 'Appartement', 'Maison'
    minSurface: '',
    minRooms: '',
  });

  const getLastInspection = (propertyId: string) => {
    return inspections
      .filter(i => i.propertyId === propertyId && i.isFinalized)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  };

  const filteredProperties = useMemo(() => {
    // 1. Isolation par rôle
    let baseProperties = properties;

    if (userRole === 'Agent') {
      baseProperties = properties.filter(p => p.agentId === userId);
    } else if (userRole === 'Propriétaire') {
      baseProperties = properties.filter(p => p.ownerId === userId);
    }
    // Administrateur voit tout (pas de filtre)

    // 2. Filtres UI
    return baseProperties.filter(p => {
      const lastInspection = getLastInspection(p.id);
      const isOccupied = lastInspection ? lastInspection.type === 'Entrée' : false;
      
      // Text Search
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           p.address.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Status Filter
      const matchesStatus = filters.status === 'all' || 
                           (filters.status === 'occupied' && isOccupied) ||
                           (filters.status === 'vacant' && !isOccupied);
      
      // Type Filter
      const matchesType = filters.type === 'all' || p.type === filters.type;
      
      // Surface Filter
      const matchesSurface = !filters.minSurface || p.surface >= Number(filters.minSurface);
      
      // Rooms Filter
      const matchesRooms = !filters.minRooms || p.roomCount >= Number(filters.minRooms);

      return matchesSearch && matchesStatus && matchesType && matchesSurface && matchesRooms;
    });
  }, [properties, userRole, userId, searchQuery, filters, inspections]);

  const resetFilters = () => {
    setFilters({
      status: 'all',
      type: 'all',
      minSurface: '',
      minRooms: '',
    });
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-extrabold text-white mb-2 flex items-center gap-3">
              <div className="p-2 bg-blue-600/20 rounded-xl border border-blue-600/30">
                <Building2 className="w-8 h-8 text-blue-500" />
              </div>
              Parc Immobilier
            </h1>
            <p className="text-slate-400">Gérez vos biens et consultez leur historique d'occupation.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-2xl shadow-blue-600/20 active:scale-95"
          >
            <Plus className="w-6 h-6" />
            Nouveau Bien
          </button>
        </div>

        {/* Toolbar */}
        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-4 mb-6 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                type="text"
                placeholder="Rechercher un bien, une adresse..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-white focus:border-blue-500/50 focus:bg-slate-900 outline-none transition-all placeholder:text-slate-600"
              />
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto">
              {/* Filter Toggle */}
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-medium transition-all border ${
                  isFilterOpen 
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' 
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                <Filter className={`w-4 h-4 ${isFilterOpen ? 'fill-current' : ''}`} />
                <span>Filtres</span>
                {(filters.status !== 'all' || filters.type !== 'all' || filters.minSurface || filters.minRooms) && (
                  <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse ml-1" />
                )}
              </button>

              <div className="h-8 w-[1px] bg-white/10 hidden lg:block mx-1" />

              {/* View Toggle */}
              <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-white/10 shadow-inner">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-2.5 rounded-xl transition-all ${
                    viewMode === 'grid' 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title="Vue Grille"
                >
                  <LayoutGrid className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-2.5 rounded-xl transition-all ${
                    viewMode === 'list' 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title="Vue Liste"
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Advanced Filter Panel */}
          {isFilterOpen && (
            <div className="pt-4 border-t border-white/5 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">Statut d'occupation</label>
                  <select 
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500/50 transition-colors"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="occupied">Occupé</option>
                    <option value="vacant">Vacant</option>
                  </select>
                </div>

                {/* Property Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">Type de bien</label>
                  <select 
                    value={filters.type}
                    onChange={(e) => setFilters({...filters, type: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500/50 transition-colors"
                  >
                    <option value="all">Tous les types</option>
                    <option value="Appartement">Appartement</option>
                    <option value="Maison">Maison</option>
                  </select>
                </div>

                {/* Min Surface */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">Surface Min (m²)</label>
                  <input 
                    type="number"
                    value={filters.minSurface}
                    onChange={(e) => setFilters({...filters, minSurface: e.target.value})}
                    placeholder="Ex: 50"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500/50 transition-colors"
                  />
                </div>

                {/* Min Rooms */}
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">Nb. Pièces Min</label>
                    <input 
                      type="number"
                      value={filters.minRooms}
                      onChange={(e) => setFilters({...filters, minRooms: e.target.value})}
                      placeholder="Ex: 3"
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500/50 transition-colors"
                    />
                  </div>
                  <button 
                    onClick={resetFilters}
                    className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:bg-white/10 hover:text-white transition-all"
                    title="Réinitialiser"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* List/Grid Content */}
        {filteredProperties.length > 0 ? (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500" 
            : "flex flex-col gap-4 animate-in fade-in duration-500"
          }>
            {filteredProperties.map(property => (
              viewMode === 'grid' ? (
                <PropertyCard 
                  key={property.id} 
                  property={property} 
                  lastInspection={getLastInspection(property.id)}
                />
              ) : (
                <PropertyListItem 
                  key={property.id} 
                  property={property} 
                  lastInspection={getLastInspection(property.id)}
                />
              )
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-slate-900/20 border border-dashed border-white/10 rounded-[40px] backdrop-blur-sm">
            <div className="w-20 h-20 bg-slate-900 border border-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
              <Building2 className="w-10 h-10 text-slate-700" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Aucun bien trouvé</h3>
            <p className="text-slate-500 max-w-sm mx-auto">
              Nous n'avons trouvé aucun bien correspondant à vos critères actuels. 
              Essayez de réinitialiser les filtres ou d'ajouter un nouveau bien.
            </p>
            <button 
              onClick={resetFilters}
              className="mt-8 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-slate-300 hover:bg-white/10 transition-all font-medium"
            >
              Effacer tous les filtres
            </button>
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
