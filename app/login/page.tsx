'use client';

import React, { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Mail, Loader2, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginInput } from '@/lib/validations/auth';
import { Turnstile } from '@marsidev/react-turnstile';

function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      fax_number: '',
      turnstileToken: '',
    }
  });
  
  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setError(null);

    try {
      // Note: On passe les données de sécurité au signIn si nécessaire, 
      // mais ici le signIn gère surtout l'email/password. 
      // La validation Turnstile + Honeypot côté serveur se fera dans la route API callback ou un middleware si on utilise Auth.js
      // CEPENDANT, ici on fait un fetch personnalisé si on veut valider AVANT le signIn.
      
      // On simule une validation Turnstile côté serveur via une action ou une route API dédiée
      // Pour ce projet, on va valider le token Turnstile directement dans l'action de connexion ou via un proxy.
      
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        fax_number: data.fax_number,
        turnstileToken: data.turnstileToken,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError('Échec de la validation de sécurité ou identifiants incorrects.');
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      setError('Une erreur inattendue est survenue.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 relative z-10">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8 transition-all hover:border-white/20">
        <div className="flex flex-col items-center mb-10">
          <Image 
            src="/assets/logo-horizontal.png" 
            alt="VestaCheck Logo" 
            width={220} 
            height={60} 
            className="mb-2 h-auto w-auto object-contain"
            priority
          />
          <p className="text-slate-400 text-sm tracking-wide">Le futur de la gestion immobilière</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block ml-1">Email professionnel</label>
            <div className="relative group">
              <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${errors.email ? 'text-red-400' : 'text-slate-500 group-focus-within:text-blue-400'}`} />
              <input
                {...register('email')}
                type="email"
                placeholder="nom@vestacheck.com"
                className={`w-full bg-slate-800/50 border rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 transition-all ${
                  errors.email ? 'border-red-500/50 focus:ring-red-500/20' : 'border-slate-700/50 focus:ring-blue-500/40'
                }`}
              />
            </div>
            {errors.email && <p className="text-xs text-red-400 ml-1 mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block ml-1">Mot de passe</label>
            <div className="relative group">
              <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${errors.password ? 'text-red-400' : 'text-slate-500 group-focus-within:text-blue-400'}`} />
              <input
                {...register('password')}
                type="password"
                placeholder="••••••••"
                className={`w-full bg-slate-800/50 border rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 transition-all ${
                  errors.password ? 'border-red-500/50 focus:ring-red-500/20' : 'border-slate-700/50 focus:ring-blue-500/40'
                }`}
              />
            </div>
            {errors.password && <p className="text-xs text-red-400 ml-1 mt-1">{errors.password.message}</p>}
          </div>

          {/* Honeypot Field */}
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
          {errors.turnstileToken && <p className="text-xs text-red-400 text-center">{errors.turnstileToken.message}</p>}

          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Connexion
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </>
            )}
          </button>

          <div className="pt-4 flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-white/5"></div>
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Ou</span>
              <div className="h-px flex-1 bg-white/5"></div>
            </div>

            <Link 
              href="/register"
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold py-3.5 rounded-xl transition-all text-center backdrop-blur-md active:scale-[0.98]"
            >
              Créer un compte entreprise
            </Link>
          </div>
        </form>

        <div className="mt-8 pt-8 border-t border-white/5 text-center">
          <p className="text-slate-500 text-sm">
            © 2026 VestaCheck. Tous droits réservés.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0f172a]">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>

      <Suspense fallback={
        <div className="w-full max-w-md p-8 relative z-10 animate-pulse">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl h-[500px]"></div>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
