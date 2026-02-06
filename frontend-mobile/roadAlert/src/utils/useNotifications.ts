/**
 * Composable Vue pour les notifications push
 * Facilite l'utilisation du service de notifications dans les composants Vue
 */

import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  initPushNotifications,
  setOnNotificationReceived,
  setOnNotificationTapped,
  setOnTokenReceived,
  registerTokenWithServer,
  unregisterTokenFromServer,
  getCurrentToken,
  checkPermissions,
  removePushNotificationListeners,
  isPushNotificationsSupported,
  PushNotificationData
} from './pushNotificationService';

export interface UseNotificationsOptions {
  autoInit?: boolean;
  onNotification?: (notification: PushNotificationData) => void;
  onTap?: (notification: PushNotificationData) => void;
}

export const useNotifications = (options: UseNotificationsOptions = {}) => {
  const router = useRouter();
  
  const isSupported = ref(isPushNotificationsSupported());
  const isInitialized = ref(false);
  const permissionStatus = ref<string>('unknown');
  const fcmToken = ref<string | null>(null);
  const lastNotification = ref<PushNotificationData | null>(null);
  const notificationCount = ref(0);

  /**
   * Initialise les notifications push
   */
  const initialize = async (userUID?: string) => {
    if (!isSupported.value) {
      console.log('Notifications non supportées');
      return false;
    }

    // Vérifier les permissions
    permissionStatus.value = await checkPermissions();

    // Configurer les callbacks
    setOnNotificationReceived((notification) => {
      console.log('Notification reçue dans composable:', notification);
      lastNotification.value = notification;
      notificationCount.value++;
      
      if (options.onNotification) {
        options.onNotification(notification);
      }
    });

    setOnNotificationTapped((notification) => {
      console.log('Notification tapée dans composable:', notification);
      lastNotification.value = notification;
      
      if (options.onTap) {
        options.onTap(notification);
      } else {
        // Navigation par défaut vers le signalement
        handleNotificationNavigation(notification);
      }
    });

    setOnTokenReceived(async (token) => {
      console.log('Token reçu dans composable:', token);
      fcmToken.value = token;
      
      // Enregistrer le token sur le serveur si userUID fourni
      if (userUID) {
        await registerTokenWithServer(userUID, token);
      }
    });

    // Initialiser le service
    const success = await initPushNotifications();
    isInitialized.value = success;

    // Récupérer le token existant
    fcmToken.value = getCurrentToken();

    return success;
  };

  /**
   * Gère la navigation lors du tap sur une notification
   */
  const handleNotificationNavigation = (notification: PushNotificationData) => {
    if (notification.signalementId) {
      // Naviguer vers le détail du signalement
      router.push({
        path: '/home',
        query: { signalementId: notification.signalementId }
      });
    }
  };

  /**
   * Enregistre le token pour un utilisateur
   */
  const registerUser = async (userUID: string) => {
    const token = fcmToken.value || getCurrentToken();
    if (token && userUID) {
      return await registerTokenWithServer(userUID, token);
    }
    return false;
  };

  /**
   * Désenregistre le token pour un utilisateur (déconnexion)
   */
  const unregisterUser = async (userUID: string) => {
    if (userUID) {
      return await unregisterTokenFromServer(userUID);
    }
    return false;
  };

  /**
   * Réinitialise le compteur de notifications
   */
  const clearNotificationCount = () => {
    notificationCount.value = 0;
  };

  /**
   * Nettoyage à la destruction du composant
   */
  const cleanup = async () => {
    await removePushNotificationListeners();
    isInitialized.value = false;
  };

  // Auto-initialisation si demandée
  onMounted(async () => {
    if (options.autoInit) {
      // Récupérer l'UID de l'utilisateur connecté
      const storedUser = localStorage.getItem('user');
      let userUID: string | undefined;
      
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          userUID = user.UID || user.uid;
        } catch (e) {
          console.error('Erreur parsing user:', e);
        }
      }

      await initialize(userUID);
    }
  });

  onUnmounted(() => {
    // Ne pas cleanup ici pour garder les notifications actives
    // cleanup() sera appelé manuellement si nécessaire
  });

  return {
    // State
    isSupported,
    isInitialized,
    permissionStatus,
    fcmToken,
    lastNotification,
    notificationCount,
    
    // Methods
    initialize,
    registerUser,
    unregisterUser,
    clearNotificationCount,
    cleanup
  };
};

export default useNotifications;
