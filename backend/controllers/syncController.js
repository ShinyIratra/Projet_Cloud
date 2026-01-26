import { query } from '../config/postgres.js';
import { db } from '../config/firebase.js';
import ApiModel from '../models/ApiModel.js';

const syncController = {

    async syncFromFirebase(req, res) {
        try {
            const snapshot = await db.collection('road_alerts').get();
            let count = 0;

            for (const doc of snapshot.docs) {
                const data = doc.data();
                
                let statusCode = 'nouveau';
                if (data.status) {
                    const s = data.status.toLowerCase();
                    if (s === 'en cours') statusCode = 'en_cours';
                    else if (s === 'termine' || s.includes('termin')) statusCode = 'termine';
                }

                const checkExist = await query(
                    'SELECT Id_signalements FROM signalements WHERE lattitude = $1 AND longitude = $2',
                    [data.lattitude || data.latitude || 0, data.longitude || 0]
                );

                if (checkExist.rows.length === 0) {
                    await query(`
                        INSERT INTO signalements (surface, budget, lattitude, longitude, Id_statut_signalement, Id_users, date_signalement)
                        VALUES ($1, $2, $3, $4, 
                            (SELECT Id_statut_signalement FROM statut_signalement WHERE code = $5),
                            1,
                            $6)
                    `, [
                        data.surface || 0,
                        data.budget || 0,
                        data.lattitude || data.latitude || 0,
                        data.longitude || 0,
                        statusCode,
                        data.date_alert || new Date().toISOString()
                    ]);
                    count++;
                }
            }

            res.json(new ApiModel('success', { synced: count }, 'Synchronisation terminee'));
        } catch (error) {
            res.status(500).json(new ApiModel('error', null, error.message));
        }
    },

    async syncToFirebase(req, res) {
        try {
            const result = await query(`
                SELECT s.*, ss.code as status_code, e.nom as entreprise_nom
                FROM signalements s
                LEFT JOIN statut_signalement ss ON s.Id_statut_signalement = ss.Id_statut_signalement
                LEFT JOIN entreprise e ON s.Id_entreprise = e.Id_entreprise
            `);

            let count = 0;
            for (const row of result.rows) {
                let status = 'nouveau';
                if (row.status_code === 'en_cours') status = 'en cours';
                else if (row.status_code === 'termine') status = 'termine';
                
                const docRef = db.collection('road_alerts').doc();
                await docRef.set({
                    id: docRef.id,
                    surface: parseFloat(row.surface),
                    budget: parseFloat(row.budget),
                    lattitude: parseFloat(row.lattitude),
                    longitude: parseFloat(row.longitude),
                    status: status,
                    concerned_entreprise: row.entreprise_nom || '',
                    date_alert: row.date_signalement?.toISOString() || new Date().toISOString(),
                    UID: row.id_users?.toString() || ''
                });
                count++;
            }

            res.json(new ApiModel('success', { synced: count }, 'Envoi vers Firebase termine'));
        } catch (error) {
            res.status(500).json(new ApiModel('error', null, error.message));
        }
    }
};

export default syncController;
