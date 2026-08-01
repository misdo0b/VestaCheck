'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { LogOut, User, ChevronDown, Settings, Building, Globe } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { SyncStatusIndicator } from './SyncStatusIndicator';
import { useTranslation } from '@/hooks/useTranslation';
import { usePreferencesStore } from '@/store/usePreferencesStore';

export const Navbar = () => {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  
  const { t, language } = useTranslation();
  const setLanguage = usePreferencesStore((state) => state.setLanguage);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // On cache le bandeau sur la page de login pour garder l'esthétique épurée
  if (pathname === '/login') return null;

  return (
    <nav className="border-b border-white/5 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-[100] w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
        <Link 
          href="/dashboard" 
          className="flex items-center hover:opacity-90 active:scale-95 py-2 h-full"
          title="Retour au Dashboard"
        >
          <img 
            src="/assets/logo-horizontal.png" 
            alt="VestaCheck Logo" 
            className="h-full w-auto object-contain max-h-[80px]"
          />
        </Link>
        <div className="hidden md:flex items-center gap-1 bg-white/5 border border-white/10 rounded-2xl p-1 backdrop-blur-md">
          <Link 
            href="/dashboard" 
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              pathname === '/dashboard' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {t('common.dashboard')}
          </Link>
          <Link 
            href="/dashboard/properties" 
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              pathname.startsWith('/dashboard/properties') ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {t('common.properties')}
          </Link>
          <Link 
            href="/dashboard/tenants" 
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              pathname.startsWith('/dashboard/tenants') ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {t('common.tenants')}
          </Link>
        </div>

        {/* User Actions */}
        {session?.user && (
          <div className="flex items-center gap-3">
            {/* Nouveau composant de synchronisation (Compact) */}
            <SyncStatusIndicator />

            {/* Raccourci sélecteur de langue */}
            <div className="relative" ref={langDropdownRef}>
              <button
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-900/50 border border-white/10 hover:bg-slate-900/80 hover:border-white/20 transition-all text-xs font-bold uppercase tracking-wider text-slate-300"
                title="Changer de langue / Change language"
              >
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span>{language}</span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isLangDropdownOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-slate-900 border border-white/10 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                  <div className="p-1">
                    {(['fr', 'en', 'es', 'zh', 'ar'] as const).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => {
                          setLanguage(lang);
                          setIsLangDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-between ${
                          language === lang 
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10' 
                            : 'text-slate-300 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <span>
                          {lang === 'fr' && 'Français'}
                          {lang === 'en' && 'English'}
                          {lang === 'es' && 'Español'}
                          {lang === 'zh' && '中文'}
                          {lang === 'ar' && 'العربية'}
                        </span>
                        <span className="text-[9px] opacity-60">{lang}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <span className="text-xs font-medium text-slate-300">{(session.user as any).name}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-white/10 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="p-2 border-b border-white/5">
                    <p className="px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      {t(`roles.${(session.user as any).role}`) || (session.user as any).role}
                    </p>
                  </div>
                  <div className="p-1">
                    <Link 
                      href="/dashboard/organization"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <Building className="w-4 h-4" />
                      {t('common.organization')}
                    </Link>
                    <Link 
                      href="/dashboard/settings"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      {t('common.settings')}
                    </Link>
                  </div>
                  <div className="p-1 border-t border-white/5">
                    <button 
                      onClick={() => signOut({ callbackUrl: '/login' })}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('common.logout')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

