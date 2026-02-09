/**
 * Helper pour capturer des photos avec Capacitor Camera
 * Compatible web et mobile (Android/iOS)
 */

import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { compressSignalementImage } from './imageCompression';

export interface PhotoOptions {
  source?: 'camera' | 'gallery' | 'prompt';
  compress?: boolean;
}

/**
 * Prendre une photo avec la caméra ou sélectionner depuis la galerie
 * @param options - Options de capture
 * @returns Promise<string> - Image en Base64 compressée
 */
export const takePhoto = async (options: PhotoOptions = {}): Promise<string | null> => {
  const { source = 'prompt', compress = true } = options;

  try {
    // Convertir le source en CameraSource Capacitor
    let cameraSource: CameraSource;
    switch (source) {
      case 'camera':
        cameraSource = CameraSource.Camera;
        break;
      case 'gallery':
        cameraSource = CameraSource.Photos;
        break;
      default:
        cameraSource = CameraSource.Prompt; // Demande à l'utilisateur de choisir
    }

    // Capturer la photo
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl, // Retourne directement en Base64
      source: cameraSource,
      width: 1920,
      height: 1920,
      preserveAspectRatio: true,
    });

    if (!image.dataUrl) {
      console.warn('Aucune image capturée');
      return null;
    }

    // Compression optionnelle
    if (compress) {
      // Convertir dataUrl en Blob pour compression
      const blob = dataURLtoBlob(image.dataUrl);
      const compressed = await compressSignalementImage(blob);
      return compressed;
    }

    return image.dataUrl;
  } catch (error: any) {
    // L'utilisateur a annulé
    if (error.message === 'User cancelled photos app') {
      console.log('Photo capture annulée par l\'utilisateur');
      return null;
    }
    
    console.error('Erreur lors de la capture de photo:', error);
    throw new Error(`Erreur de capture: ${error.message}`);
  }
};

/**
 * Prendre une photo depuis la caméra uniquement
 */
export const takeCameraPhoto = async (): Promise<string | null> => {
  return takePhoto({ source: 'camera', compress: true });
};

/**
 * Sélectionner une photo depuis la galerie uniquement
 */
export const selectGalleryPhoto = async (): Promise<string | null> => {
  return takePhoto({ source: 'gallery', compress: true });
};

/**
 * Demander à l'utilisateur de choisir entre caméra et galerie
 */
export const promptPhotoSource = async (): Promise<string | null> => {
  return takePhoto({ source: 'prompt', compress: true });
};

/**
 * Prendre plusieurs photos
 * @param maxPhotos - Nombre maximum de photos
 * @returns Promise<string[]> - Tableau d'images Base64
 */
export const takeMultiplePhotos = async (maxPhotos: number = 5): Promise<string[]> => {
  const photos: string[] = [];

  for (let i = 0; i < maxPhotos; i++) {
    try {
      const photo = await promptPhotoSource();
      if (photo) {
        photos.push(photo);
        
        // Demander si l'utilisateur veut ajouter une autre photo
        const addMore = await new Promise<boolean>((resolve) => {
          const confirmed = confirm(
            `Photo ${i + 1} ajoutée. Voulez-vous ajouter une autre photo ? (${i + 1}/${maxPhotos})`
          );
          resolve(confirmed);
        });

        if (!addMore) {
          break;
        }
      } else {
        // L'utilisateur a annulé
        break;
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout de photo:', error);
      break;
    }
  }

  return photos;
};

/**
 * Vérifier si la caméra est disponible
 */
export const isCameraAvailable = async (): Promise<boolean> => {
  try {
    const permissions = await Camera.checkPermissions();
    return permissions.camera !== 'denied';
  } catch (error) {
    console.error('Erreur lors de la vérification des permissions:', error);
    return false;
  }
};

/**
 * Demander les permissions de caméra
 */
export const requestCameraPermissions = async (): Promise<boolean> => {
  try {
    const permissions = await Camera.requestPermissions();
    return permissions.camera === 'granted';
  } catch (error) {
    console.error('Erreur lors de la demande de permissions:', error);
    return false;
  }
};

/**
 * Convertir DataURL en Blob
 */
function dataURLtoBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new Blob([u8arr], { type: mime });
}

/**
 * Mode d'utilisation simplifié pour formulaires
 */
export const photoCapture = {
  /**
   * Capture ou sélectionne une photo avec gestion d'erreur intégrée
   */
  async capture(): Promise<string | null> {
    try {
      return await promptPhotoSource();
    } catch (error) {
      alert('Erreur lors de la capture de photo. Veuillez réessayer.');
      return null;
    }
  },

  /**
   * Capture uniquement avec la caméra
   */
  async camera(): Promise<string | null> {
    try {
      return await takeCameraPhoto();
    } catch (error) {
      alert('Erreur lors de la prise de photo. Vérifiez les permissions.');
      return null;
    }
  },

  /**
   * Sélection depuis la galerie uniquement
   */
  async gallery(): Promise<string | null> {
    try {
      return await selectGalleryPhoto();
    } catch (error) {
      alert('Erreur lors de la sélection de photo.');
      return null;
    }
  },
};
