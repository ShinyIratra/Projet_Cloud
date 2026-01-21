import ApiModel from "../models/ApiModel.js";

import UserModel from "../models/UserModel.js";

import axios from "axios";
import { admin, db } from "../config/firebase.js";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.FIREBASE_WEB_API_KEY;

const authController = 
{
    async register(req, res)
    {
        const { email, password, type_user, displayName } = req.body;

        try 
        {
            const userRecord = await admin.auth().createUser({
                email: email,
                password: password,
                displayName: displayName
            });
            
            const userType = type_user || "utilisateur";
            const user = new UserModel(userRecord.uid, 0, "active", userType);

            const userRef = db.collection("users").doc(user.getUID());
            await userRef.set({ 
                "UID": user.getUID(), 
                "email": email,
                "failed_login_attempt": user.getFailedLoginAttempt(), 
                "status": user.getStatus(), 
                "type_user": user.getTypeUser() 
            });
        
            const response = new ApiModel("success", { uid: userRecord.uid }, "Utilisateur créé avec succès sur Firebase");
            res.status(201).json(response);

        } catch (error) {
            const response = new ApiModel("error", null, error.message);
            res.status(500).json(response);
        }
    },

    async login(req, res) {
        const { email, password } = req.body;

        // Vérifiez si l'utilisateur existe dans Firestore
        const userSnapshot = await db.collection("users").where("email", "==", email).get();
        if (userSnapshot.empty) {
            const apiResponse = new ApiModel("error", null, "Compte non trouvé");
            return res.status(404).json(apiResponse);
        }

        const userData = userSnapshot.docs[0].data();
        const userRef = db.collection("users").doc(userSnapshot.docs[0].id);

        // Vérifiez si l'utilisateur est bloqué
        if (userData.status === "blocked") {
            const apiResponse = new ApiModel("error", null, "Compte bloqué. Veuillez contacter un administrateur.");
            return res.status(403).json(apiResponse);
        }

        try {
            // Tentative de connexion avec Firebase Authentication
            const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;
            const response = await axios.post(url, {
                email: email,
                password: password,
                returnSecureToken: true
            });

            // Réinitialisez les tentatives échouées en cas de succès
            await userRef.update({
                failed_login_attempt: 0
            });

            const apiResponse = new ApiModel("success", response.data, "Connexion réussie");
            res.json(apiResponse);

        } catch (error) {

            const maxAttempts = await getRemoteConfigValue('MAX_LOGIN_ATTEMPTS') || 3;

            // Vérifiez si l'erreur est liée à un mot de passe invalide ou des informations d'identification incorrectes
            if (
                error.response &&
                (error.response.data.error.message === "INVALID_PASSWORD" ||
                 error.response.data.error.message === "INVALID_LOGIN_CREDENTIALS")
            ) {
                const newAttempts = (userData.failed_login_attempt || 0) + 1;

                if (newAttempts >= maxAttempts) {
                    await userRef.update({ failed_login_attempt: newAttempts, status: "blocked" });
                } else {
                    await userRef.update({ failed_login_attempt: newAttempts });
                }

                const apiResponse = new ApiModel("error", null, "Mot de passe incorrect. Tentative échouée.");
                return res.status(401).json(apiResponse);
            }

            // Autres erreurs
            const errorMessage = error.response ? error.response.data.error.message : "Erreur serveur";
            const apiResponse = new ApiModel("error", null, `Echec de connexion: ${errorMessage}`);
            res.status(500).json(apiResponse);
        }
    },

    async updateEmailandPassword(req, res)
    {
        const { uid, email, password } = req.body;

        try
        {
            const updateData = {};
            if (email) updateData.email = email;
            if (password) updateData.password = password;

            await admin.auth().updateUser(uid, updateData);
            const response = new ApiModel("success", null, "Utilisateur mis à jour avec succès");
            res.json(response);
        } catch (error) {
            const response = new ApiModel("error", null, error.message);
            res.status(500).json(response);
        }
    },

    async unblockUser(req, res)
    {
        const { uid, manager_uid } = req.body;

        const managerRef = await db.collection("users").doc(manager_uid).get();

        if (!managerRef.exists || managerRef.data().type_user !== "manager") {
            const response = new ApiModel("error", null, "Accès refusé. Seul un manager peut débloquer un utilisateur.");
            return res.status(403).json(response);
        }

        try
        {
            const userRef = db.collection("users").doc(uid);
            await userRef.update({
                status: "active",
                failed_login_attempt: 0
            });

            const response = new ApiModel("success", null, "Utilisateur débloqué avec succès");
            res.json(response);
        } catch (error) {
            const response = new ApiModel("error", null, error.message);
            res.status(500).json(response);
        }
    }
};

export default authController;