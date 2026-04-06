'use client';

import React from 'react';
import { Property, InspectionReport } from '@/types';
import { Home, MapPin, Maximize, Layers, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface PropertyListItemProps {
  property: Property;
  lastInspection?: InspectionReport;
}

export function PropertyListItem({ property, lastInspection }: PropertyListItemProps) {
  const isOccupied = lastInspection ? lastInspection.type === 'Entrée' : false;

  return (
    <Link 
      href={`/dashboard/properties/${property.id}`}
      className="group bg-slate-900/40 border border-white/5 rounded-2xl p-4 hover:border-blue-500/30 transition-all flex items-center gap-6"
    >
      {/* Icon/Thumbnail */}
      <div className="w-16 h-16 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
        <Home className="w-8 h-8 text-blue-500" />
      </div>

      {/* Main Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors truncate">
          {property.name}
        </h3>
        <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{property.address}</span>
        </div>
      </div>

      {/* Stats - Hidden on mobile */}
      <div className="hidden md:flex items-center gap-8 px-8 border-x border-white/5">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-1">Surface</span>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Maximize className="w-4 h-4 text-blue-400/60" />
            <span className="font-semibold">{property.surface} m²</span>
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-1">Pièces</span>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Layers className="w-4 h-4 text-blue-400/60" />
            <span className="font-semibold">{property.roomCount}</span>
          </div>
        </div>
      </div>

      {/* Status & Action */}
      <div className="flex items-center gap-6 shrink-0">
        <span className={`hidden sm:inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
          isOccupied 
            ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
        }`}>
          {isOccupied ? 'Occupé' : 'Vacant'}
        </span>
        <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-slate-500 group-hover:text-blue-400 group-hover:border-blue-400/30 group-hover:bg-blue-400/5 transition-all">
          <ChevronRight className="w-5 h-5" />
        </div>
      </div>
    </Link>
  );
}
