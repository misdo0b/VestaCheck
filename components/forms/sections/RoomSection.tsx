import React from 'react';
import { useFormContext, useFieldArray, useWatch } from 'react-hook-form';
import { InspectionFormData, ConditionSchema } from '@/lib/validations/inspection';
import { PlusCircle, Trash2, Camera, Plus } from 'lucide-react';
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
    <div className={`mb-8 ${isLocked ? 'opacity-75' : ''}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          🖼️ Pièces & Éléments
        </h2>
        {!isLocked && (
          <button
            type="button"
            onClick={addRoom}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-bold"
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-100 flex justify-between items-center">
        <input
          {...register(`rooms.${roomIndex}.name`)}
          placeholder="Nom de la pièce (ex: Salon...)"
          className="bg-transparent font-bold text-gray-800 outline-none border-b border-transparent focus:border-blue-500 w-1/3 text-base"
        />
        {!isLocked && (
          <button
            type="button"
            onClick={onRemove}
            className="text-red-400 hover:text-red-600 p-1 rounded-full transition-colors"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>

      <div className="p-0 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-gray-400 bg-gray-50/50">
              <th className="px-6 py-2 font-semibold">Élément</th>
              <th className="px-4 py-2 font-semibold w-32">État</th>
              <th className="px-4 py-2 font-semibold">Observations</th>
              <th className="px-4 py-2 font-semibold w-24 text-center">Photos</th>
              {!isLocked && <th className="px-4 py-2 w-10"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {itemFields.map((item, itemIndex) => (
              <tr key={item.id} className="group hover:bg-blue-50/30 transition-colors">
                <td className="px-6 py-3">
                  <input
                    {...register(`rooms.${roomIndex}.items.${itemIndex}.label` as const)}
                    list={`suggestions-${roomIndex}`}
                    className="w-full bg-transparent border-b border-transparent focus:border-blue-300 outline-none text-sm font-medium text-gray-700"
                    placeholder="Élément..."
                  />
                  <datalist id={`suggestions-${roomIndex}`}>
                    {ITEM_SUGGESTIONS.map(s => <option key={s} value={s} />)}
                  </datalist>
                </td>
                <td className="px-4 py-3">
                  <select
                    {...register(`rooms.${roomIndex}.items.${itemIndex}.condition` as const)}
                    className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {ConditionSchema.options.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <input
                    {...register(`rooms.${roomIndex}.items.${itemIndex}.comment` as const)}
                    placeholder="Observations..."
                    className="w-full bg-transparent border-b border-transparent focus:border-blue-300 outline-none text-xs text-gray-500"
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex justify-center">
                    <PhotoManager roomIndex={roomIndex} itemIndex={itemIndex} />
                  </div>
                </td>
                {!isLocked && (
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => removeItem(itemIndex)}
                      className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all font-bold"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        
        {!isLocked && (
          <div className="p-3 bg-gray-50/30 flex justify-center border-t border-gray-50">
            <button
              type="button"
              onClick={() => appendItem({ id: crypto.randomUUID(), label: '', condition: 'Bon', comment: '', photos: [] })}
              className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-widest transition-colors py-1 px-3 rounded-full hover:bg-blue-50"
            >
              <Plus size={14} /> Ajouter un élément
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
