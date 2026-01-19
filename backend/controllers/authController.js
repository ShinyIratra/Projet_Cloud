import UserModel from "../models/UserModel.js";
import axios from "axios";
import { admin, db } from "../config/firebase.js";
import dotenv from "dotenv";

dotenv.config();

// Récupération de la clé API Web depuis le .env
const API_KEY = process.env.FIREBASE_WEB_API_KEY;

const authController = 
{
    async register(req, res)
    {
        const { email, password, type_user, displayName } = req.body;

        try 
        {
            // On demande à Firebase de créer l'utilisateur
            const userRecord = await admin.auth().createUser({
                email: email,
                password: password,
                displayName: displayName
            });
            
            // Si type_user non mentionné, on le met par défaut à "utilisateur"
            if(type_user == null || type_user == undefined)
            {
                type_user = "utilisateur";
            }

            const user = UserModel.create(userRecord.uid, 0, "active", type_user);

            const userRef = db.collection("users").doc(user.getUID());
            await userRef.set({ 
                "UID": user.getUID(), 
                "failed_login_attempt": user.getFailedLoginAttempt(), 
                "status": user.getStatus(), 
                "type_user": user.getTypeUser() 
            });
        
            res.status(201).json({ 
                message: "Utilisateur créé avec succès sur Firebase", 
                uid: userRecord.uid 
            });

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async login(req, res)
    {
        const { email, password } = req.body;

        try {
            // URL officielle donnée dans le PDF pour le login email/password
            const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;
            
            // On envoie les infos à Google
            const response = await axios.post(url, {
                email: email,
                password: password,
                returnSecureToken: true
            });

            // Google répond OK : on renvoie le token au client
            res.json(response.data);

        } catch (error) {
            // Google répond ERREUR (mauvais mdp, user inconnu...)
            // On renvoie l'erreur
            const errorMessage = error.response ? error.response.data.error.message : "Erreur serveur";
            res.status(401).json({ error: "Echec de connexion", details: errorMessage });
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
            
            // On met à jour l'utilisateur dans Firebase
            await admin.auth().updateUser(uid, updateData);
            res.json({ message: "Utilisateur mis à jour avec succès" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

export default authController;