'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SignaturePad } from '@/components/ui/SignaturePad';
import { CheckCircle, ShieldCheck, FileText, AlertTriangle } from 'lucide-react';

export default function MagicLinkSignPage() {
  const params = useParams();
  const router = useRouter();
  const [isSigned, setIsSigned] = useState(false);
  const [showPad, setShowPad] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);

  // Simulation de chargement des données du rapport
  const reportId = params.id as string;

  const handleSave = (base64: string) => {
    setSignature(base64);
    setIsSigned(true);
    // Ici on appellerait une API pour enregistrer la signature dans la DB
    console.log("Signature enregistrée pour le rapport:", reportId);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-blue-600 p-8 text-white text-center">
          <ShieldCheck size={48} className="mx-auto mb-4 opacity-90" />
          <h1 className="text-2xl font-bold">Signature de votre État des Lieux</h1>
          <p className="text-blue-100 mt-2 text-sm">VestaCheck - Sécurisé & Certifié</p>
        </div>

        <div className="p-8">
          {isSigned ? (
            <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={40} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Merci ! Votre signature a été enregistrée.</h2>
                <p className="text-gray-500 mt-2">Le rapport final vous sera envoyé par email sous peu.</p>
              </div>
              <button 
                onClick={() => window.close()}
                className="w-full py-3 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-900 transition-all"
              >
                Fermer cette fenêtre
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-3 text-amber-800">
                <FileText className="shrink-0" />
                <p className="text-sm">
                  En signant ce document, vous validez l'état général du logement tel que décrit par l'inspecteur. 
                  Vous ne pourrez plus apporter de modifications après cette étape.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-gray-700">Récapitulatif du Dossier</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Rapport ID</span>
                    <span className="font-medium">#{reportId.slice(0, 8)}</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Date</span>
                    <span className="font-medium">{new Date().toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowPad(true)}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-[0.98]"
              >
                Signer le document maintenant
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="mt-8 text-gray-400 text-xs flex items-center gap-2">
        <AlertTriangle size={12} /> Signature électronique à valeur probante conforme eIDAS
      </p>

      {showPad && (
        <SignaturePad
          title="Apposez votre signature manuscrite"
          onSave={handleSave}
          onClose={() => setShowPad(false)}
        />
      )}
    </div>
  );
}
