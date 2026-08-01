'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building, 
  MapPin, 
  Phone, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  CreditCard,
  Loader2,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { step1Schema, step2Schema } from '@/lib/validations/auth';

const onboardingFormSchema = z.object({
  raisonSociale: step1Schema.shape.raisonSociale,
  siret: step1Schema.shape.siret,
  adressePostale: step1Schema.shape.adressePostale,
  agencyName: step2Schema.shape.agencyName,
  agencyAddress: step2Schema.shape.agencyAddress,
  agencyPhone: step2Schema.shape.agencyPhone,
});

type OnboardingFormValues = z.infer<typeof onboardingFormSchema>;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    formState: { errors }
  } = useForm<OnboardingFormValues>({
    resolver: zodResolver(
      step === 1 
        ? step1Schema 
        : step2Schema
    ) as any,
    mode: 'onChange',
    defaultValues: {
      raisonSociale: '',
      siret: '',
      adressePostale: '',
      agencyName: '',
      agencyAddress: '',
      agencyPhone: '',
    }
  });

  const formErrors = errors as any;

  const steps = [
    { id: 1, title: 'Organisation', icon: Building },
    { id: 2, title: 'Agence', icon: MapPin },
  ];

  const handleNext = async () => {
    const fieldsToValidate = ['raisonSociale', 'siret', 'adressePostale'];
    const isValid = await trigger(fieldsToValidate as any);
    
    if (isValid) {
      setStep(2);
    } else {
      toast.error('Veuillez corriger les erreurs avant de continuer');
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const onSubmit = async () => {
    const data = getValues();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization: {
            raisonSociale: data.raisonSociale,
            siret: data.siret,
            adressePostale: data.adressePostale
          },
          agency: {
            agencyName: data.agencyName,
            agencyAddress: data.agencyAddress,
            agencyPhone: data.agencyPhone
          }
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de la création de l'organisation");
      }

      toast.success("Bienvenue ! Votre organisation et agence ont été créées avec succès.");

      // Redirection complète pour mettre à jour la session JWT NextAuth
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0f172a] py-12 px-4">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] rounded-full bg-blue-600/20 blur-[130px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-indigo-600/20 blur-[130px] animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-2xl relative z-10">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8 transition-all hover:border-white/20">
          
          {/* Header */}
          <div className="flex flex-col items-center mb-8 text-center">
            <Image 
              src="/assets/logo-horizontal.png" 
              alt="VestaCheck Logo" 
              width={180} 
              height={50} 
              className="mb-3 h-auto w-auto object-contain"
              priority
            />
            <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm mb-1">
              <Sparkles size={16} />
              <span>Authentification Google réussie</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Configurez votre espace</h1>
            <p className="text-slate-400 text-xs mt-1">Créez votre organisation et votre première agence pour commencer.</p>
          </div>

          {/* Stepper */}
          <div className="flex justify-between items-center mb-10 px-8 relative">
            <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-white/10 -translate-y-1/2 z-0"></div>
            {steps.map((s) => (
              <div key={s.id} className="relative z-10 flex flex-col items-center gap-2">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all border-2 ${
                  step === s.id 
                    ? 'bg-blue-600 border-blue-400 shadow-lg shadow-blue-500/30 text-white' 
                    : step > s.id 
                      ? 'bg-green-600/20 border-green-500/50 text-green-400' 
                      : 'bg-slate-800 border-white/10 text-slate-500'
                }`}>
                  {step > s.id ? <CheckCircle2 size={22} /> : <s.icon size={22} />}
                </div>
                <span className={`text-xs font-bold uppercase tracking-wider ${
                  step === s.id ? 'text-white' : 'text-slate-500'
                }`}>{s.title}</span>
              </div>
            ))}
          </div>

          <form onSubmit={step === 2 ? handleSubmit(onSubmit) : (e) => { e.preventDefault(); handleNext(); }} className="space-y-6">
            
            {/* Step 1: Organisation */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Building className="text-blue-400" /> Informations de votre Organisation
                </h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 ml-1">Raison sociale / Nom de l'entreprise</label>
                    <div className="relative group">
                      <Building className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${formErrors.raisonSociale ? 'text-red-400' : 'text-slate-500 group-focus-within:text-blue-400'}`} />
                      <input
                        {...register('raisonSociale')}
                        placeholder="Ex: Immobilier Conseil SARL"
                        className={`w-full bg-slate-800/50 border rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 transition-all ${
                          formErrors.raisonSociale ? 'border-red-500/50 focus:ring-red-500/20' : 'border-slate-700/50 focus:ring-blue-500/40'
                        }`}
                      />
                    </div>
                    {formErrors.raisonSociale && <p className="text-xs text-red-400 ml-1 mt-1">{formErrors.raisonSociale.message as string}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 ml-1">Numéro SIRET (14 chiffres)</label>
                    <div className="relative group">
                      <CreditCard className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${formErrors.siret ? 'text-red-400' : 'text-slate-500 group-focus-within:text-blue-400'}`} />
                      <input
                        {...register('siret')}
                        maxLength={14}
                        placeholder="12345678901234"
                        className={`w-full bg-slate-800/50 border rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 transition-all ${
                          formErrors.siret ? 'border-red-500/50 focus:ring-red-500/20' : 'border-slate-700/50 focus:ring-blue-500/40'
                        }`}
                      />
                    </div>
                    {formErrors.siret && <p className="text-xs text-red-400 ml-1 mt-1">{formErrors.siret.message as string}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 ml-1">Adresse Sociale</label>
                    <div className="relative group">
                      <MapPin className={`absolute left-3 top-4 w-5 h-5 transition-colors ${formErrors.adressePostale ? 'text-red-400' : 'text-slate-500 group-focus-within:text-blue-400'}`} />
                      <textarea
                        {...register('adressePostale')}
                        placeholder="123 rue de Paris, 75000 Paris"
                        className={`w-full bg-slate-800/50 border rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 transition-all h-24 resize-none ${
                          formErrors.adressePostale ? 'border-red-500/50 focus:ring-red-500/20' : 'border-slate-700/50 focus:ring-blue-500/40'
                        }`}
                      />
                    </div>
                    {formErrors.adressePostale && <p className="text-xs text-red-400 ml-1 mt-1">{formErrors.adressePostale.message as string}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Agence */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <MapPin className="text-blue-400" /> Première Agence (Siège)
                </h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 ml-1">Nom de l'agence</label>
                    <div className="relative group">
                      <Building className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${formErrors.agencyName ? 'text-red-400' : 'text-slate-500 group-focus-within:text-blue-400'}`} />
                      <input
                        {...register('agencyName')}
                        placeholder="Agence Principale"
                        className={`w-full bg-slate-800/50 border rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 transition-all ${
                          formErrors.agencyName ? 'border-red-500/50 focus:ring-red-500/20' : 'border-slate-700/50 focus:ring-blue-500/40'
                        }`}
                      />
                    </div>
                    {formErrors.agencyName && <p className="text-xs text-red-400 ml-1 mt-1">{formErrors.agencyName.message as string}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 ml-1">Adresse de l'agence</label>
                    <div className="relative group">
                      <MapPin className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${formErrors.agencyAddress ? 'text-red-400' : 'text-slate-500 group-focus-within:text-blue-400'}`} />
                      <input
                        {...register('agencyAddress')}
                        placeholder="45 avenue des Champs-Élysées, 75008 Paris"
                        className={`w-full bg-slate-800/50 border rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 transition-all ${
                          formErrors.agencyAddress ? 'border-red-500/50 focus:ring-red-500/20' : 'border-slate-700/50 focus:ring-blue-500/40'
                        }`}
                      />
                    </div>
                    {formErrors.agencyAddress && <p className="text-xs text-red-400 ml-1 mt-1">{formErrors.agencyAddress.message as string}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 ml-1">Téléphone de l'agence</label>
                    <div className="relative group">
                      <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${formErrors.agencyPhone ? 'text-red-400' : 'text-slate-500 group-focus-within:text-blue-400'}`} />
                      <input
                        {...register('agencyPhone')}
                        placeholder="01 23 45 67 89"
                        className={`w-full bg-slate-800/50 border rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 transition-all ${
                          formErrors.agencyPhone ? 'border-red-500/50 focus:ring-red-500/20' : 'border-slate-700/50 focus:ring-blue-500/40'
                        }`}
                      />
                    </div>
                    {formErrors.agencyPhone && <p className="text-xs text-red-400 ml-1 mt-1">{formErrors.agencyPhone.message as string}</p>}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm animate-in zoom-in-95">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <ChevronLeft size={20} />
                  Précédent
                </button>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="flex-[2] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 group active:scale-[0.98] disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {step === 2 ? 'Valider et accéder à VestaCheck' : 'Continuer'}
                    {step < 2 && <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
