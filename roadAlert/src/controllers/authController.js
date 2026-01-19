const axios = require('axios');
const admin = require('../config/firebase');
require('dotenv').config();

// Récupération de la clé API Web depuis le .env
const API_KEY = process.env.FIREBASE_WEB_API_KEY;

// --- INSCRIPTION (Via Admin SDK) ---
exports.register = async (req, res) => {
    const { email, password, displayName } = req.body;

    try {
        // On demande à Firebase de créer l'utilisateur
        const userRecord = await admin.auth().createUser({
            email: email,
            password: password,
            displayName: displayName
        });
        
        res.status(201).json({ 
            message: "Utilisateur créé avec succès sur Firebase", 
            uid: userRecord.uid 
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- CONNEXION (Via API REST) ---
exports.login = async (req, res) => {
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
};