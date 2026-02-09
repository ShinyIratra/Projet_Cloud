/**
 * Service de gestion des photos pour les profils et les signalements
 * Utilise la compression Base64 pour stocker les images dans Firestore
 */

import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import {
  compressAvatarImage,
  compressSignalementImage,
  validateImageSize,
  getBase64Size,
} from '../utils/imageCompression';

/**
 * Upload et met à jour la photo de profil d'un utilisateur
 * @param userId - UID de l'utilisateur
 * @param imageFile - Fichier image
 * @returns Promise<string> - URL Base64 de l'image compressée
 */
export const uploadProfilePhoto = async (
  userId: string,
  imageFile: File | Blob
): Promise<string> => {
  try {
    // Compresser l'image pour le profil (max 200x200, qualité 0.8)
    const compressedImage = await compressAvatarImage(imageFile);

    // Vérifier la taille (max 500KB recommandé pour Firestore)
    if (!validateImageSize(compressedImage, 500)) {
      throw new Error(
        `Image trop volumineuse: ${getBase64Size(compressedImage).toFixed(2)}KB. Maximum: 500KB`
      );
    }

    // Mettre à jour le document dans Firestore
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      photo_profil_compressed: compressedImage,
    });

    console.log('✅ Photo de profil mise à jour avec succès');
    return compressedImage;
  } catch (error) {
    console.error('❌ Erreur lors de l\'upload de la photo de profil:', error);
    throw error;
  }
};

/**
 * Récupère la photo de profil d'un utilisateur
 * @param userId - UID de l'utilisateur
 * @returns Promise<string | null> - URL Base64 ou null
 */
export const getProfilePhoto = async (userId: string): Promise<string | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      return userData.photo_profil_compressed || null;
    }

    return null;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération de la photo de profil:', error);
    return null;
  }
};

/**
 * Supprime la photo de profil d'un utilisateur
 * @param userId - UID de l'utilisateur
 */
export const deleteProfilePhoto = async (userId: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      photo_profil_compressed: '',
    });

    console.log('✅ Photo de profil supprimée avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la suppression de la photo de profil:', error);
    throw error;
  }
};

/**
 * Ajoute une photo à un signalement
 * @param signalementId - ID du signalement
 * @param imageFile - Fichier image
 * @param isMainPhoto - Si c'est la photo principale
 * @returns Promise<string> - URL Base64 de l'image compressée
 */
export const addSignalementPhoto = async (
  signalementId: string,
  imageFile: File | Blob,
  isMainPhoto: boolean = false
): Promise<string> => {
  try {
    // Compresser l'image pour le signalement (max 800x800, qualité 0.7)
    const compressedImage = await compressSignalementImage(imageFile);

    // Vérifier la taille (max 500KB)
    if (!validateImageSize(compressedImage, 500)) {
      throw new Error(
        `Image trop volumineuse: ${getBase64Size(compressedImage).toFixed(2)}KB. Maximum: 500KB`
      );
    }

    // Récupérer le signalement actuel
    const signalementRef = doc(db, 'signalements', signalementId);
    const signalementSnap = await getDoc(signalementRef);

    if (!signalementSnap.exists()) {
      throw new Error('Signalement introuvable');
    }

    const signalementData = signalementSnap.data();
    const currentPhotos = signalementData.photos || [];

    // Limiter à 5 photos par signalement
    if (currentPhotos.length >= 5) {
      throw new Error('Maximum de 5 photos par signalement atteint');
    }

    // Ajouter la nouvelle photo
    const updatedPhotos = [...currentPhotos, compressedImage];

    // Préparer les données à mettre à jour
    const updateData: any = {
      photos: updatedPhotos,
    };

    // Si c'est la première photo ou si spécifié, la définir comme photo principale
    if (isMainPhoto || !signalementData.photo_principale) {
      updateData.photo_principale = compressedImage;
    }

    // Mettre à jour le document
    await updateDoc(signalementRef, updateData);

    console.log('✅ Photo ajoutée au signalement avec succès');
    return compressedImage;
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout de la photo au signalement:', error);
    throw error;
  }
};

/**
 * Récupère toutes les photos d'un signalement
 * @param signalementId - ID du signalement
 * @returns Promise<string[]> - Tableau d'URLs Base64
 */
export const getSignalementPhotos = async (signalementId: string): Promise<string[]> => {
  try {
    const signalementRef = doc(db, 'signalements', signalementId);
    const signalementSnap = await getDoc(signalementRef);

    if (signalementSnap.exists()) {
      const data = signalementSnap.data();
      return data.photos || [];
    }

    return [];
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des photos du signalement:', error);
    return [];
  }
};

/**
 * Définit la photo principale d'un signalement
 * @param signalementId - ID du signalement
 * @param photoBase64 - Photo en Base64 à définir comme principale
 */
export const setMainSignalementPhoto = async (
  signalementId: string,
  photoBase64: string
): Promise<void> => {
  try {
    const signalementRef = doc(db, 'signalements', signalementId);
    await updateDoc(signalementRef, {
      photo_principale: photoBase64,
    });

    console.log('✅ Photo principale définie avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la définition de la photo principale:', error);
    throw error;
  }
};

/**
 * Supprime une photo d'un signalement
 * @param signalementId - ID du signalement
 * @param photoBase64 - Photo en Base64 à supprimer
 */
export const deleteSignalementPhoto = async (
  signalementId: string,
  photoBase64: string
): Promise<void> => {
  try {
    const signalementRef = doc(db, 'signalements', signalementId);
    const signalementSnap = await getDoc(signalementRef);

    if (!signalementSnap.exists()) {
      throw new Error('Signalement introuvable');
    }

    const data = signalementSnap.data();
    const currentPhotos = data.photos || [];
    const updatedPhotos = currentPhotos.filter((photo: string) => photo !== photoBase64);

    const updateData: any = {
      photos: updatedPhotos,
    };

    // Si on supprime la photo principale, définir la première photo restante comme principale
    if (data.photo_principale === photoBase64) {
      updateData.photo_principale = updatedPhotos.length > 0 ? updatedPhotos[0] : '';
    }

    await updateDoc(signalementRef, updateData);

    console.log('✅ Photo supprimée du signalement avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la suppression de la photo du signalement:', error);
    throw error;
  }
};

/**
 * Supprime toutes les photos d'un signalement
 * @param signalementId - ID du signalement
 */
export const deleteAllSignalementPhotos = async (signalementId: string): Promise<void> => {
  try {
    const signalementRef = doc(db, 'signalements', signalementId);
    await updateDoc(signalementRef, {
      photos: [],
      photo_principale: '',
    });

    console.log('✅ Toutes les photos du signalement supprimées avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la suppression des photos du signalement:', error);
    throw error;
  }
};
