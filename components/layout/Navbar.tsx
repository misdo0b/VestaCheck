'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { LogOut, User, ChevronDown, Settings, Building } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { SyncStatusIndicator } from './SyncStatusIndicator';

export const Navbar = () => {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
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
            Dashboard
          </Link>
          <Link 
            href="/dashboard/properties" 
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              pathname.startsWith('/dashboard/properties') ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Biens
          </Link>
          <Link 
            href="/dashboard/tenants" 
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              pathname.startsWith('/dashboard/tenants') ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Locataires
          </Link>
        </div>

        {/* User Actions */}
        {session?.user && (
          <div className="flex items-center gap-4">
            {/* Nouveau composant de synchronisation */}
            <SyncStatusIndicator />

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
                      {(session.user as any).role}
                    </p>
                  </div>
                  <div className="p-1">
                    <Link 
                      href="/dashboard/organization"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <Building className="w-4 h-4" />
                      Organisation
                    </Link>
                    <Link 
                      href="/dashboard/settings"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Paramètres
                    </Link>
                  </div>
                  <div className="p-1 border-t border-white/5">
                    <button 
                      onClick={() => signOut({ callbackUrl: '/login' })}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Déconnexion
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
