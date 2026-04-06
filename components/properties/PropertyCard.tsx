'use client';

import React from 'react';
import { Property, InspectionReport } from '@/types';
import { Home, MapPin, Maximize, Layers, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface PropertyCardProps {
  property: Property;
  lastInspection?: InspectionReport;
}

export function PropertyCard({ property, lastInspection }: PropertyCardProps) {
  const isOccupied = lastInspection ? lastInspection.type === 'Entrée' : false;

  return (
    <Link 
      href={`/dashboard/properties/${property.id}`}
      className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 hover:border-blue-500/30 transition-all group flex flex-col"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
          <Home className="w-6 h-6 text-blue-500" />
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          isOccupied 
            ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
        }`}>
          {isOccupied ? 'Occupé' : 'Vacant'}
        </span>
      </div>

      <div className="flex-1">
        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
          {property.name}
        </h3>
        
        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{property.address}</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400 text-sm">
            <div className="flex items-center gap-1">
              <Maximize className="w-4 h-4" />
              <span>{property.surface} m²</span>
            </div>
            <div className="flex items-center gap-1">
              <Layers className="w-4 h-4" />
              <span>{property.roomCount} pièces</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-white/5 flex items-center justify-between mt-auto">
        <span className="text-xs text-slate-500">
          Propriétaire ID: {property.ownerId}
        </span>
        <div className="flex items-center gap-1 text-blue-400 text-sm font-medium">
          Détails <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </Link>
  );
}
