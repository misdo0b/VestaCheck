'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRegisterStore } from '@/store/useRegisterStore';
import { 
  Building, 
  MapPin, 
  Phone, 
  User, 
  Mail, 
  Lock, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  CreditCard,
  Loader2,
  AlertCircle
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUserStore } from '@/store/useUserStore';
import { useOrganizationStore } from '@/store/useOrganizationStore';
import { useAgencyStore } from '@/store/useAgencyStore';
import { usePropertyStore } from '@/store/usePropertyStore';

import { 
  step1Schema, 
  step2Schema, 
  step3Schema,
  registerSchema as finalRegisterSchema 
} from '@/lib/validations/auth';
import { Turnstile } from '@marsidev/react-turnstile';

interface RegisterFormValues {
  raisonSociale: string;
  siret: string;
  adressePostale: string;
  agencyName: string;
  agencyAddress: string;
  agencyPhone: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  fax_number?: string;
  turnstileToken: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const { 
    step, setStep, 
    organization, updateOrganization, 
    agency, updateAgency, 
    admin, updateAdmin,
    reset
  } = useRegisterStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form with values from store
  const useFormReturn = useForm<RegisterFormValues>({
    resolver: zodResolver(
      step === 1 ? step1Schema : step === 2 ? step2Schema : step3Schema.extend({
        fax_number: z.string().max(0, 'Échec de la validation de sécurité').optional(),
        turnstileToken: z.string().min(1, 'Veuillez valider le captcha'),
      })
    ) as any,
    shouldUnregister: false,
    defaultValues: {
      raisonSociale: organization.raisonSociale,
      siret: organization.siret,
      adressePostale: organization.adressePostale,
      agencyName: agency.name,
      agencyAddress: agency.address,
      agencyPhone: agency.phone,
      firstName: admin.firstName,
      lastName: admin.lastName,
      email: admin.email,
      password: admin.password,
      fax_number: '',
      turnstileToken: '',
    }
  });

  const { 
    register, 
    handleSubmit, 
    trigger, 
    getValues,
    setValue,
    watch,
    formState: { errors } 
  } = useFormReturn;

  const formValues = getValues();
  const formErrors = errors as any; // Bypass union type issues for error display
  const turnstileToken = watch('turnstileToken');

  const steps = [
    { id: 1, title: 'Organisation', icon: Building },
    { id: 2, title: 'Agence', icon: MapPin },
    { id: 3, title: 'Administrateur', icon: User },
  ];

  const handleNext = async () => {
    const fieldsToValidate = step === 1 
      ? ['raisonSociale', 'siret', 'adressePostale'] 
      : step === 2 
        ? ['agencyName', 'agencyAddress', 'agencyPhone']
        : ['firstName', 'lastName', 'email', 'password', 'turnstileToken'];

    const isValid = await trigger(fieldsToValidate as any);
    
    if (isValid) {
      // Sauvegarde intermédiaire dans le store
      const currentValues = getValues();
      if (step === 1) {
        updateOrganization({
          raisonSociale: (currentValues as any).raisonSociale,
          siret: (currentValues as any).siret,
          adressePostale: (currentValues as any).adressePostale
        });
      } else if (step === 2) {
        updateAgency({
          name: (currentValues as any).agencyName,
          address: (currentValues as any).agencyAddress,
          phone: (currentValues as any).agencyPhone
        });
      }
      if (step < 3) setStep(step + 1);
    } else {
      toast.error('Veuillez corriger les erreurs avant de continuer');
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const onFinalSubmit = async () => {
    const data = getValues(); // Récupère TOUTES les données (Step 1 + 2 + 3)
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          organization: { 
            raisonSociale: data.raisonSociale, 
            siret: data.siret, 
            adressePostale: data.adressePostale 
          }, 
          agency: { 
            name: data.agencyName, 
            address: data.agencyAddress, 
            phone: data.agencyPhone 
          }, 
          admin: { 
            firstName: data.firstName, 
            lastName: data.lastName, 
            email: data.email, 
            password: data.password 
          },
          fax_number: data.fax_number,
          turnstileToken: data.turnstileToken
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de l\'inscription');
      }

      toast.success('Inscription réussie ! Connexion en cours...');

      // Auto-login
      const signInResult = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (signInResult?.error) {
        toast.error('Erreur lors de la connexion automatique. Veuillez vous connecter manuellement.');
        router.push('/login');
      } else {
        reset();
        // Une redirection complète par le navigateur (full reload) est le moyen le plus robuste
        // pour garantir que les cookies de session sont correctement injectés dans tous les en-têtes
        // et que les stores locaux et serveurs de l'application sont rechargés et synchronisés proprement
        // via le StoreInitializer lors du montage du tableau de bord.
        window.location.href = '/dashboard';
      }
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
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-2xl relative z-10">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8 transition-all hover:border-white/20">
          <div className="flex flex-col items-center mb-8">
            <Image 
              src="/assets/logo-horizontal.png" 
              alt="VestaCheck Logo" 
              width={180} 
              height={50} 
              className="mb-2 h-auto w-auto object-contain"
              priority
            />
            <p className="text-slate-400 text-xs tracking-widest uppercase font-black opacity-50">Configuration du compte</p>
          </div>

          {/* Stepper */}
          <div className="flex justify-between items-center mb-10 px-4 relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/5 -translate-y-1/2 z-0"></div>
            {steps.map((s, i) => (
              <div key={s.id} className="relative z-10 flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border-2 ${
                  step === s.id 
                    ? 'bg-blue-600 border-blue-400 shadow-lg shadow-blue-500/20' 
                    : step > s.id 
                      ? 'bg-green-600/20 border-green-500/50 text-green-400' 
                      : 'bg-slate-800 border-white/10 text-slate-500'
                }`}>
                  {step > s.id ? <CheckCircle2 size={18} /> : <s.icon size={18} />}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${
                  step === s.id ? 'text-white' : 'text-slate-500'
                }`}>{s.title}</span>
              </div>
            ))}
          </div>

          <form onSubmit={step === 3 ? handleSubmit(onFinalSubmit) : e => { e.preventDefault(); handleNext(); }} className="space-y-6">
            {/* Step 1: Organization */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Building className="text-blue-400" /> Votre Organisation
                </h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 ml-1">Nom de l'entreprise</label>
                    <div className="relative group">
                      <Building className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${formErrors.raisonSociale ? 'text-red-400' : 'text-slate-500 group-focus-within:text-blue-400'}`} />
                      <input
                        {...register('raisonSociale')}
                        placeholder="VestaCheck SARL"
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

            {/* Step 2: Agency */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <MapPin className="text-blue-400" /> Agence Principale
                </h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 ml-1">Nom de l'agence</label>
                    <div className="relative group">
                      <Building className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${formErrors.agencyName ? 'text-red-400' : 'text-slate-500 group-focus-within:text-blue-400'}`} />
                      <input
                        {...register('agencyName')}
                        placeholder="Agence Siège"
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
                        placeholder="45 avenue des Champs-Élysées"
                        className={`w-full bg-slate-800/50 border rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 transition-all ${
                          formErrors.agencyAddress ? 'border-red-500/50 focus:ring-red-500/20' : 'border-slate-700/50 focus:ring-blue-500/40'
                        }`}
                      />
                    </div>
                    {formErrors.agencyAddress && <p className="text-xs text-red-400 ml-1 mt-1">{formErrors.agencyAddress.message as string}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 ml-1">Téléphone</label>
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

            {/* Step 3: Admin */}
            {step === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <User className="text-blue-400" /> Compte Administrateur
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 ml-1">Prénom</label>
                    <input
                      {...register('firstName')}
                      placeholder="Jean"
                      className={`w-full bg-slate-800/50 border rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 transition-all ${
                        formErrors.firstName ? 'border-red-500/50 focus:ring-red-500/20' : 'border-slate-700/50 focus:ring-blue-500/40'
                      }`}
                    />
                    {formErrors.firstName && <p className="text-[10px] text-red-400 ml-1 mt-1">{formErrors.firstName.message as string}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 ml-1">Nom</label>
                    <input
                      {...register('lastName')}
                      placeholder="Dupont"
                      className={`w-full bg-slate-800/50 border rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 transition-all ${
                        formErrors.lastName ? 'border-red-500/50 focus:ring-red-500/20' : 'border-slate-700/50 focus:ring-blue-500/40'
                      }`}
                    />
                    {formErrors.lastName && <p className="text-[10px] text-red-400 ml-1 mt-1">{formErrors.lastName.message as string}</p>}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 ml-1">Email professionnel</label>
                    <div className="relative group">
                      <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${formErrors.email ? 'text-red-400' : 'text-slate-500 group-focus-within:text-blue-400'}`} />
                      <input
                        {...register('email')}
                        type="email"
                        placeholder="jean.dupont@entreprise.com"
                        className={`w-full bg-slate-800/50 border rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 transition-all ${
                          formErrors.email ? 'border-red-500/50 focus:ring-red-500/20' : 'border-slate-700/50 focus:ring-blue-500/40'
                        }`}
                      />
                    </div>
                    {formErrors.email && <p className="text-xs text-red-400 ml-1 mt-1">{formErrors.email.message as string}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 ml-1">Mot de passe</label>
                    <div className="relative group">
                      <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${formErrors.password ? 'text-red-400' : 'text-slate-500 group-focus-within:text-blue-400'}`} />
                      <input
                        {...register('password')}
                        type="password"
                        placeholder="••••••••"
                        className={`w-full bg-slate-800/50 border rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 transition-all ${
                          formErrors.password ? 'border-red-500/50 focus:ring-red-500/20' : 'border-slate-700/50 focus:ring-blue-500/40'
                        }`}
                      />
                    </div>
                    {formErrors.password ? (
                      <p className="text-xs text-red-400 ml-1 mt-1">{formErrors.password.message as string}</p>
                    ) : (
                      <p className="text-[10px] text-slate-500 ml-1 mt-1">Minimum 8 caractères</p>
                    )}
                  </div>
                </div>

                {/* Honeypot Field - Invisible for humans, trap for bots */}
                <div className="absolute opacity-0 -z-50 pointer-events-none" aria-hidden="true">
                  <input
                    {...register('fax_number')}
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>

                {/* Cloudflare Turnstile */}
                <div className="flex justify-center py-2">
                  <Turnstile
                    siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
                    onSuccess={(token) => setValue('turnstileToken', token)}
                    options={{
                      theme: 'dark',
                    }}
                  />
                </div>
                {errors.turnstileToken && <p className="text-xs text-red-400 text-center">{errors.turnstileToken.message as string}</p>}
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
                className={`flex-[2] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 group active:scale-[0.98] disabled:opacity-50`}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {step === 3 ? 'Finaliser l\'inscription' : 'Continuer'}
                    {step < 3 && <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />}
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <p className="text-slate-500 text-sm">
              Déjà un compte ? <Link href="/login" className="text-blue-400 hover:underline">Se connecter</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
