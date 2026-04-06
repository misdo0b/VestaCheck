import { set, get, del } from 'idb-keyval';

/**
 * Stockage asynchrone pour les photos haute résolution (Base64 lourds)
 * Cela permet de ne pas charger la RAM du store Zustand.
 */
export const PhotoBlobStorage = {
  /**
   * Sauvegarde une photo HD
   */
  async savePhotoHD(id: string, data: string): Promise<void> {
    try {
      await set(`vestacheck-hd-photo-${id}`, data);
      console.log(`[PhotoBlobStorage] HD photo saved: ${id}`);
    } catch (error) {
      console.error(`[PhotoBlobStorage] Error saving photo ${id}:`, error);
    }
  },

  /**
   * Récupère une photo HD
   */
  async getPhotoHD(id: string): Promise<string | undefined> {
    try {
      return await get(`vestacheck-hd-photo-${id}`);
    } catch (error) {
      console.error(`[PhotoBlobStorage] Error fetching photo ${id}:`, error);
      return undefined;
    }
  },

  /**
   * Supprime une photo HD
   */
  async deletePhotoHD(id: string): Promise<void> {
    try {
      await del(`vestacheck-hd-photo-${id}`);
      console.log(`[PhotoBlobStorage] HD photo deleted: ${id}`);
    } catch (error) {
      console.error(`[PhotoBlobStorage] Error deleting photo ${id}:`, error);
    }
  }
};
