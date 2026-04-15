'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Key, Save, Eye, EyeOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { User } from '@/types';

const passwordSchema = z.object({
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
});

type PasswordFormData = z.infer<typeof passwordSchema>;

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (password: string) => void;
  user: User;
}

export default function ResetPasswordModal({ isOpen, onClose, onSubmit, user }: ResetPasswordModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    reset
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: '',
    },
  });

  if (!isOpen) return null;

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";
    let pass = "";
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setValue('password', pass, { shouldValidate: true });
    if (!showPassword) setShowPassword(true);
  };

  const handleFormSubmit = (data: PasswordFormData) => {
    onSubmit(data.password);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
      reset();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-sm shadow-2xl shadow-blue-500/10 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Key className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-none mb-0.5">Modifier le mot de passe</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{user.name}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success State Overlay */}
        {isSuccess ? (
          <div className="p-8 flex flex-col items-center justify-center text-center animate-in zoom-in-95 fill-mode-forwards">
             <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 border border-emerald-500/20">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
             </div>
             <h3 className="text-xl font-bold text-white mb-1">Mot de passe modifié</h3>
             <p className="text-slate-400 text-sm">Le nouveau mot de passe a été enregistré avec succès.</p>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nouveau Mot de passe</label>
                <button 
                  type="button" 
                  onClick={generatePassword}
                  className="text-xs font-bold text-blue-500 hover:text-blue-400 flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  Générer
                </button>
              </div>
              
              <div className="relative group">
                <input 
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  className={`w-full bg-slate-950 border ${errors.password ? 'border-red-500/50' : 'border-white/5'} rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 ${errors.password ? 'focus:ring-red-500/20' : 'focus:ring-blue-500/20'} transition-all`}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1 ml-1 font-medium">{errors.password.message}</p>}
            </div>

            <p className="text-[11px] text-slate-500 bg-white/5 p-3 rounded-lg border border-white/5 italic">
              L'administrateur est responsable de la transmission du nouveau mot de passe à l'utilisateur de manière sécurisée.
            </p>

            <div className="flex gap-3 pt-2">
              <button 
                type="button" 
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-400 rounded-xl text-xs font-bold transition-all transition-colors"
              >
                Annuler
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-[2] px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-white/50" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Enregistrer
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
