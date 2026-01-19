import axios from 'axios';
import admin from '../config/firebase.js';
import dotenv from 'dotenv';

dotenv.config();

// Récupération de la clé API Web depuis le .env
const API_KEY = process.env.FIREBASE_WEB_API_KEY;

const userController = 
{

};

export default userController;