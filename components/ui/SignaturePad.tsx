import React, { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { X, RotateCcw, Check } from 'lucide-react';

interface SignaturePadProps {
  onSave: (base64: string) => void;
  onClose: () => void;
  title: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, title }) => {
  const sigCanvas = useRef<SignatureCanvas>(null);

  const clear = () => {
    sigCanvas.current?.clear();
  };

  const save = () => {
    if (sigCanvas.current?.isEmpty()) return;
    const base64 = sigCanvas.current?.getCanvas().toDataURL('image/png');
    if (base64) {
      onSave(base64);
    }
  };

  return (
    <div className="w-full bg-slate-200 rounded-2xl overflow-hidden border border-blue-500/20 shadow-inner group/pad transition-all duration-300">
      <div className="px-4 py-2 border-b border-slate-300 flex justify-between items-center bg-slate-300/50">
        <h3 className="font-bold text-slate-700 text-[10px] uppercase tracking-widest">{title}</h3>
        <button 
          onClick={clear}
          className="text-slate-400 hover:text-slate-600 transition-colors"
          title="Effacer"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      <div className="p-4">
        <div className="bg-slate-50/80 rounded-xl overflow-hidden cursor-crosshair border border-slate-300/50 shadow-sm">
          <SignatureCanvas
            ref={sigCanvas}
            penColor="black"
            canvasProps={{
              width: 500,
              height: 180,
              className: 'signature-canvas w-full h-[180px]'
            }}
          />
        </div>
        
        <p className="text-[9px] text-slate-500 mt-3 text-center italic font-medium uppercase tracking-tighter">
          Signez à l'aide de votre doigt ou d'un stylet
        </p>
      </div>

      <div className="px-4 py-3 bg-slate-300/30 border-t border-slate-300 flex justify-center">
        <button
          onClick={save}
          className="flex items-center gap-2 px-6 py-2 text-xs font-black text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95 uppercase tracking-widest"
        >
          <Check size={14} /> Valider
        </button>
      </div>
    </div>
  );
};
