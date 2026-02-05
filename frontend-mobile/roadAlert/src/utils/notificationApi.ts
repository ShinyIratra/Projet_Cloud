// API des notifications - Logique métier locale (sans backend)
// Utilise Firebase directement depuis le mobile

import { notificationService, Notification } from '../services/notificationService';

// Ré-export des interfaces pour la compatibilité
export type { Notification };

/**
 * Récupérer toutes les notifications d'un utilisateur
 */
export const fetchUserNotifications = async (uid: string): Promise<Notification[]> => {
  return await notificationService.getUserNotifications(uid);
};

/**
 * Récupérer les notifications non lues d'un utilisateur
 */
export const fetchUnreadNotifications = async (uid: string): Promise<Notification[]> => {
  return await notificationService.getUnreadNotifications(uid);
};

/**
 * Marquer une notification comme lue
 */
export const markNotificationAsRead = async (id: string): Promise<void> => {
  await notificationService.markAsRead(id);
};

/**
 * Marquer toutes les notifications d'un utilisateur comme lues
 */
export const markAllNotificationsAsRead = async (uid: string): Promise<void> => {
  await notificationService.markAllAsRead(uid);
};

/**
 * Compter les notifications non lues
 */
export const getUnreadNotificationCount = async (uid: string): Promise<number> => {
  return await notificationService.getUnreadCount(uid);
};

/**
 * Créer une notification (utilitaire)
 */
export const createNotification = async (
  uid: string,
  roadAlertId: string,
  oldStatus: string,
  newStatus: string
): Promise<Notification> => {
  return await notificationService.createNotification(uid, roadAlertId, oldStatus, newStatus);
};
