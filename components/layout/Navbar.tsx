'use client';

import React from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { LogOut, User } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

export const Navbar = () => {
  const { data: session } = useSession();
  const pathname = usePathname();

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

        {/* User Actions */}
        {session?.user && (
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
              <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <span className="text-xs font-medium text-slate-300">{(session.user as any).name}</span>
            </div>
            
            <button 
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all group"
              title="Déconnexion"
            >
              <LogOut className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};
