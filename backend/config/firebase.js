import admin from "firebase-admin";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, "../serviceAccountKey.json"), "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
});

// Configurer Firestore avec un timeout plus long
const db = admin.firestore();
db.settings({
  ignoreUndefinedProperties: true,
  preferredTimestampType: 'timestamp'
});

// Fonction pour récupérer une valeur de Remote Config
async function getRemoteConfigValue(key) {
    try {
        const remoteConfig = admin.remoteConfig();
        const template = await remoteConfig.getTemplate();
        const value = template.parameters[key]?.defaultValue?.value;
        return value ? parseInt(value, 10) : null; // Convertir en entier si nécessaire
    } catch (error) {
        console.error('Erreur lors de la récupération de Remote Config:', error);
        return null;
    }
}

export { admin, db, getRemoteConfigValue };
export default admin;