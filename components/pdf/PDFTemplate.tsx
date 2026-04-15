import React from 'react';
import { InspectionFormData } from '@/lib/validations/inspection';
import { ShieldCheck, Mail, Phone, MapPin, Calendar, ClipboardCheck, Info } from 'lucide-react';

const STYLE = {
  BG_PAPER: 'bg-white',
  CARD_BG: 'bg-slate-50/50 border-[0.5pt] border-slate-200 h-full flex flex-col justify-center',
  SECTION_HEADER_BG: 'bg-slate-50 border-b-[0.5pt] border-slate-200',
  ACCENT_TEXT: 'text-blue-600',
  PRIMARY_BLUE: 'bg-blue-700',
  TEXT_MAIN: 'text-slate-900',
  TEXT_GRAY: 'text-slate-500',
  BADGE: 'inline-flex items-center justify-center px-3 py-1 rounded text-[9px] font-bold uppercase tracking-wider border-[0.5pt]',
};

// Injection de la police Inter
const InterFontStyle = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    #inspection-report-pdf, #inspection-report-pdf * {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
      -webkit-font-smoothing: antialiased;
    }
    .font-mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
    }
  `}} />
);

interface PDFTemplateProps {
  data: InspectionFormData;
  id?: string;
}

export const PDFTemplate: React.FC<PDFTemplateProps> = ({ data, id = 'inspection-report-pdf' }) => {
  return (
    <div 
      id={id}
      className={`${STYLE.BG_PAPER} p-12 text-slate-800`}
      style={{ width: '210mm', minHeight: '297mm' }} // Format A4
    >
      <InterFontStyle />
      {/* Header Répétable - Identifié par .pdf-header */}
      <div className="pdf-header flex justify-between items-center mb-10 pb-6 border-b-[0.5pt] border-slate-200 bg-white">
        <div className="flex items-center gap-3">
          <img 
            src="/assets/vestacheck-logo.png" 
            alt="Logo VestaCheck" 
            className="h-10 w-auto object-contain"
          />
        </div>
        <div className="text-right">
           <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">
             {data.type} • {data.date}
           </div>
           <div className="text-xs font-black text-slate-900">{data.tenantName}</div>
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
        <div className={`${STYLE.CARD_BG} rounded-xl overflow-hidden`}>
          <table className="w-full border-collapse">
            <thead>
              <tr className={`${STYLE.SECTION_HEADER_BG} text-slate-900 text-left text-[9px] uppercase tracking-widest font-bold`}>
                <th className="p-4">Type de Compteur</th>
                <th className="p-4">Valeur Relevée</th>
                <th className="p-4 text-right">Unité</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-700">
                <tr className="border-b-[0.5pt] border-slate-100 even:bg-slate-50/30">
                  <td className="p-4 font-medium">Eau potable</td>
                  <td className="p-4 text-blue-700 font-mono font-bold text-base">{String(data.counters?.water ?? '0')}</td>
                  <td className="p-4 text-slate-400 text-right font-medium">m³</td>
                </tr>
                <tr className="border-b-[0.5pt] border-slate-100 even:bg-slate-50/30">
                  <td className="p-4 font-medium">Électricité</td>
                  <td className="p-4 text-amber-700 font-mono font-bold text-base">{String(data.counters?.electricity ?? '0')}</td>
                  <td className="p-4 text-slate-400 text-right font-medium">kWh</td>
                </tr>
                {data.counters?.gas !== undefined && (
                  <tr className="even:bg-slate-50/30">
                    <td className="p-4 font-medium">Gaz naturel</td>
                    <td className="p-4 text-orange-700 font-mono font-bold text-base">{String(data.counters.gas ?? '0')}</td>
                    <td className="p-4 text-slate-400 text-right font-medium">m³</td>
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
          <div key={room.id} className="pdf-section mb-10 break-inside-avoid border-[0.5pt] border-slate-200 rounded-xl overflow-hidden">
            <div className={`${STYLE.SECTION_HEADER_BG} p-4 flex justify-between items-center`}>
              <span className="font-black uppercase tracking-widest text-xs text-slate-900">{room.name}</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase">{room.items.length} éléments</span>
            </div>
            <table className="w-full text-sm">
              <thead className="text-[9px] uppercase text-slate-400 bg-slate-50/50 border-b-[0.5pt] border-slate-100">
                <tr>
                  <th className="text-left py-3 px-4 font-bold">Élément</th>
                  <th className="text-left py-3 px-4 font-bold">État</th>
                  <th className="text-left py-3 px-4 font-bold">Observations</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                {room.items.map((item) => (
                  <tr key={item.id} className="border-b-[0.5pt] border-slate-100 last:border-0 even:bg-slate-50/30">
                    <td className="py-4 px-4 font-bold text-slate-900">{item.label}</td>
                    <td className="py-4 px-4">
                      <span className={`${STYLE.BADGE} ${
                        item.condition === 'Neuf' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        item.condition === 'Très Bon' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        item.condition === 'Bon' ? 'bg-sky-50 text-sky-700 border-sky-100' :
                        item.condition === 'Usage' ? 'bg-amber-50 text-amber-700 border-amber-100' : 
                        'bg-red-50 text-red-700 border-red-100'
                      }`}>
                        {item.condition}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-500 text-xs leading-relaxed">
                      {item.comment || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* Zone de Signatures */}
      <div className="pdf-section mb-12 break-inside-avoid">
        <div className={`${STYLE.CARD_BG} p-10 rounded-2xl`}>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-10 text-center">
              VALIDATION & SIGNATURES
          </h3>
          <div className="grid grid-cols-2 gap-12">
            <div className="text-center">
              <p className="text-[9px] font-bold text-blue-600 uppercase mb-4 tracking-widest">Le Locataire</p>
              <div className="h-32 bg-white rounded-xl flex items-center justify-center border-[0.5pt] border-slate-200 overflow-hidden relative shadow-sm">
                {data.signatures.tenant.drawData ? (
                  <img src={data.signatures.tenant.drawData} alt="Signature Locataire" className="max-h-full max-w-full mix-blend-multiply" />
                ) : (
                  <span className="text-slate-300 text-[9px] uppercase font-bold tracking-tight">Non signé</span>
                )}
              </div>
              <p className="mt-4 text-xs font-bold text-slate-900 uppercase tracking-tight">{data.tenantName}</p>
              {data.signatures.tenant.signedAt && (
                <p className="text-[8px] text-slate-400 mt-1 font-medium">Le {new Date(data.signatures.tenant.signedAt).toLocaleDateString('fr-FR')} ├á {new Date(data.signatures.tenant.signedAt).toLocaleTimeString('fr-FR')}</p>
              )}
            </div>
            <div className="text-center">
              <p className="text-[9px] font-bold text-blue-600 uppercase mb-4 tracking-widest">L'Inspecteur</p>
              <div className="h-32 bg-white rounded-xl flex items-center justify-center border-[0.5pt] border-slate-200 overflow-hidden relative shadow-sm">
                {data.signatures.inspector.drawData ? (
                  <img src={data.signatures.inspector.drawData} alt="Signature Inspecteur" className="max-h-full max-w-full mix-blend-multiply" />
                ) : (
                  <span className="text-slate-300 text-[9px] uppercase font-bold tracking-tight">Non signé</span>
                )}
              </div>
              <p className="mt-4 text-xs font-bold text-slate-900 uppercase tracking-tight">Agent VestaCheck</p>
              {data.signatures.inspector.signedAt && (
                <p className="text-[8px] text-slate-400 mt-1 font-medium">Le {new Date(data.signatures.inspector.signedAt).toLocaleDateString('fr-FR')} ├á {new Date(data.signatures.inspector.signedAt).toLocaleTimeString('fr-FR')}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Annexe Photo */}
      <div className="pdf-section mt-12 border-t border-slate-200 pt-16 break-before-page">
        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-10 flex items-center gap-3">
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
              <div className="grid grid-cols-2 gap-8">
                {roomPhotos.map((photo, idx) => (
                  <div key={photo.id} className="space-y-3 break-inside-avoid">
                      <div className="aspect-[4/3] bg-slate-50 rounded-xl overflow-hidden border-[0.5pt] border-slate-200 shadow-sm">
                        <img 
                          src={photo.compressedBase64} 
                          alt={`${room.name} - ${photo.itemLabel}`} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest px-1 flex justify-between">
                        <span>PI├êCE : {room.name}</span>
                        <span className="text-blue-700">{photo.itemLabel}</span>
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
