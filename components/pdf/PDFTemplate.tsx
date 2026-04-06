import React from 'react';
import { InspectionFormData } from '@/lib/validations/inspection';
import { ShieldCheck, Mail, Phone, MapPin, Calendar, ClipboardCheck, Info } from 'lucide-react';

const STYLE = {
  BG_PAPER: 'bg-white',
  CARD_BG: 'bg-slate-50 border border-slate-100',
  ACCENT_TEXT: 'text-blue-600',
  PRIMARY_BLUE: 'bg-blue-600',
  TEXT_MAIN: 'text-slate-900',
  TEXT_GRAY: 'text-slate-500',
  BADGE: 'px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider',
};

interface PDFTemplateProps {
  data: InspectionFormData;
}

export const PDFTemplate: React.FC<PDFTemplateProps> = ({ data }) => {
  return (
    <div 
      id="inspection-report-pdf"
      className={`${STYLE.BG_PAPER} p-12 text-slate-800 font-sans`}
      style={{ width: '210mm', minHeight: '297mm' }} // Format A4
    >
      {/* Header Modern VestaCheck */}
      <div className="pdf-section flex justify-between items-center mb-10 pb-6 border-b border-slate-100">
        <div className="flex flex-col">
          <h1 className="text-2xl font-black text-slate-900 tracking-tighter flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-base">V</span>
            VESTACHECK
          </h1>
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.3em] mt-1">Rapport d'Inspection Officiel</p>
        </div>
        <div className="flex flex-col items-end gap-2 text-right">
           <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-[10px] font-black uppercase tracking-wider">
             {data.type === 'Entrée' ? 'Inspection d\'Entrée' : 'Inspection de Sortie'}
           </span>
           <p className="font-mono text-[10px] text-slate-400 font-bold tracking-widest uppercase">REF: #{data.id.slice(0, 8).toUpperCase()}</p>
        </div>
      </div>

      {/* Infos Générales */}
      <div className="pdf-section grid grid-cols-2 gap-10 mb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <MapPin size={14} className="text-blue-500" />
            <h3 className="font-black uppercase text-[10px] tracking-widest">Propriété & Date</h3>
          </div>
          <div className={`${STYLE.CARD_BG} p-5 rounded-2xl`}>
            <p className="text-lg font-black text-slate-900 mb-1 leading-tight">{data.propertyAddress}</p>
            <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5"><Calendar size={12} className="text-blue-400" /> {data.date}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <ClipboardCheck size={14} className="text-blue-500" />
            <h3 className="font-black uppercase text-[10px] tracking-widest">Locataire Concerné</h3>
          </div>
          <div className={`${STYLE.CARD_BG} p-5 rounded-2xl`}>
            <p className="text-lg font-black text-slate-900 mb-1 leading-tight">{data.tenantName}</p>
            <div className="space-y-1">
              <p className="text-xs text-slate-500 flex items-center gap-2 font-medium tracking-tight"><Mail size={12} className="text-slate-300" /> {data.tenantEmail}</p>
              <p className="text-xs text-slate-500 flex items-center gap-2 font-medium"><Phone size={12} className="text-slate-300" /> {data.tenantPhone}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Relevé des Compteurs */}
      <div className="pdf-section mb-12">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 text-center justify-center">
            RELEVÉ DES COMPTEURS
        </h3>
        <div className={`${STYLE.CARD_BG} rounded-2xl overflow-hidden`}>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-900 text-left text-[10px] uppercase tracking-widest font-black border-b border-slate-200">
                <th className="p-4 italic">Type de Compteur</th>
                <th className="p-4 italic">Valeur Relevée</th>
                <th className="p-4 italic text-right">Unité</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-700">
              <tr className="border-b border-slate-100 font-bold">
                <td className="p-4">Eau potable</td>
                <td className="p-4 text-blue-600 font-black">{data.counters.water}</td>
                <td className="p-4 text-slate-400 text-right">m³</td>
              </tr>
              <tr className="border-b border-slate-100 font-bold">
                <td className="p-4">Électricité</td>
                <td className="p-4 text-amber-600 font-black">{data.counters.electricity}</td>
                <td className="p-4 text-slate-400 text-right">kWh</td>
              </tr>
              {data.counters.gas !== undefined && (
                <tr className="font-bold">
                  <td className="p-4">Gaz naturel</td>
                  <td className="p-4 text-orange-600 font-black">{data.counters.gas}</td>
                  <td className="p-4 text-slate-400 text-right">m³</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inventaire des Clés */}
      <div className="pdf-section mb-12">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 text-center justify-center font-serif">
            INVENTAIRE DES CLÉS ET BADGES
        </h3>
        <div className={`${STYLE.CARD_BG} rounded-2xl overflow-hidden`}>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-900 text-left text-[10px] uppercase tracking-widest font-black border-b border-slate-200">
                <th className="p-4 italic">Désignation</th>
                <th className="p-4 italic text-right">Nombre</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-700">
              {data.keyInventories.map((key, idx) => (
                <tr key={key.id} className={`${idx !== data.keyInventories.length - 1 ? 'border-b border-slate-100' : ''} font-bold`}>
                  <td className="p-4">{key.type}</td>
                  <td className="p-4 text-blue-600 font-black text-right">{key.count}</td>
                </tr>
              ))}
              {data.keyInventories.length === 0 && (
                <tr>
                  <td colSpan={2} className="p-4 text-center text-slate-400 italic py-6 font-medium">
                    Aucun trousseau répertorié.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* État des Pièces */}
      <div className="mb-12">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 text-center justify-center">
            DESCRIPTIF DÉTAILLÉ DES PIÈCES
        </h3>
        {data.rooms.map((room) => (
          <div key={room.id} className="pdf-section mb-8 break-inside-avoid">
            <div className="bg-slate-900 p-3 rounded-t-xl flex justify-between items-center text-white">
              <span className="font-black uppercase tracking-widest text-xs">{room.name}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">{room.items.length} éléments</span>
            </div>
            <div className="border-x border-b border-slate-100 rounded-b-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="text-[10px] uppercase text-slate-400 bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="text-left py-3 px-4 italic font-black">Élément</th>
                    <th className="text-left py-3 px-4 italic font-black">État</th>
                    <th className="text-left py-3 px-4 italic font-black">Observations</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700">
                  {room.items.map((item) => (
                    <tr key={item.id} className="border-b border-slate-50 last:border-0">
                      <td className="py-4 px-4 font-black text-slate-900">{item.label}</td>
                      <td className="py-4 px-4">
                        <span className={`${STYLE.BADGE} ${
                          item.condition === 'Neuf' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          item.condition === 'Très Bon' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                          item.condition === 'Bon' ? 'bg-sky-50 text-sky-700 border border-sky-100' :
                          item.condition === 'Usage' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 
                          'bg-red-50 text-red-700 border border-red-100'
                        }`}>
                          {item.condition}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-500 italic text-xs leading-relaxed">
                        {item.comment || 'Aucune observation.'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Zone de Signatures */}
      <div className="pdf-section mb-12 break-inside-avoid">
        <div className={`${STYLE.CARD_BG} p-10 rounded-3xl`}>
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] mb-10 text-center">
              VALIDATION & SIGNATURES
          </h3>
          <div className="grid grid-cols-2 gap-16">
            <div className="text-center">
              <p className="text-[10px] font-black text-blue-600 uppercase mb-4 tracking-widest">Le Locataire</p>
              <div className="h-32 bg-white rounded-2xl flex items-center justify-center border border-slate-100 overflow-hidden relative shadow-sm">
                {data.signatures.tenant.drawData ? (
                  <img src={data.signatures.tenant.drawData} alt="Signature Locataire" className="max-h-full max-w-full mix-blend-multiply" />
                ) : (
                  <span className="text-slate-300 text-[10px] uppercase font-black tracking-tighter">Document non signé</span>
                )}
              </div>
              <p className="mt-4 text-xs font-black text-slate-900 uppercase tracking-tight">{data.tenantName}</p>
              {data.signatures.tenant.signedAt && (
                <p className="text-[9px] text-slate-400 mt-1 font-medium">Le {new Date(data.signatures.tenant.signedAt).toLocaleDateString('fr-FR')} à {new Date(data.signatures.tenant.signedAt).toLocaleTimeString('fr-FR')}</p>
              )}
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black text-blue-600 uppercase mb-4 tracking-widest">L'Inspecteur</p>
              <div className="h-32 bg-white rounded-2xl flex items-center justify-center border border-slate-100 overflow-hidden relative shadow-sm">
                {data.signatures.inspector.drawData ? (
                  <img src={data.signatures.inspector.drawData} alt="Signature Inspecteur" className="max-h-full max-w-full mix-blend-multiply" />
                ) : (
                  <span className="text-slate-300 text-[10px] uppercase font-black tracking-tighter">Document non signé</span>
                )}
              </div>
              <p className="mt-4 text-xs font-black text-slate-900 uppercase tracking-tight font-serif italic text-blue-600">VestaCheck Agent</p>
              {data.signatures.inspector.signedAt && (
                <p className="text-[9px] text-slate-400 mt-1 font-medium">Le {new Date(data.signatures.inspector.signedAt).toLocaleDateString('fr-FR')} à {new Date(data.signatures.inspector.signedAt).toLocaleTimeString('fr-FR')}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Annexe Photo */}
      <div className="pdf-section mt-20 border-t border-slate-100 pt-12 break-before-page">
        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-8 flex items-center gap-3">
          <Info size={20} className="text-blue-500" /> Annexe Photographique
        </h3>
        
        {data.rooms.map((room) => {
          const roomPhotos = room.items.flatMap(item => item.photos.map(p => ({ ...p, itemLabel: item.label })));
          if (roomPhotos.length === 0) return null;

          return (
            <div key={`photos-${room.id}`} className="pdf-section mb-16">
              <div className="flex items-center gap-4 mb-6">
                <h4 className="font-black text-slate-900 text-sm uppercase tracking-widest">{room.name}</h4>
                <div className="h-px flex-1 bg-slate-100"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase">{roomPhotos.length} clichés</span>
              </div>
              <div className="grid grid-cols-2 gap-6">
                {roomPhotos.map((photo, idx) => (
                  <div key={photo.id} className="space-y-2 break-inside-avoid">
                      <div className="aspect-video bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                        <img 
                          src={photo.compressedBase64} 
                          alt={`${room.name} - ${photo.itemLabel}`} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider px-2 flex justify-between">
                        <span>IMG #{idx + 1}</span>
                        <span className="text-blue-600">{photo.itemLabel}</span>
                      </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer / Mentions Légales */}
      <div className="pdf-section mt-12 py-10 border-t border-slate-100 text-center">
          <p className="text-[8px] text-slate-400 uppercase tracking-[0.3em] font-black leading-loose">
            DOCUMENT CERTIFIÉ PAR VESTACHECK &copy; 2026<br />
            Signatures électroniques conformes au règlement eIDAS (UE) n°910/2014.<br />
            Toute modification non autorisée invalide ce rapport.
          </p>
      </div>
    </div>
  );
};
