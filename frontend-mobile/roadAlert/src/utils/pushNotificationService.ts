/**
 * Service de Notifications Push Firebase
 * Gère l'enregistrement, la réception et l'affichage des notifications push
 */

import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { API_URL } from './config';

// Types
export interface PushNotificationData {
  title?: string;
  body?: string;
  data?: Record<string, any>;
  signalementId?: string;
  oldStatus?: string;
  newStatus?: string;
}

// Callbacks pour les événements
type NotificationCallback = (notification: PushNotificationData) => void;
type TokenCallback = (token: string) => void;

// Variables globales
let onNotificationReceived: NotificationCallback | null = null;
let onNotificationTapped: NotificationCallback | null = null;
let onTokenReceived: TokenCallback | null = null;
let isInitialized = false;
let currentToken: string | null = null;

/**
 * Vérifie si les notifications push sont supportées
 */
export const isPushNotificationsSupported = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Initialise le service de notifications push
 */
export const initPushNotifications = async (): Promise<boolean> => {
  if (!isPushNotificationsSupported()) {
    console.log('Push notifications non supportées sur cette plateforme');
    return false;
  }

  if (isInitialized) {
    console.log('Push notifications déjà initialisées');
    return true;
  }

  try {
    // Demander la permission
    const permResult = await PushNotifications.requestPermissions();
    
    if (permResult.receive !== 'granted') {
      console.log('Permission notifications refusée');
      return false;
    }

    // Enregistrer les listeners AVANT l'enregistrement
    await registerListeners();

    // S'enregistrer pour les notifications push
    await PushNotifications.register();

    isInitialized = true;
    console.log('Push notifications initialisées avec succès');
    return true;
  } catch (error) {
    console.error('Erreur initialisation push notifications:', error);
    return false;
  }
};

/**
 * Enregistre les listeners pour les événements de notification
 */
const registerListeners = async () => {
  // Réception du token FCM
  await PushNotifications.addListener('registration', (token: Token) => {
    console.log('Token FCM reçu:', token.value);
    currentToken = token.value;
    
    if (onTokenReceived) {
      onTokenReceived(token.value);
    }
  });

  // Erreur d'enregistrement
  await PushNotifications.addListener('registrationError', (error: any) => {
    console.error('Erreur enregistrement push:', error);
  });

  // Notification reçue (app au premier plan)
  await PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
    console.log('Notification reçue:', notification);
    
    const notificationData: PushNotificationData = {
      title: notification.title,
      body: notification.body,
      data: notification.data,
      signalementId: notification.data?.signalementId,
      oldStatus: notification.data?.oldStatus,
      newStatus: notification.data?.newStatus
    };

    if (onNotificationReceived) {
      onNotificationReceived(notificationData);
    }
  });

  // Notification tapée (app en arrière-plan ou fermée)
  await PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
    console.log('Notification tapée:', action);
    
    const notification = action.notification;
    const notificationData: PushNotificationData = {
      title: notification.title,
      body: notification.body,
      data: notification.data,
      signalementId: notification.data?.signalementId,
      oldStatus: notification.data?.oldStatus,
      newStatus: notification.data?.newStatus
    };

    if (onNotificationTapped) {
      onNotificationTapped(notificationData);
    }
  });
};

/**
 * Définit le callback pour la réception de notifications
 */
export const setOnNotificationReceived = (callback: NotificationCallback) => {
  onNotificationReceived = callback;
};

/**
 * Définit le callback pour le tap sur une notification
 */
export const setOnNotificationTapped = (callback: NotificationCallback) => {
  onNotificationTapped = callback;
};

/**
 * Définit le callback pour la réception du token
 */
export const setOnTokenReceived = (callback: TokenCallback) => {
  onTokenReceived = callback;
};

/**
 * Récupère le token FCM actuel
 */
export const getCurrentToken = (): string | null => {
  return currentToken;
};

/**
 * Envoie le token FCM au serveur pour l'associer à l'utilisateur
 */
export const registerTokenWithServer = async (userUID: string, token: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/api/notifications/register-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        uid: userUID,
        fcmToken: token,
        platform: Capacitor.getPlatform()
      })
    });

    const data = await response.json();
    return data.status === 'success';
  } catch (error) {
    console.error('Erreur enregistrement token serveur:', error);
    return false;
  }
};

/**
 * Supprime le token du serveur (déconnexion)
 */
export const unregisterTokenFromServer = async (userUID: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/api/notifications/unregister-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        uid: userUID
      })
    });

    const data = await response.json();
    currentToken = null;
    return data.status === 'success';
  } catch (error) {
    console.error('Erreur suppression token serveur:', error);
    return false;
  }
};

/**
 * Vérifie le statut des permissions
 */
export const checkPermissions = async (): Promise<string> => {
  if (!isPushNotificationsSupported()) {
    return 'unsupported';
  }

  try {
    const result = await PushNotifications.checkPermissions();
    return result.receive;
  } catch (error) {
    console.error('Erreur vérification permissions:', error);
    return 'denied';
  }
};

/**
 * Supprime tous les listeners (cleanup)
 */
export const removePushNotificationListeners = async () => {
  await PushNotifications.removeAllListeners();
  isInitialized = false;
  onNotificationReceived = null;
  onNotificationTapped = null;
  onTokenReceived = null;
};

/**
 * Affiche toutes les notifications délivrées (badge)
 */
export const getDeliveredNotifications = async () => {
  if (!isPushNotificationsSupported()) {
    return [];
  }

  try {
    const result = await PushNotifications.getDeliveredNotifications();
    return result.notifications;
  } catch (error) {
    console.error('Erreur récupération notifications:', error);
    return [];
  }
};

/**
 * Supprime toutes les notifications délivrées
 */
export const removeAllDeliveredNotifications = async () => {
  if (!isPushNotificationsSupported()) {
    return;
  }

  try {
    await PushNotifications.removeAllDeliveredNotifications();
  } catch (error) {
    console.error('Erreur suppression notifications:', error);
  }
};

export default {
  isPushNotificationsSupported,
  initPushNotifications,
  setOnNotificationReceived,
  setOnNotificationTapped,
  setOnTokenReceived,
  getCurrentToken,
  registerTokenWithServer,
  unregisterTokenFromServer,
  checkPermissions,
  removePushNotificationListeners,
  getDeliveredNotifications,
  removeAllDeliveredNotifications
};
