'use client';

import React from 'react';
import { AlertCircle, Trash2, Key, X, CheckCircle2 } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  type?: 'danger' | 'warning' | 'info';
  confirmText?: string;
  cancelText?: string;
}

export default function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'danger',
  confirmText = 'Confirmer',
  cancelText = 'Annuler'
}: ConfirmationDialogProps) {
  if (!isOpen) return null;

  const getStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: <Trash2 className="w-6 h-6 text-red-500" />,
          bg: 'bg-red-500/10',
          border: 'border-red-500/20',
          button: 'bg-red-600 hover:bg-red-500 shadow-red-600/20',
        };
      case 'warning':
        return {
          icon: <Key className="w-6 h-6 text-amber-500" />,
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/20',
          button: 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20',
        };
      default:
        return {
          icon: <AlertCircle className="w-6 h-6 text-blue-500" />,
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/20',
          button: 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20',
        };
    }
  };

  const styles = getStyles();

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-sm shadow-2xl shadow-black/50 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 text-center">
          <div className={`mx-auto w-14 h-14 rounded-2xl ${styles.bg} border ${styles.border} flex items-center justify-center mb-4`}>
            {styles.icon}
          </div>
          
          <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
          <p className="text-sm text-slate-400 mb-8 leading-relaxed">
            {message}
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-sm font-medium transition-all"
            >
              {cancelText}
            </button>
            <button 
              onClick={() => { onConfirm(); onClose(); }}
              className={`flex-[1.5] px-4 py-3 ${styles.button} text-white rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95`}
            >
              {confirmText}
            </button>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 p-4 pointer-events-none opacity-20">
          <X className="w-24 h-24 text-white/5" />
        </div>
      </div>
    </div>
  );
}
