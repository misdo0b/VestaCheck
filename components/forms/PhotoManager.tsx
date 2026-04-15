import React, { useRef, useState } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { InspectionFormData } from '@/lib/validations/inspection';
import { Camera, X, Cloud, CloudOff, Loader2, Image as ImageIcon } from 'lucide-react';
import { compressImage } from '@/lib/utils/image';
import { PhotoBlobStorage } from '@/lib/utils/blob-storage';

interface PhotoManagerProps {
  roomIndex: number;
  itemIndex: number;
}

export const PhotoManager: React.FC<PhotoManagerProps> = ({ roomIndex, itemIndex }) => {
  const { control, watch } = useFormContext<InspectionFormData>();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tenantSig = watch('signatures.tenant.drawData');
  const inspectorSig = watch('signatures.inspector.drawData');
  const isLocked = !!(tenantSig || inspectorSig);

  const { fields, append, remove } = useFieldArray({
    control,
    name: `rooms.${roomIndex}.items.${itemIndex}.photos` as const
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const currentPhotos = fields.length;
      for (let i = 0; i < files.length; i++) {
        if (currentPhotos + i >= 4) break; 

        const file = files[i];
        const { full, thumb } = await compressImage(file);
        
        const photoId = crypto.randomUUID();

        // 1. Sauvegarde HD dans IndexedDB (Caché de la RAM React/Zustand)
        await PhotoBlobStorage.savePhotoHD(photoId, full);

        // 2. Ajout de la miniature au formulaire (Léger)
        append({
          id: photoId,
          compressedBase64: thumb,
          hasFullRes: true,
          isSynced: false
        });
      }
    } catch (err) {
      console.error("Erreur capture photo:", err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = async (index: number, photoId: string) => {
     // 1. Nettoyage IndexedDB
     await PhotoBlobStorage.deletePhotoHD(photoId);
     // 2. Retrait du formulaire
     remove(index);
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Liste des miniatures */}
      {fields.map((photo, pIndex) => (
        <div key={photo.id} className="relative group w-12 h-12 rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
          <img 
            src={(photo as any).compressedBase64} 
            alt="Capture" 
            className="w-full h-full object-cover transition-transform group-hover:scale-110"
          />
          
          {/* Indicateur de synchro */}
          <div className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/40 text-white backdrop-blur-[1px]">
            {(photo as any).isSynced ? (
              <Cloud size={8} className="text-green-400" />
            ) : (
              <CloudOff size={8} className="text-orange-400" />
            )}
          </div>

          {/* Bouton supprimer */}
          <button
            type="button"
            onClick={() => handleRemove(pIndex, (photo as any).id)}
            className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
          >
            <X size={14} />
          </button>
        </div>
      ))}

      {/* Bouton Ajouter (si < 4 photos) */}
      {fields.length < 4 && (
        <button
          type="button"
          onClick={triggerUpload}
          disabled={isUploading}
          className="w-12 h-12 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 hover:text-blue-500 hover:border-blue-300 transition-all bg-white"
          title="Ajouter une photo (depuis fichier ou caméra mobile)"
        >
          {isUploading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Camera size={18} />
          )}
        </button>
      )}

      {/* Input caché pour le support mobile caméra + fichier local */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        multiple
        className="hidden"
        // capture="environment" // Optionnel : force la caméra direct si mobile, mais multiple=true peut entrer en conflit selon l'OS
      />
    </div>
  );
};
