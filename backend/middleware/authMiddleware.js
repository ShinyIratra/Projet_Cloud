import jwt from 'jsonwebtoken';
import ApiModel from '../models/ApiModel.js';

const JWT_SECRET = process.env.JWT_SECRET || 'votre-secret-jwt-super-securise-2024';

// Middleware pour vérifier le token JWT
export const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

    if (!token) {
        return res.status(401).json(new ApiModel('error', null, 'Token d\'authentification requis'));
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Ajoute les infos utilisateur à la requête
        next();
    } catch (error) {
        return res.status(403).json(new ApiModel('error', null, 'Token invalide ou expiré'));
    }
};

// Middleware pour vérifier si l'utilisateur est un manager
export const isManager = (req, res, next) => {
    if (req.user.type_user !== 'manager') {
        return res.status(403).json(new ApiModel('error', null, 'Accès refusé. Manager requis.'));
    }
    next();
};
