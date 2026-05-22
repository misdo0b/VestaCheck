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

const toCamel = (s: string) => {
  return s.replace(/([-_][a-z])/gi, ($1) => {
    return $1.toUpperCase()
      .replace('-', '')
      .replace('_', '');
  });
};

const toSnake = (s: string) => {
  return s.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

export const snakeToCamel = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => snakeToCamel(v));
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((result, key) => {
      result[toCamel(key)] = snakeToCamel(obj[key]);
      return result;
    }, {} as any);
  }
  return obj;
};

export const camelToSnake = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => camelToSnake(v));
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((result, key) => {
      result[toSnake(key)] = camelToSnake(obj[key]);
      return result;
    }, {} as any);
  }
  return obj;
};

