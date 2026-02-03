import ApiModel from "../models/ApiModel.js";
import NotificationModel from "../models/NotificationModel.js";
import { db } from "../config/firebase.js";

const NotificationController = {
    // Créer une notification
    async createNotification(UID, roadAlertId, oldStatus, newStatus) {
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

            const notificationRef = db.collection("notifications").doc();
            notification.setId(notificationRef.id);

            await notificationRef.set({
                id: notification.getId(),
                UID: notification.getUID(),
                roadAlertId: notification.getRoadAlertId(),
                oldStatus: notification.getOldStatus(),
                newStatus: notification.getNewStatus(),
                message: notification.getMessage(),
                read: notification.getRead(),
                createdAt: notification.getCreatedAt()
            });

            return notification;
        } catch (error) {
            console.error("Erreur lors de la création de la notification:", error);
            throw error;
        }
    },

    // Récupérer toutes les notifications d'un utilisateur
    async getUserNotifications(req, res) {
        const { UID } = req.params;

        try {
            const notificationsSnapshot = await db.collection("notifications")
                .where("UID", "==", UID)
                .orderBy("createdAt", "desc")
                .get();

            const notifications = [];
            notificationsSnapshot.forEach(doc => {
                const data = doc.data();
                notifications.push(new NotificationModel(
                    data.id,
                    data.UID,
                    data.roadAlertId,
                    data.oldStatus,
                    data.newStatus,
                    data.message,
                    data.read,
                    data.createdAt
                ));
            });

            const response = new ApiModel("success", notifications, null);
            res.status(200).json(response);
        } catch (error) {
            const response = new ApiModel("error", null, error.message);
            res.status(500).json(response);
        }
    },

    // Récupérer les notifications non lues d'un utilisateur
    async getUnreadNotifications(req, res) {
        const { UID } = req.params;

        try {
            // Requête simplifiée pour éviter l'index composite
            const notificationsSnapshot = await db.collection("notifications")
                .where("UID", "==", UID)
                .get();

            const notifications = [];
            notificationsSnapshot.forEach(doc => {
                const data = doc.data();
                // Filtrer uniquement les notifications non lues
                if (data.read === false) {
                    notifications.push(new NotificationModel(
                        data.id,
                        data.UID,
                        data.roadAlertId,
                        data.oldStatus,
                        data.newStatus,
                        data.message,
                        data.read,
                        data.createdAt
                    ));
                }
            });

            // Trier par date côté serveur
            notifications.sort((a, b) => {
                return new Date(b.getCreatedAt()) - new Date(a.getCreatedAt());
            });

            const response = new ApiModel("success", notifications, null);
            res.status(200).json(response);
        } catch (error) {
            const response = new ApiModel("error", null, error.message);
            res.status(500).json(response);
        }
    },

    // Marquer une notification comme lue
    async markAsRead(req, res) {
        const { id } = req.body;

        try {
            const notificationRef = db.collection("notifications").doc(id);
            
            await notificationRef.update({
                read: true
            });

            const response = new ApiModel("success", null, "Notification marquée comme lue");
            res.status(200).json(response);
        } catch (error) {
            const response = new ApiModel("error", null, error.message);
            res.status(500).json(response);
        }
    },

    // Marquer toutes les notifications d'un utilisateur comme lues
    async markAllAsRead(req, res) {
        const { UID } = req.body;

        try {
            const notificationsSnapshot = await db.collection("notifications")
                .where("UID", "==", UID)
                .where("read", "==", false)
                .get();

            const batch = db.batch();
            notificationsSnapshot.forEach(doc => {
                batch.update(doc.ref, { read: true });
            });

            await batch.commit();

            const response = new ApiModel("success", null, "Toutes les notifications ont été marquées comme lues");
            res.status(200).json(response);
        } catch (error) {
            const response = new ApiModel("error", null, error.message);
            res.status(500).json(response);
        }
    }
};

export default NotificationController;
