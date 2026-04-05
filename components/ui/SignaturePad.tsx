import React, { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { X, RotateCcw, Check } from 'lucide-react';

interface SignaturePadProps {
  onSave: (base64: string) => void;
  onClose: () => void;
  title: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, onClose, title }) => {
  const sigCanvas = useRef<SignatureCanvas>(null);

  const clear = () => {
    sigCanvas.current?.clear();
  };

  const save = () => {
    if (sigCanvas.current?.isEmpty()) return;
    // Utilisation de getCanvas() au lieu de getTrimmedCanvas() pour éviter les erreurs de dépendances (trim-canvas)
    const base64 = sigCanvas.current?.getCanvas().toDataURL('image/png');
    if (base64) {
      onSave(base64);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 overflow-hidden cursor-crosshair">
            <SignatureCanvas
              ref={sigCanvas}
              penColor="black"
              canvasProps={{
                width: 500,
                height: 250,
                className: 'signature-canvas w-full h-[250px]'
              }}
            />
          </div>
          
          <p className="text-xs text-gray-400 mt-3 text-center italic">
            Signez à l'aide de votre doigt ou d'un stylet dans la zone ci-dessus
          </p>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={clear}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RotateCcw size={16} /> Effacer
          </button>
          <button
            onClick={save}
            className="flex items-center gap-2 px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg shadow-blue-200 transition-all active:scale-95"
          >
            <Check size={16} /> Valider la signature
          </button>
        </div>
      </div>
    </div>
  );
};
