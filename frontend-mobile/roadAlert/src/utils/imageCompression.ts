/**
 * Service de compression et conversion d'images en Base64
 * Pour avatars, icônes et petites images (< 500KB recommandé)
 */

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1
  format?: 'jpeg' | 'png' | 'webp';
}

/**
 * Compresse une image et la convertit en Base64
 * @param file - Fichier image à compresser
 * @param options - Options de compression
 * @returns Promise<string> - Image en Base64
 */
export const compressImageToBase64 = async (
  file: File | Blob,
  options: CompressOptions = {}
): Promise<string> => {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.7,
    format = 'jpeg',
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Créer un canvas pour redimensionner
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculer les nouvelles dimensions en gardant le ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Impossible de créer le contexte canvas'));
          return;
        }

        // Dessiner l'image redimensionnée
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir en Base64
        const mimeType = `image/${format}`;
        const base64 = canvas.toDataURL(mimeType, quality);

        resolve(base64);
      };

      img.onerror = () => {
        reject(new Error('Erreur lors du chargement de l\'image'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Erreur lors de la lecture du fichier'));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Compresse une image pour un avatar (petite taille)
 * @param file - Fichier image
 * @returns Promise<string> - Image compressée en Base64
 */
export const compressAvatarImage = async (file: File | Blob): Promise<string> => {
  return compressImageToBase64(file, {
    maxWidth: 200,
    maxHeight: 200,
    quality: 0.8,
    format: 'jpeg',
  });
};

/**
 * Compresse une image pour un signalement (taille moyenne)
 * @param file - Fichier image
 * @returns Promise<string> - Image compressée en Base64
 */
export const compressSignalementImage = async (file: File | Blob): Promise<string> => {
  return compressImageToBase64(file, {
    maxWidth: 800,
    maxHeight: 800,
    quality: 0.7,
    format: 'jpeg',
  });
};

/**
 * Vérifie la taille d'une image Base64 (en KB)
 * @param base64String - String Base64
 * @returns number - Taille en KB
 */
export const getBase64Size = (base64String: string): number => {
  const base64Length = base64String.length - (base64String.indexOf(',') + 1);
  const padding = (base64String.charAt(base64String.length - 2) === '=' ? 2 : 
                   base64String.charAt(base64String.length - 1) === '=' ? 1 : 0);
  return (base64Length * 0.75 - padding) / 1024;
};

/**
 * Valide qu'une image Base64 ne dépasse pas une taille maximale
 * @param base64String - String Base64
 * @param maxSizeKB - Taille maximale en KB (défaut: 500KB)
 * @returns boolean
 */
export const validateImageSize = (base64String: string, maxSizeKB: number = 500): boolean => {
  const sizeKB = getBase64Size(base64String);
  return sizeKB <= maxSizeKB;
};

/**
 * Convertit un DataURL (data:image/...) en Blob
 * @param dataUrl - DataURL de l'image
 * @returns Blob
 */
export const dataURLtoBlob = (dataUrl: string): Blob => {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new Blob([u8arr], { type: mime });
};

/**
 * Extrait le format d'une image Base64
 * @param base64String - String Base64
 * @returns string - Format (jpeg, png, etc.)
 */
export const getBase64Format = (base64String: string): string => {
  const match = base64String.match(/data:image\/(.*?);/);
  return match ? match[1] : 'unknown';
};

/**
 * Compresse de manière adaptative jusqu'à atteindre la taille cible
 * @param file - Fichier image
 * @param targetSizeKB - Taille cible en KB
 * @param options - Options de compression
 * @returns Promise<string> - Image compressée
 */
export const compressToTargetSize = async (
  file: File | Blob,
  targetSizeKB: number = 500,
  options: CompressOptions = {}
): Promise<string> => {
  let quality = options.quality || 0.9;
  let compressed = await compressImageToBase64(file, { ...options, quality });
  
  // Réduire progressivement la qualité jusqu'à atteindre la taille cible
  while (getBase64Size(compressed) > targetSizeKB && quality > 0.1) {
    quality -= 0.1;
    compressed = await compressImageToBase64(file, { ...options, quality });
  }
  
  return compressed;
};
