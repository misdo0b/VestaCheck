import { InspectionReport, Room, InspectionItem, PhotoMetadata } from "@/types";

/**
 * Clone une structure d'inspection en régénérant tous les identifiants uniques.
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

/**
 * Convertit un objet (ou un tableau d'objets) de snake_case vers camelCase.
 */
export function snakeToCamel(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(v => snakeToCamel(v));
  } else if (obj !== null && typeof obj === 'object' && !(obj instanceof Date) && !(obj instanceof Blob)) {
    const result: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const camelKey = key.replace(/(_\w)/g, (m) => m[1].toUpperCase());
        result[camelKey] = snakeToCamel(obj[key]);
      }
    }
    return result;
  }
  return obj;
}

/**
 * Convertit un objet (ou un tableau d'objets) de camelCase vers snake_case.
 */
export function camelToSnake(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(v => camelToSnake(v));
  } else if (obj !== null && typeof obj === 'object' && !(obj instanceof Date) && !(obj instanceof Blob)) {
    const result: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const snakeKey = key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
        result[snakeKey] = camelToSnake(obj[key]);
      }
    }
    return result;
  }
  return obj;
}
