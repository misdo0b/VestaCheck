import React from 'react';
import { InspectionFormData } from '@/lib/validations/inspection';
import { ShieldCheck, Mail, Phone, MapPin, Calendar, ClipboardCheck, Info } from 'lucide-react';

interface PDFTemplateProps {
  data: InspectionFormData;
}

export const PDFTemplate: React.FC<PDFTemplateProps> = ({ data }) => {
  return (
    <div 
      id="inspection-report-pdf"
      className="bg-white p-12 text-gray-800 font-sans"
      style={{ width: '210mm', minHeight: '297mm' }} // Format A4
    >
      {/* Header Premium */}
      <div className="pdf-section flex justify-between items-start border-b-4 border-blue-600 pb-8 mb-10">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-4 rounded-2xl text-white shadow-lg">
            <ShieldCheck size={40} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">VESTACHECK</h1>
            <p className="text-blue-600 font-bold text-sm tracking-widest uppercase">Rapport d'État des Lieux</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-black text-gray-400 uppercase mb-1">Référence du Rapport</p>
          <p className="font-mono text-lg font-bold">#{data.id.slice(0, 8).toUpperCase()}</p>
        </div>
      </div>

      {/* Infos Générales */}
      <div className="pdf-section grid grid-cols-2 gap-10 mb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <MapPin size={18} />
            <h3 className="font-bold uppercase text-xs tracking-wider">Propriété et Date</h3>
          </div>
          <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
            <p className="text-lg font-bold text-gray-900 mb-1">{data.propertyAddress}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1"><Calendar size={14} /> {data.date}</span>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-black uppercase">{data.type}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <ClipboardCheck size={18} />
            <h3 className="font-bold uppercase text-xs tracking-wider">Locataire Concerné</h3>
          </div>
          <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
            <p className="text-lg font-bold text-gray-900 mb-1">{data.tenantName}</p>
            <div className="space-y-1">
              <p className="text-sm text-gray-500 flex items-center gap-2 underline"><Mail size={12} /> {data.tenantEmail}</p>
              <p className="text-sm text-gray-500 flex items-center gap-2"><Phone size={12} /> {data.tenantPhone}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section Compteurs */}
      <div className="pdf-section mb-12">
        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <div className="w-8 h-1 bg-blue-600 rounded"></div> Relevé des Compteurs
        </h3>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-900 text-white text-left text-[10px] uppercase tracking-widest font-bold">
              <th className="p-4 rounded-tl-xl italic">Type de Compteur</th>
              <th className="p-4 italic">Valeur Relevée</th>
              <th className="p-4 rounded-tr-xl italic">Unité</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            <tr className="border-b border-gray-100 font-bold">
              <td className="p-4">Eau</td>
              <td className="p-4 text-blue-600 font-black">{data.counters.water}</td>
              <td className="p-4 text-gray-400">m³</td>
            </tr>
            <tr className="border-b border-gray-100 font-bold">
              <td className="p-4">Électricité</td>
              <td className="p-4 text-yellow-600 font-black">{data.counters.electricity}</td>
              <td className="p-4 text-gray-400">kWh</td>
            </tr>
            {data.counters.gas !== undefined && (
              <tr className="border-b border-gray-100 font-bold">
                <td className="p-4">Gaz</td>
                <td className="p-4 text-orange-600 font-black">{data.counters.gas}</td>
                <td className="p-4 text-gray-400">m³</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* État des Pièces */}
      <div className="mb-12">
        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <div className="w-8 h-1 bg-blue-600 rounded"></div> Descriptif détaillé par pièce
        </h3>
        {data.rooms.map((room) => (
          <div key={room.id} className="pdf-section mb-8 break-inside-avoid">
            <div className="bg-gray-100 p-3 rounded-lg mb-4 flex justify-between items-center border-l-4 border-blue-600">
              <span className="font-black text-gray-800 uppercase tracking-wider">{room.name}</span>
              <span className="text-[10px] font-bold text-gray-400">{room.items.length} éléments inspectés</span>
            </div>
            <table className="w-full text-sm">
              <thead className="text-[10px] uppercase text-gray-400 border-b border-gray-100">
                <tr>
                  <th className="text-left py-2 px-4 italic">Élément</th>
                  <th className="text-left py-2 px-4 italic">État</th>
                  <th className="text-left py-2 px-4 italic">Observations</th>
                </tr>
              </thead>
              <tbody>
                {room.items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-gray-700">{item.label}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        item.condition === 'Neuf' ? 'bg-green-100 text-green-700' :
                        item.condition === 'Très Bon' ? 'bg-emerald-100 text-emerald-700' :
                        item.condition === 'Bon' ? 'bg-blue-100 text-blue-700' :
                        item.condition === 'Usage' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {item.condition}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 italic text-xs">
                      {item.comment || 'Aucune observation particulière.'}
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
        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2 text-center justify-center">
            Validation Juridique & Signatures
        </h3>
        <div className="grid grid-cols-2 gap-12">
          <div className="text-center pt-6 border-t border-gray-100">
            <p className="text-[10px] font-black text-blue-600 uppercase mb-4 tracking-widest">Le Locataire</p>
            <div className="h-32 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 overflow-hidden relative">
              {data.signatures.tenant.drawData ? (
                <img src={data.signatures.tenant.drawData} alt="Signature Locataire" className="max-h-full max-w-full mix-blend-multiply" />
              ) : (
                <span className="text-gray-300 text-xs italic">Document non signé</span>
              )}
            </div>
            <p className="mt-2 text-xs font-bold text-gray-900">{data.tenantName}</p>
            {data.signatures.tenant.signedAt && (
              <p className="text-[8px] text-gray-400 mt-1">Signé électroniquement le {new Date(data.signatures.tenant.signedAt).toLocaleDateString('fr-FR')}</p>
            )}
          </div>
          <div className="text-center pt-6 border-t border-gray-100">
            <p className="text-[10px] font-black text-blue-600 uppercase mb-4 tracking-widest">L'Inspecteur</p>
            <div className="h-32 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 overflow-hidden relative">
              {data.signatures.inspector.drawData ? (
                <img src={data.signatures.inspector.drawData} alt="Signature Inspecteur" className="max-h-full max-w-full mix-blend-multiply" />
              ) : (
                <span className="text-gray-300 text-xs italic">Document non signé</span>
              )}
            </div>
            <p className="mt-2 text-xs font-bold text-gray-900">Agent VestaCheck</p>
            {data.signatures.inspector.signedAt && (
              <p className="text-[8px] text-gray-400 mt-1">Signé électroniquement le {new Date(data.signatures.inspector.signedAt).toLocaleDateString('fr-FR')}</p>
            )}
          </div>
        </div>
      </div>

      {/* Annexe Photo (Page distincte conceptuelle) */}
      <div className="pdf-section mt-20 border-t-2 border-gray-200 pt-10 break-before-page">
        <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-6 flex items-center gap-3">
          <Info size={24} className="text-blue-600" /> Annexe Photographique
        </h3>
        <p className="text-xs text-gray-500 mb-8 italic">
          Cette annexe contient les preuves visuelles recueillies lors de l'inspection pour compléter le descriptif textuel.
        </p>

        {data.rooms.map((room) => {
          const roomPhotos = room.items.flatMap(item => item.photos.map(p => ({ ...p, itemLabel: item.label })));
          if (roomPhotos.length === 0) return null;

          return (
            <div key={`photos-${room.id}`} className="pdf-section mb-12">
              <h4 className="font-bold text-gray-800 bg-gray-50 py-2 px-4 rounded-md mb-4 flex justify-between text-sm">
                <span>{room.name}</span>
                <span className="text-xs text-gray-400 font-medium font-mono lowercase tracking-normal italic">{roomPhotos.length} clichés</span>
              </h4>
              <div className="grid grid-cols-2 gap-4">
                {roomPhotos.map((photo, idx) => (
                  <div key={photo.id} className="space-y-1 break-inside-avoid">
                      <div className="aspect-video bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                        <img 
                          src={photo.compressedBase64} 
                          alt={`${room.name} - ${photo.itemLabel}`} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-1">
                        Img #{idx + 1} — {photo.itemLabel}
                      </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer / Mentions Légales */}
      <div className="pdf-section mt-12 pt-10 border-t border-gray-100 text-center">
          <p className="text-[8px] text-gray-400 uppercase tracking-[0.2em] font-medium leading-relaxed">
            Ce document à valeur probante est certifié par VestaCheck.<br />
            Signatures électroniques conformes au règlement eIDAS (UE) n°910/2014.<br />
            &copy; 2026 VestaCheck Technologies. Tous droits réservés.
          </p>
      </div>
    </div>
  );
};
