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

      <fieldset disabled={isLocked} className="space-y-6">
        {roomFields.map((room, roomIndex) => (
          <RoomCard 
            key={room.id} 
            roomIndex={roomIndex} 
            isLocked={isLocked}
            onRemove={() => removeRoom(roomIndex)} 
          />
        ))}
      </fieldset>

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
    <div className="bg-slate-900/40 rounded-2xl shadow-xl border border-white/5 overflow-hidden backdrop-blur-sm group/room transition-all hover:border-white/10 mx-2">
      <div className="bg-slate-950/40 px-6 py-4 border-b border-white/5 flex justify-between items-center">
        <div className="flex items-center gap-3 flex-1">
          <input
            {...register(`rooms.${roomIndex}.name`)}
            placeholder="Nom de la pièce (ex: Salon...)"
            className="bg-transparent font-bold text-white outline-none border-b border-transparent focus:border-blue-500/50 w-full md:w-1/3 text-lg placeholder:text-slate-600"
          />
        </div>
        {!isLocked && (
          <button
            type="button"
            onClick={onRemove}
            className="text-slate-500 hover:text-red-400 p-2 rounded-xl hover:bg-red-500/10 transition-all opacity-0 group-hover/room:opacity-100"
          >
            <Trash2 size={20} />
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[10px] uppercase tracking-[0.15em] text-slate-500 bg-slate-950/20">
              <th className="px-8 py-3 font-bold">Élément</th>
              <th className="px-4 py-3 font-bold w-40">État</th>
              <th className="px-4 py-3 font-bold text-right md:text-left">Observations</th>
              <th className="px-4 py-3 font-bold w-28 text-center">Photos</th>
              {!isLocked && <th className="px-4 py-3 w-12"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {itemFields.map((item, itemIndex) => (
              <tr key={item.id} className="group/item hover:bg-white/[0.02] transition-colors">
                <td className="px-8 py-4">
                  <input
                    {...register(`rooms.${roomIndex}.items.${itemIndex}.label` as const)}
                    list={`suggestions-${roomIndex}`}
                    className="w-full bg-transparent border-b border-transparent focus:border-blue-500/30 outline-none text-sm font-medium text-slate-200 placeholder:text-slate-700"
                    placeholder="Désignation..."
                  />
                  <datalist id={`suggestions-${roomIndex}`}>
                    {ITEM_SUGGESTIONS.map(s => <option key={s} value={s} />)}
                  </datalist>
                </td>
                <td className="px-4 py-4">
                  <select
                    {...register(`rooms.${roomIndex}.items.${itemIndex}.condition` as const)}
                    className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all appearance-none cursor-pointer"
                  >
                    {ConditionSchema.options.map(opt => (
                      <option key={opt} value={opt} className="bg-slate-900 text-white">{opt}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-4">
                  <input
                    {...register(`rooms.${roomIndex}.items.${itemIndex}.comment` as const)}
                    placeholder="Ajouter une observation..."
                    className="w-full bg-transparent border-b border-transparent focus:border-blue-500/30 outline-none text-xs text-slate-400 placeholder:text-slate-700 italic"
                  />
                </td>
                <td className="px-4 py-4 text-center">
                  <div className="flex justify-center scale-90">
                    <PhotoManager roomIndex={roomIndex} itemIndex={itemIndex} />
                  </div>
                </td>
                {!isLocked && (
                  <td className="px-4 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => removeItem(itemIndex)}
                      className="opacity-0 group-hover/item:opacity-100 text-slate-600 hover:text-red-400 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        
        {!isLocked && (
          <div className="p-4 bg-slate-950/20 flex justify-center border-t border-white/5">
            <button
              type="button"
              onClick={() => appendItem({ id: crypto.randomUUID(), label: '', condition: 'Bon', comment: '', photos: [] })}
              className="flex items-center gap-2 text-[10px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-widest transition-all py-2 px-6 rounded-xl hover:bg-blue-500/10 border border-transparent hover:border-blue-500/20"
            >
              <Plus size={14} /> Ajouter un élément
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
