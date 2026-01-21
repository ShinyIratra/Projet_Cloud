import axios from 'axios';
import admin from '../config/firebase.js';
import dotenv from 'dotenv';

dotenv.config();

// Récupération de la clé API Web depuis le .env
const API_KEY = process.env.FIREBASE_WEB_API_KEY;

const userController = 
{
    async getTentativeUser(req, res)
    {
        const { uid } = req.params;

        try
        {
            const userRef = db.collection("users").doc(uid);
            const userDoc = await userRef.get();

            if (!userDoc.exists) {
                const response = new apiModel("error", null, "Utilisateur non trouvé");
                return res.status(404).json(response);
            }

            const userData = userDoc.data();
            const response = new apiModel("success", [{ failed_login_attempt: userData.failed_login_attempt }], "Données récupérées avec succès");
            res.json(response);
        } catch (error) {
            const response = new apiModel("error", null, error.message);
            res.status(500).json(response);
        }
    },

    async isUserBlocked(req, res)
    {
        const { uid } = req.params;
        
        try
        {
            const userRef = db.collection("users").doc(uid);
            const userDoc = await userRef.get();
            
            if (!userDoc.exists) {
                const response = new apiModel("error", null, "Utilisateur non trouvé");
                return res.status(404).json(response);
            }
            
            const userData = userDoc.data();
            const isBlocked = userData.status === "blocked";
            const response = new apiModel("success", [{ isBlocked: isBlocked }], "Statut de l'utilisateur récupéré avec succès");
            res.json(response);
        } catch (error) {
            const response = new apiModel("error", null, error.message);
            res.status(500).json(response);
        }
    }
};

export default userController;