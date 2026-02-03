import ApiModel from "../models/ApiModel.js";

import RoadAlertModel from "../models/RoadAlertModel.js";
import NotificationController from "./notificationController.js";

import axios from "axios";
import { admin, db } from "../config/firebase.js";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.FIREBASE_WEB_API_KEY;

const RoadAlertController = 
{
    async new_road_alert(req, res)
    {
        const { surface, budget, concerned_entreprise, status, lattitude, longitude, UID, date_alert } = req.body;

        try 
        {
            const roadAlert = new RoadAlertModel(null, surface, budget, concerned_entreprise, status, lattitude, longitude, UID, date_alert);

            const roadAlertRef = db.collection("road_alerts").doc();
            roadAlert.setId(roadAlertRef.id);

            await roadAlertRef.set({ 
                "id": roadAlert.getId(),
                "surface": roadAlert.getSurface(),
                "budget": roadAlert.getBudget(),
                "concerned_entreprise": roadAlert.getConcernedEntreprise(),
                "status": roadAlert.getStatus(),
                "lattitude": roadAlert.getLattitude(),
                "longitude": roadAlert.getLongitude(),
                "UID": roadAlert.getUID(),
                "date_alert": roadAlert.getDateAlert(),
                "updated_at": new Date().toISOString()
            });
        
            const response = new ApiModel("success", { id: roadAlert.getId() }, "Signalement créée avec succès");
            res.status(201).json(response);
        } catch (error) {
            const response = new ApiModel("error", null, error.message);
            res.status(500).json(response);
        }
    },

    async new_mobile_road_alert(req, res)
    {
        const { UID, date_alert, lattitude, longitude } = req.body;

        try 
        {
            // Créer un signalement avec des valeurs par défaut pour les champs non fournis
            const roadAlert = new RoadAlertModel(
                null, 
                0, // surface par défaut
                0, // budget par défaut
                '', // concerned_entreprise vide par défaut
                'nouveau', // status automatiquement défini à "nouveau"
                lattitude, 
                longitude, 
                UID, 
                date_alert
            );

            const roadAlertRef = db.collection("road_alerts").doc();
            roadAlert.setId(roadAlertRef.id);

            await roadAlertRef.set({ 
                "id": roadAlert.getId(),
                "surface": roadAlert.getSurface(),
                "budget": roadAlert.getBudget(),
                "concerned_entreprise": roadAlert.getConcernedEntreprise(),
                "status": roadAlert.getStatus(),
                "lattitude": roadAlert.getLattitude(),
                "longitude": roadAlert.getLongitude(),
                "UID": roadAlert.getUID(),
                "date_alert": roadAlert.getDateAlert(),
                "updated_at": new Date().toISOString(),
                "created_at": new Date().toISOString()
            });
        
            const response = new ApiModel("success", { id: roadAlert.getId() }, "Signalement créé avec succès depuis mobile");
            res.status(201).json(response);
        } catch (error) {
            const response = new ApiModel("error", null, error.message);
            res.status(500).json(response);
        }
    },


    async get_all_road_alerts(req, res)
    {
        try 
        {
            const roadAlertsSnapshot = await db.collection("road_alerts").get();
            const roadAlerts = [];

            roadAlertsSnapshot.forEach(doc => {
                const roadAlert = new RoadAlertModel(
                    doc.data().id,
                    doc.data().surface,
                    doc.data().budget,
                    doc.data().concerned_entreprise,
                    doc.data().status,
                    doc.data().lattitude,
                    doc.data().longitude,
                    doc.data().UID,
                    doc.data().date_alert
                );

                roadAlerts.push(roadAlert);
            });

            const response = new ApiModel("success", roadAlerts, null);
            res.status(200).json(response);
        } catch (error) {
            const response = new ApiModel("error", null, error.message);
            res.status(500).json(response);
        }
    },

    async update_road_alert()
    {
        const { id, surface, budget, concerned_entreprise, lattitude, longitude, UID, date_alert } = req.body;

        try 
        {
            const roadAlertRef = db.collection("road_alerts").doc(id);

            await roadAlertRef.update({ 
                "surface": surface,
                "budget": budget,
                "concerned_entreprise": concerned_entreprise,
                "lattitude": lattitude,
                "longitude": longitude,
                "UID": UID,
                "date_alert": date_alert,
                "updated_at": new Date().toISOString()
            });
        
            const response = new ApiModel("success", null, "Signalement mise à jour avec succès");
            res.status(200).json(response);
        } catch (error) {
            const response = new ApiModel("error", null, error.message);
            res.status(500).json(response);
        }
    },

    async update_road_alert_status(req, res)
    {
        const { id, status } = req.body;

        try 
        {
            const roadAlertRef = db.collection("road_alerts").doc(id);
            
            // Récupérer l'ancien statut et l'UID avant la mise à jour
            const roadAlertDoc = await roadAlertRef.get();
            
            if (!roadAlertDoc.exists) {
                const response = new ApiModel("error", null, "Signalement non trouvé");
                return res.status(404).json(response);
            }

            const roadAlertData = roadAlertDoc.data();
            const oldStatus = roadAlertData.status;
            const userUID = roadAlertData.UID;
            
            // Mettre à jour le statut
            await roadAlertRef.update({ 
                "status": status,
                "updated_at": new Date().toISOString()
            });

            // Créer une notification si le statut a changé
            if (oldStatus !== status && userUID) {
                try {
                    await NotificationController.createNotification(userUID, id, oldStatus, status);
                } catch (notifError) {
                    console.error("Erreur lors de la création de la notification:", notifError);
                    // Ne pas bloquer la réponse si la notification échoue
                }
            }

            const response = new ApiModel("success", null, "Statut du signalement mis à jour avec succès");
            res.status(200).json(response);
        } catch (error) {
            const response = new ApiModel("error", null, error.message);
            res.status(500).json(response);
        }
    },

    async getByUser(req, res)
    {
        const { UID } = req.params;

        try 
        {
            const roadAlertsSnapshot = await db.collection("road_alerts").where("UID", "==", UID).get();
            const roadAlerts = [];

            roadAlertsSnapshot.forEach(doc => {
                const roadAlert = new RoadAlertModel(
                    doc.data().id,
                    doc.data().surface,
                    doc.data().budget,
                    doc.data().concerned_entreprise,
                    doc.data().status,
                    doc.data().lattitude,
                    doc.data().longitude,
                    doc.data().UID,
                    doc.data().date_alert
                );

                roadAlerts.push(roadAlert);
            });

            const response = new ApiModel("success", roadAlerts, null);
            res.status(200).json(response);
        } catch (error) {
            const response = new ApiModel("error", null, error.message);
            res.status(500).json(response);
        }
    }
};

export default RoadAlertController;