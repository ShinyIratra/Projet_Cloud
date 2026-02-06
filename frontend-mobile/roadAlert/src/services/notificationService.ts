// Service de gestion des notifications - Logique métier intégrée directement dans le mobile
// Remplace les appels API vers le backend pour les notifications

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc,
  query, 
  where,
  orderBy,
  writeBatch,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from './firebase';

// Interface pour les notifications
export interface Notification {
  id: string;
  UID: string;
  roadAlertId: string;
  oldStatus: string;
  newStatus: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// Classe modèle pour les notifications (équivalent du NotificationModel backend)
class NotificationModel implements Notification {
  id: string;
  UID: string;
  roadAlertId: string;
  oldStatus: string;
  newStatus: string;
  message: string;
  read: boolean;
  createdAt: string;

  constructor(
    id: string | null,
    UID: string,
    roadAlertId: string,
    oldStatus: string,
    newStatus: string,
    message: string,
    read: boolean = false,
    createdAt: string = new Date().toISOString()
  ) {
    this.id = id || '';
    this.UID = UID;
    this.roadAlertId = roadAlertId;
    this.oldStatus = oldStatus;
    this.newStatus = newStatus;
    this.message = message;
    this.read = read;
    this.createdAt = createdAt;
  }
}

// Service de gestion des notifications
class NotificationService {

  /**
   * Créer une notification
   */
  async createNotification(
    UID: string,
    roadAlertId: string,
    oldStatus: string,
    newStatus: string
  ): Promise<Notification> {
    try {
      const message = `Le statut de votre signalement a changé de "${oldStatus}" à "${newStatus}"`;

      const notification = new NotificationModel(
        null,
        UID,
        roadAlertId,
        oldStatus,
        newStatus,
        message,
        false,
        new Date().toISOString()
      );

      const notificationRef = doc(collection(db, 'notifications'));
      notification.id = notificationRef.id;

      await setDoc(notificationRef, {
        id: notification.id,
        UID: notification.UID,
        roadAlertId: notification.roadAlertId,
        oldStatus: notification.oldStatus,
        newStatus: notification.newStatus,
        message: notification.message,
        read: notification.read,
        createdAt: notification.createdAt
      });

      return notification;
    } catch (error: any) {
      console.error('Erreur lors de la création de la notification:', error);
      throw error;
    }
  }

  /**
   * Récupérer toutes les notifications d'un utilisateur
   */
  async getUserNotifications(UID: string): Promise<Notification[]> {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('UID', '==', UID)
      );
      const notificationsSnapshot = await getDocs(q);
      const notifications: Notification[] = [];

      notificationsSnapshot.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
        const data = docSnap.data();
        notifications.push({
          id: data.id,
          UID: data.UID,
          roadAlertId: data.roadAlertId,
          oldStatus: data.oldStatus,
          newStatus: data.newStatus,
          message: data.message,
          read: data.read,
          createdAt: data.createdAt
        });
      });

      // Trier par date décroissante
      notifications.sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      return notifications;
    } catch (error: any) {
      throw new Error(`Erreur lors de la récupération des notifications: ${error.message}`);
    }
  }

  /**
   * Récupérer les notifications non lues d'un utilisateur
   */
  async getUnreadNotifications(UID: string): Promise<Notification[]> {
    try {
      // Requête simplifiée pour éviter l'index composite
      const q = query(
        collection(db, 'notifications'),
        where('UID', '==', UID)
      );
      const notificationsSnapshot = await getDocs(q);
      const notifications: Notification[] = [];

      notificationsSnapshot.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
        const data = docSnap.data();
        // Filtrer uniquement les notifications non lues
        if (data.read === false) {
          notifications.push({
            id: data.id,
            UID: data.UID,
            roadAlertId: data.roadAlertId,
            oldStatus: data.oldStatus,
            newStatus: data.newStatus,
            message: data.message,
            read: data.read,
            createdAt: data.createdAt
          });
        }
      });

      // Trier par date décroissante
      notifications.sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      return notifications;
    } catch (error: any) {
      throw new Error(`Erreur lors de la récupération des notifications non lues: ${error.message}`);
    }
  }

  /**
   * Marquer une notification comme lue
   */
  async markAsRead(id: string): Promise<void> {
    try {
      const notificationRef = doc(db, 'notifications', id);
      await updateDoc(notificationRef, {
        read: true
      });
    } catch (error: any) {
      throw new Error(`Erreur lors du marquage de la notification: ${error.message}`);
    }
  }

  /**
   * Marquer toutes les notifications d'un utilisateur comme lues
   */
  async markAllAsRead(UID: string): Promise<void> {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('UID', '==', UID),
        where('read', '==', false)
      );
      const notificationsSnapshot = await getDocs(q);

      const batch = writeBatch(db);
      notificationsSnapshot.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
        batch.update(docSnap.ref, { read: true });
      });

      await batch.commit();
    } catch (error: any) {
      throw new Error(`Erreur lors du marquage des notifications: ${error.message}`);
    }
  }

  /**
   * Compter les notifications non lues
   */
  async getUnreadCount(UID: string): Promise<number> {
    try {
      const notifications = await this.getUnreadNotifications(UID);
      return notifications.length;
    } catch (error: any) {
      throw new Error(`Erreur lors du comptage des notifications: ${error.message}`);
    }
  }
}

// Export d'une instance unique du service
export const notificationService = new NotificationService();
export default notificationService;
