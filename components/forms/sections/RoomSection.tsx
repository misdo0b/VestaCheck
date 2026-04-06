import React from 'react';
import { useFormContext, useFieldArray, useWatch } from 'react-hook-form';
import { InspectionFormData, ConditionSchema } from '@/lib/validations/inspection';
import { PlusCircle, Trash2, Camera, Plus, LayoutGrid } from 'lucide-react';
import { PhotoManager } from '../PhotoManager';

const ITEM_SUGGESTIONS = ['Murs', 'Sols', 'Plafond', 'Fenêtres', 'Portes', 'Radiateur', 'Prises', 'Interrupteurs', 'Plinthes'];

export const RoomSection: React.FC = () => {
  const { register, control, watch, formState: { errors } } = useFormContext<InspectionFormData>();
  
  const tenantSig = watch('signatures.tenant.drawData');
  const inspectorSig = watch('signatures.inspector.drawData');
  const isLocked = !!(tenantSig || inspectorSig);

  const { fields: roomFields, append: appendRoom, remove: removeRoom } = useFieldArray({
    control,
    name: "rooms"
  });

  const addRoom = () => {
    appendRoom({
      id: crypto.randomUUID(),
      name: '',
      items: [
        { id: crypto.randomUUID(), label: 'Murs', condition: 'Bon', comment: '', photos: [] },
        { id: crypto.randomUUID(), label: 'Sols', condition: 'Bon', comment: '', photos: [] }
      ]
    });
  };

  return (
    <div className={`mb-12 ${isLocked ? 'opacity-75' : ''}`}>
      <div className="flex justify-between items-center mb-8 mx-2">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500/10 p-2 rounded-lg">
            <LayoutGrid className="text-blue-400" size={24} />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Pièces & Éléments
          </h2>
        </div>
        {!isLocked && (
          <button
            type="button"
            onClick={addRoom}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 text-sm font-bold border border-blue-400/50 active:scale-95"
          >
            <PlusCircle size={18} /> Ajouter une pièce
          </button>
        )}
      </div>

      <div className="space-y-6">
        {roomFields.map((room, roomIndex) => (
          <RoomCard 
            key={room.id} 
            roomIndex={roomIndex} 
            isLocked={isLocked}
            onRemove={() => removeRoom(roomIndex)} 
          />
        ))}
      </div>

      {errors.rooms && (
        <p className="text-red-500 text-sm mt-4 text-center italic">{errors.rooms.message}</p>
      )}
    </div>
  );
};

const RoomCard: React.FC<{ roomIndex: number; onRemove: () => void; isLocked: boolean }> = ({ roomIndex, onRemove, isLocked }) => {
  const { register, control } = useFormContext<InspectionFormData>();
  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({
    control,
    name: `rooms.${roomIndex}.items` as const
  });

  return (
    <div className="bg-slate-900/40 rounded-3xl shadow-xl border border-white/5 overflow-hidden backdrop-blur-sm group/room transition-all hover:border-white/10 mx-2">
      {/* En-tête de la pièce */}
      <div className="bg-slate-950/40 px-6 py-5 border-b border-white/5 flex justify-between items-center sm:gap-4 flex-wrap">
        <div className="flex items-center gap-4 flex-1 min-w-[200px]">
          <div className="p-2 bg-blue-500/10 rounded-xl">
             <LayoutGrid className="text-blue-400" size={18} />
          </div>
          <input
            {...register(`rooms.${roomIndex}.name`)}
            placeholder="Ex : Salon, Cuisine..."
            className="bg-transparent font-bold text-white outline-none border-b border-transparent focus:border-blue-500/50 w-full text-lg placeholder:text-slate-600 focus:placeholder:text-slate-700 transition-all"
          />
        </div>
        {!isLocked && (
          <button
            type="button"
            onClick={onRemove}
            className="text-slate-500 hover:text-red-400 p-2.5 rounded-xl hover:bg-red-500/10 transition-all opacity-0 group-hover/room:opacity-100"
            title="Supprimer la pièce"
          >
            <Trash2 size={20} />
          </button>
        )}
      </div>

      {/* Liste des éléments en Cartes (Refonte Mobile-First) */}
      <div className="p-4 sm:p-6 grid grid-cols-1 gap-4">
        {itemFields.map((item, itemIndex) => (
          <InspectionItemCard 
            key={item.id} 
            roomIndex={roomIndex} 
            itemIndex={itemIndex} 
            isLocked={isLocked} 
            onRemove={() => removeItem(itemIndex)} 
          />
        ))}
        
        {!isLocked && (
          <button
            type="button"
            onClick={() => appendItem({ id: crypto.randomUUID(), label: '', condition: 'Bon', comment: '', photos: [] })}
            className="mt-2 flex items-center justify-center gap-2 py-4 border-2 border-dashed border-white/5 rounded-2xl text-[10px] font-black text-slate-500 hover:text-blue-400 hover:border-blue-500/20 hover:bg-blue-500/5 uppercase tracking-widest transition-all active:scale-[0.98]"
          >
            <Plus size={16} /> Ajouter un élément
          </button>
        )}
      </div>
    </div>
  );
};

const InspectionItemCard: React.FC<{ 
  roomIndex: number; 
  itemIndex: number; 
  isLocked: boolean;
  onRemove: () => void 
}> = ({ roomIndex, itemIndex, isLocked, onRemove }) => {
  const { register, watch } = useFormContext<InspectionFormData>();
  const condition = watch(`rooms.${roomIndex}.items.${itemIndex}.condition`);

  // Couleurs conditionnelles pour l'UX
  const getConditionStyles = (c: string) => {
    switch (c) {
      case 'Neuf': return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5';
      case 'Très Bon': return 'text-blue-400 border-blue-500/20 bg-blue-500/5';
      case 'Bon': return 'text-slate-300 border-white/10 bg-white/5';
      case 'Usage': return 'text-amber-400 border-amber-500/20 bg-amber-500/5';
      case 'Mauvais': return 'text-red-400 border-red-500/20 bg-red-500/5';
      default: return 'text-slate-400 border-white/10 bg-white/5';
    }
  };

  return (
    <div className={`p-4 rounded-2xl border transition-all duration-300 group/item ${getConditionStyles(condition)} hover:shadow-lg hover:shadow-black/20`}>
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Colonne 1 : Label & État */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <input
              {...register(`rooms.${roomIndex}.items.${itemIndex}.label` as const)}
              list={`suggestions-${roomIndex}`}
              className="flex-1 bg-transparent border-b border-white/10 focus:border-blue-500/50 outline-none text-sm font-bold text-white placeholder:text-slate-700"
              placeholder="Désignation de l'élément..."
            />
            <datalist id={`suggestions-${roomIndex}`}>
               {ITEM_SUGGESTIONS.map(s => <option key={s} value={s} />)}
            </datalist>
          </div>

          <div className="flex items-center gap-4">
             <div className="relative w-full sm:w-40">
                <select
                  {...register(`rooms.${roomIndex}.items.${itemIndex}.condition` as const)}
                  className={`w-full bg-slate-950/80 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer ${getConditionStyles(condition)}`}
                >
                  {ConditionSchema.options.map(opt => (
                    <option key={opt} value={opt} className="bg-slate-900 text-white font-semibold">{opt}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                  <Plus size={10} className="rotate-45" />
                </div>
             </div>
             
             {/* Observation condensée */}
             <div className="flex-1">
               <input
                 {...register(`rooms.${roomIndex}.items.${itemIndex}.comment` as const)}
                 placeholder="Ajouter une observation rapide..."
                 className="w-full bg-transparent border-b border-white/5 focus:border-white/20 outline-none text-[11px] text-slate-400 placeholder:text-slate-700 italic"
               />
             </div>
          </div>
        </div>

        {/* Colonne 2 : Photos & Actions */}
        <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-white/5 pt-3 sm:pt-0">
          <div className="scale-110 sm:scale-100">
            <PhotoManager roomIndex={roomIndex} itemIndex={itemIndex} />
          </div>
          
          {!isLocked && (
            <button
              type="button"
              onClick={onRemove}
              className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
              title="Supprimer l'élément"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
