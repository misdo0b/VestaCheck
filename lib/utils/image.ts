/**
 * Utility to compress images using Canvas API
 */

export const compressImage = (file: File, maxWidth: number = 1200, quality: number = 0.7): Promise<{ full: string, thumb: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        // Prepare Full Res Base64 (original or slightly optimized)
        const fullRes = event.target?.result as string;

        // Prepare Compressed Version (Thumbnail/Offline)
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Resize if too large
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Export as JPEG with specific quality to hit ~100kb target
        const thumb = canvas.toDataURL('image/jpeg', quality);

        resolve({
          full: fullRes,
          thumb: thumb
        });
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
};
