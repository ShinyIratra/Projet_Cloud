// API utilisateurs - Logique métier locale (sans backend)
// Utilise Firebase directement depuis le mobile

import { userService, UserStatus, UserData } from '../services/userService';

// Ré-export des interfaces pour la compatibilité
export type { UserStatus, UserData };

/**
 * Vérifier si un utilisateur est bloqué
 */
export const checkUserBlocked = async (uid: string): Promise<UserStatus> => {
  return await userService.isUserBlocked(uid);
};

/**
 * Récupérer le nombre de tentatives échouées d'un utilisateur
 */
export const getUserAttempts = async (uid: string): Promise<{ failed_login_attempt: number }> => {
  return await userService.getUserAttempts(uid);
};

/**
 * Débloquer un utilisateur
 */
export const unblockUser = async (uid: string, managerUid?: string): Promise<void> => {
  await userService.unblockUser(uid, managerUid);
};

/**
 * Récupérer les données d'un utilisateur
 */
export const getUserData = async (uid: string): Promise<UserData | null> => {
  return await userService.getUserData(uid);
};

/**
 * Récupérer un utilisateur par email
 */
export const getUserByEmail = async (email: string): Promise<UserData | null> => {
  return await userService.getUserByEmail(email);
};

/**
 * Vérifier si l'utilisateur est un manager
 */
export const isManager = async (uid: string): Promise<boolean> => {
  return await userService.isManager(uid);
};

/**
 * Récupérer tous les utilisateurs (managers uniquement)
 */
export const getAllUsers = async (managerUid: string): Promise<UserData[]> => {
  return await userService.getAllUsers(managerUid);
};

/**
 * Récupérer tous les utilisateurs bloqués (managers uniquement)
 */
export const getBlockedUsers = async (managerUid: string): Promise<UserData[]> => {
  return await userService.getBlockedUsers(managerUid);
};
