'use server';

import { v2 as cloudinary } from 'cloudinary';
import { auth } from '@/lib/auth';

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Server Action pour uploader une photo d'inspection vers Cloudinary.
 * Sécurisée par NextAuth v5.
 */
export async function uploadInspectionPhoto(
  base64Data: string,
  metadata: {
    propertyId: string;
    organizationId: string;
    agencyId: string;
  }
): Promise<UploadResult> {
  try {
    // 1. Vérification de la session
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Non autorisé' };
    }

    // 2. Construction du chemin de dossier hiérarchique
    // Format: vestacheck/[orgId]/[agencyId]/[propertyId]
    const folderPath = `vestacheck/${metadata.organizationId}/${metadata.agencyId}/${metadata.propertyId}`;

    // 3. Upload vers Cloudinary avec transformations
    const uploadResponse = await cloudinary.uploader.upload(base64Data, {
      folder: folderPath,
      resource_type: 'image',
      // Transformations à la volée pour optimisation
      transformation: [
        { width: 1200, crop: 'limit' }, // Redimensionnement intelligent
        { quality: 'auto' },            // Compression auto
        { fetch_format: 'auto' },        // Format auto (WebP si supporté)
      ],
    });

    return {
      success: true,
      url: uploadResponse.secure_url,
    };
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de l\'upload',
    };
  }
}
