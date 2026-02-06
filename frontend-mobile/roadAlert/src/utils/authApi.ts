// Authentification avec logique métier locale (sans backend)
// Utilise Firebase directement depuis le mobile

import { authService, LoginResponse, RegisterResponse, ApiResponse } from '../services/authService';

// Ré-export des interfaces pour la compatibilité
export type { LoginResponse, ApiResponse, RegisterResponse };

/**
 * Connexion utilisateur - Logique métier intégrée localement
 * Gère les tentatives échouées et le blocage de compte
 */
export const loginUser = async (email: string, password: string): Promise<LoginResponse> => {
  return await authService.login(email, password);
};

/**
 * Inscription utilisateur - Logique métier intégrée localement
 * Crée l'utilisateur dans Firebase Auth et Firestore
 */
export const registerUser = async (
  email: string, 
  password: string, 
  displayName: string = '',
  type_user: string = 'utilisateur'
): Promise<{ user?: { uid: string; email: string }; message?: string }> => {
  const result = await authService.register(email, password, displayName, type_user);
  
  return {
    user: {
      uid: result.uid,
      email: result.email
    },
    message: result.message
  };
};

/**
 * Mise à jour utilisateur - Logique métier intégrée localement
 */
export const updateUser = async (uid: string, email?: string, password?: string): Promise<ApiResponse<null>> => {
  await authService.updateEmailAndPassword(uid, email, password);
  
  return {
    status: 'success',
    data: null,
    message: 'Utilisateur mis à jour avec succès'
  };
};

/**
 * Déconnexion utilisateur
 */
export const logoutUser = async (): Promise<void> => {
  await authService.logout();
};

/**
 * Réinitialisation du mot de passe
 */
export const resetPassword = async (email: string): Promise<void> => {
  await authService.resetPassword(email);
};

/**
 * Débloquer un utilisateur (managers uniquement)
 */
export const unblockUser = async (uid: string, managerUid: string): Promise<void> => {
  await authService.unblockUser(uid, managerUid);
};

/**
 * Récupérer les données utilisateur
 */
export const getUserData = async (uid: string) => {
  return await authService.getUserData(uid);
};

/**
 * Récupérer l'utilisateur courant
 */
export const getCurrentUser = () => {
  return authService.getCurrentUser();
};
