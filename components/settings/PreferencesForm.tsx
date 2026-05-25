'use client';

import React, { useTransition } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserPreferencesSchema, UserPreferences } from '@/types';
import { usePreferencesStore } from '@/store/usePreferencesStore';
import { useTranslation } from '@/hooks/useTranslation';
import { Sun, Moon, Mail, Globe, Sparkles, Check, CheckSquare } from 'lucide-react';
import { toast } from 'sonner';

export default function PreferencesForm() {
  const { preferences, setTheme, setLanguage, toggleAutoEmail, setPreferences } = usePreferencesStore();
  const { t, language } = useTranslation();
  const [isPending, startTransition] = useTransition();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
  } = useForm<UserPreferences>({
    resolver: zodResolver(UserPreferencesSchema),
    defaultValues: {
      autoEmailSignatories: preferences.autoEmailSignatories,
      theme: preferences.theme,
      language: preferences.language,
    },
  });

  const watchedTheme = watch('theme');
  const watchedLanguage = watch('language');
  const watchedAutoEmail = watch('autoEmailSignatories');

  const onSubmit = async (data: UserPreferences) => {
    // Optimistic UI updates
    setTheme(data.theme);
    setLanguage(data.language);
    toggleAutoEmail(data.autoEmailSignatories);
    
    // Simulate backend synchronization with NextAuth / db if required
    startTransition(async () => {
      try {
        // Enregistrement des préférences
        setPreferences(data);
        toast.success(t('preferences.saveSuccess'));
      } catch (error) {
        console.error(error);
        toast.error(t('preferences.saveError'));
      }
    });
  };

  return (
    <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-sm shadow-xl relative overflow-hidden transition-all duration-300">
      {/* Decorative premium glow */}
      <div className="absolute -right-24 -top-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-24 -bottom-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <header className="mb-8 relative z-10">
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2.5">
          <Sparkles className="text-blue-500 w-6 h-6 animate-pulse" />
          {t('preferences.title')}
        </h2>
        <p className="text-slate-400 text-sm leading-relaxed">{t('preferences.subtitle')}</p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 relative z-10">
        {/* 1. Switch d'envoi automatique de mail */}
        <div className="flex items-start justify-between gap-6 p-4 rounded-2xl bg-white/[0.01] border border-white/5 hover:bg-white/[0.02] transition-colors duration-200">
          <div className="space-y-1">
            <label className="flex items-center gap-2 text-sm font-semibold text-white tracking-wide">
              <Mail size={16} className="text-blue-400" />
              {t('preferences.autoEmailSignatories')}
            </label>
            <p className="text-xs text-slate-400 max-w-lg leading-relaxed">
              {t('preferences.autoEmailDescription')}
            </p>
          </div>
          <Controller
            name="autoEmailSignatories"
            control={control}
            render={({ field }) => (
              <button
                type="button"
                role="switch"
                aria-checked={field.value}
                aria-label={t('preferences.autoEmailSignatories')}
                onClick={() => {
                  field.onChange(!field.value);
                  // Changement immédiat optimiste
                  toggleAutoEmail(!field.value);
                }}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                  field.value ? 'bg-blue-600' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-300 ease-in-out ${
                    field.value ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            )}
          />
        </div>

        {/* 2. Thème (Sélection par cartes tactiles premium) */}
        <div className="space-y-3">
          <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">
            {t('preferences.theme')}
          </label>
          <div className="grid grid-cols-2 gap-4">
            {/* Carte mode clair */}
            <button
              type="button"
              onClick={() => {
                setValue('theme', 'light');
                setTheme('light');
              }}
              className={`relative flex items-center gap-3 p-4 rounded-2xl border transition-all duration-300 text-left cursor-pointer outline-none ${
                watchedTheme === 'light'
                  ? 'bg-blue-600/10 border-blue-500/50 shadow-md shadow-blue-500/5 text-white'
                  : 'bg-slate-950/40 border-white/5 hover:border-white/10 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`p-2 rounded-xl transition-colors ${
                watchedTheme === 'light' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-500'
              }`}>
                <Sun size={20} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold leading-none">{t('preferences.themeLight')}</p>
              </div>
              {watchedTheme === 'light' && (
                <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white scale-in duration-200">
                  <Check size={12} strokeWidth={3} />
                </div>
              )}
            </button>

            {/* Carte mode sombre */}
            <button
              type="button"
              onClick={() => {
                setValue('theme', 'dark');
                setTheme('dark');
              }}
              className={`relative flex items-center gap-3 p-4 rounded-2xl border transition-all duration-300 text-left cursor-pointer outline-none ${
                watchedTheme === 'dark'
                  ? 'bg-blue-600/10 border-blue-500/50 shadow-md shadow-blue-500/5 text-white'
                  : 'bg-slate-950/40 border-white/5 hover:border-white/10 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`p-2 rounded-xl transition-colors ${
                watchedTheme === 'dark' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-500'
              }`}>
                <Moon size={20} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold leading-none">{t('preferences.themeDark')}</p>
              </div>
              {watchedTheme === 'dark' && (
                <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white scale-in duration-200">
                  <Check size={12} strokeWidth={3} />
                </div>
              )}
            </button>
          </div>
        </div>

        {/* 3. Sélection de langue */}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">
            {t('preferences.language')}
          </label>
          <div className="relative group">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
            <Controller
              name="language"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    field.onChange(val);
                    setLanguage(val); // Application optimiste instantanée
                  }}
                  aria-label={t('preferences.language')}
                  className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-sm text-white outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer"
                >
                  <option value="fr">Français (FR)</option>
                  <option value="en">English (EN)</option>
                  <option value="es">Español (ES)</option>
                  <option value="zh">中文 (ZH)</option>
                  <option value="ar">العربية (AR)</option>
                </select>
              )}
            />
            {/* Custom arrow decoration */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-500" />
          </div>
        </div>

        {/* Bouton de sauvegarde et état de synchro */}
        <div className="pt-4 flex items-center justify-between border-t border-white/5 gap-4">
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <CheckSquare size={14} className="text-emerald-500" />
            Synchronisation locale temps réel active
          </span>
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50"
          >
            {isPending ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
