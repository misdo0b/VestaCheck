import { InspectionReport, Room, InspectionItem, PhotoMetadata } from "@/types";

/**
 * Clone une structure d'inspection en régénérant tous les identifiants uniques.
 * Indispensable lors de l'utilisation d'un template pour éviter les collisions en base de données.
 */
export const cloneWithNewIds = (data: Partial<InspectionReport>): any => {
  const newInspectionId = crypto.randomUUID();
  
  const rooms = (data.rooms || []).map((room: Room): Room => {
    const newRoomId = crypto.randomUUID();
    return {
      ...room,
      id: newRoomId,
      items: (room.items || []).map((item: InspectionItem): InspectionItem => {
        const newItemId = crypto.randomUUID();
        return {
          ...item,
          id: newItemId,
          photos: (item.photos || []).map((photo: PhotoMetadata): PhotoMetadata => ({
            ...photo,
            id: crypto.randomUUID(),
            isSynced: false,
            cloudUrl: undefined,
            status: 'PENDING'
          }))
        };
      })
    };
  });

  const keyInventories = (data.keyInventories || []).map((key: any) => ({
    ...key,
    id: crypto.randomUUID()
  }));

  return {
    ...data,
    id: newInspectionId,
    rooms,
    keyInventories,
    syncStatus: 'pending',
    isFinalized: false,
    lastModified: new Date().toISOString()
  };
};
