'use client';

import React from 'react';
import { Cloud, CloudOff, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useSync } from '@/hooks/useSync';
import { useTranslation } from '@/hooks/useTranslation';

/**
 * SyncStatusIndicator - Composant UI affichant l'état de la synchronisation (Version Compacte)
 */
export function SyncStatusIndicator() {
  const { isOnline, isSyncing, processQueue } = useSync();
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-slate-900/50 border border-white/10 backdrop-blur-sm transition-all hover:border-white/20">
      {/* Network Status */}
      <div className="flex items-center" title={isOnline ? t('sync.online') : t('sync.offline')}>
        {isOnline ? (
          <Wifi className="w-3.5 h-3.5 text-emerald-500" />
        ) : (
          <WifiOff className="w-3.5 h-3.5 text-orange-500" />
        )}
      </div>

      <div className="w-px h-3 bg-white/10" />

      {/* Sync Status */}
      <div className="flex items-center">
        {isSyncing ? (
          <span title={t('sync.syncing')}>
            <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
          </span>
        ) : isOnline ? (
          <button 
            onClick={() => processQueue()}
            title={t('sync.startSync')}
            className="flex items-center group transition-colors focus:outline-none"
          >
            <Cloud className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400 transition-colors" />
          </button>
        ) : (
          <span title={t('sync.waitingNetwork')}>
            <CloudOff className="w-3.5 h-3.5 text-slate-500" />
          </span>
        )}
      </div>
    </div>
  );
}


