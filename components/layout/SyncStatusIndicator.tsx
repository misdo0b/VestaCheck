'use client';

import React from 'react';
import { Cloud, CloudOff, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useSync } from '@/hooks/useSync';

/**
 * SyncStatusIndicator - Composant UI affichant l'état de la synchronisation
 */
export function SyncStatusIndicator() {
  const { isOnline, isSyncing, processQueue } = useSync();

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-slate-900/50 border border-white/10 backdrop-blur-sm transition-all hover:border-white/20">
      {/* Network Status */}
      <div className="flex items-center gap-1.5 border-r border-white/10 pr-3 mr-1">
        {isOnline ? (
          <>
            <Wifi className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Online</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4 text-orange-500" />
            <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider">Offline</span>
          </>
        )}
      </div>

      {/* Sync Status */}
      <div className="flex items-center gap-2">
        {isSyncing ? (
          <>
            <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
            <span className="text-[11px] text-slate-300 font-medium">Synchronisation...</span>
          </>
        ) : isOnline ? (
          <button 
            onClick={() => processQueue()}
            title="Démarrer la synchronisation"
            className="flex items-center gap-2 group hover:text-white transition-colors"
          >
            <Cloud className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
            <span className="text-[11px] text-slate-400 font-medium group-hover:text-slate-200">À jour</span>
          </button>
        ) : (
          <>
            <CloudOff className="w-4 h-4 text-slate-500" />
            <span className="text-[11px] text-slate-500 font-medium italic">Attente réseau</span>
          </>
        )}
      </div>
    </div>
  );
}
