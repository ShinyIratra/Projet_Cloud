import { query } from '../config/postgres.js';
import { db } from '../config/firebase.js';
import ApiModel from '../models/ApiModel.js';

const webSignalementController = {

    async getAll(req, res) {
        try {
            const result = await query(`
                SELECT 
                    s.Id_signalements as id,
                    s.surface,
                    s.budget,
                    get_latitude(s.position) as lattitude,
                    get_longitude(s.position) as longitude,
                    s.date_signalement,
                    s.updated_at,
                    ss.label as status,
                    ss.code as status_code,
                    e.nom as entreprise
                FROM signalements s
                LEFT JOIN statut_signalement ss ON s.Id_statut_signalement = ss.Id_statut_signalement
                LEFT JOIN entreprise e ON s.Id_entreprise = e.Id_entreprise
                ORDER BY s.date_signalement DESC
            `);
            
            // Convertir les valeurs numériques
            const data = result.rows.map(row => ({
                ...row,
                surface: parseFloat(row.surface) || 0,
                budget: parseFloat(row.budget) || 0,
                lattitude: parseFloat(row.lattitude) || 0,
                longitude: parseFloat(row.longitude) || 0
            }));
            
            res.json(new ApiModel('success', data, null));
        } catch (error) {
            res.status(500).json(new ApiModel('error', null, error.message));
        }
    },

    async create(req, res) {
        const { surface, budget, lattitude, longitude, entreprise, status, userId } = req.body;

        try {
            // Valider les champs obligatoires
            if (!surface || !lattitude || !longitude) {
                return res.status(400).json(new ApiModel('error', null, 'Les champs surface, latitude et longitude sont obligatoires'));
            }

            if (!userId) {
                return res.status(400).json(new ApiModel('error', null, 'ID utilisateur est requis'));
            }

            // Chercher l'ID de l'entreprise si fournie
            let entrepriseId = null;
            if (entreprise) {
                const entrepriseResult = await query(
                    'SELECT Id_entreprise FROM entreprise WHERE LOWER(nom) = LOWER($1)',
                    [entreprise]
                );
                if (entrepriseResult.rows.length > 0) {
                    entrepriseId = entrepriseResult.rows[0].id_entreprise;
                } else {
                    // Créer l'entreprise si elle n'existe pas
                    const newEntreprise = await query(
                        'INSERT INTO entreprise (nom) VALUES ($1) RETURNING Id_entreprise',
                        [entreprise]
                    );
                    entrepriseId = newEntreprise.rows[0].id_entreprise;
                }
            }

            // Déterminer le code du statut
            const statusCode = status || 'nouveau';

            // Insérer le signalement
            const result = await query(`
                INSERT INTO signalements (surface, budget, position, Id_statut_signalement, Id_entreprise, Id_users)
                VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography, 
                    (SELECT Id_statut_signalement FROM statut_signalement WHERE code = $5),
                    $6, $7)
                RETURNING Id_signalements, get_latitude(position) as lattitude, get_longitude(position) as longitude, date_signalement
            `, [surface, budget || 0, longitude, lattitude, statusCode, entrepriseId, userId]);

            const newId = result.rows[0].id_signalements;

            // Créer également dans Firebase
            const firebaseStatus = statusCode === 'en_cours' ? 'en cours' : (statusCode === 'termine' ? 'termine' : 'nouveau');
            const docRef = db.collection('road_alerts').doc();
            await docRef.set({
                id: docRef.id,
                surface: parseFloat(surface),
                budget: parseFloat(budget || 0),
                lattitude: parseFloat(lattitude),
                longitude: parseFloat(longitude),
                status: firebaseStatus,
                concerned_entreprise: entreprise || '',
                date_alert: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                UID: '1'
            });

            // Mettre à jour l'id_firebase dans Postgres
            await query('UPDATE signalements SET id_firebase = $1 WHERE Id_signalements = $2', [docRef.id, newId]);

            res.json(new ApiModel('success', { id: newId }, 'Signalement créé avec succès'));
        } catch (error) {
            res.status(500).json(new ApiModel('error', null, error.message));
        }
    },

    async getStats(req, res) {
        try {
            const result = await query(`
                SELECT 
                    COUNT(*) as total_points,
                    COALESCE(SUM(surface), 0) as total_surface,
                    COALESCE(SUM(budget), 0) as total_budget,
                    COUNT(CASE WHEN ss.code = 'termine' THEN 1 END) as termine,
                    COUNT(CASE WHEN ss.code = 'en_cours' THEN 1 END) as en_cours,
                    COUNT(CASE WHEN ss.code = 'nouveau' THEN 1 END) as nouveau
                FROM signalements s
                LEFT JOIN statut_signalement ss ON s.Id_statut_signalement = ss.Id_statut_signalement
            `);

            const stats = result.rows[0];
            const total = parseInt(stats.total_points) || 0;
            const termine = parseInt(stats.termine) || 0;
            const avancement = total > 0 ? Math.round((termine / total) * 100) : 0;

            res.json(new ApiModel('success', {
                total_points: total,
                total_surface: parseFloat(stats.total_surface) || 0,
                total_budget: parseFloat(stats.total_budget) || 0,
                avancement: avancement,
                termine: termine,
                en_cours: parseInt(stats.en_cours) || 0,
                nouveau: parseInt(stats.nouveau) || 0
            }, null));
        } catch (error) {
            res.status(500).json(new ApiModel('error', null, error.message));
        }
    },

    async update(req, res) {
        const { id, surface, budget, entreprise, status } = req.body;

        try {
            let sql = 'UPDATE signalements SET ';
            const updates = [];
            const values = [];
            let paramIndex = 1;

            if (surface !== undefined) {
                updates.push(`surface = $${paramIndex++}`);
                values.push(surface);
            }
            if (budget !== undefined) {
                updates.push(`budget = $${paramIndex++}`);
                values.push(budget);
            }
            if (entreprise !== undefined) {
                // Chercher l'ID de l'entreprise
                const entrepriseResult = await query(
                    'SELECT Id_entreprise FROM entreprise WHERE LOWER(nom) = LOWER($1)',
                    [entreprise]
                );
                if (entrepriseResult.rows.length > 0) {
                    updates.push(`Id_entreprise = $${paramIndex++}`);
                    values.push(entrepriseResult.rows[0].id_entreprise);
                }
            }
            if (status !== undefined) {
                updates.push(`Id_statut_signalement = (SELECT Id_statut_signalement FROM statut_signalement WHERE code = $${paramIndex++})`);
                values.push(status);
            }

            if (updates.length === 0) {
                return res.status(400).json(new ApiModel('error', null, 'Aucune donnee a mettre a jour'));
            }

            // Toujours mettre à jour updated_at
            updates.push(`updated_at = NOW()`);

            sql += updates.join(', ') + ` WHERE Id_signalements = $${paramIndex}`;
            values.push(id);

            await query(sql, values);

            // Synchroniser vers Firebase
            const signalement = await query(`
                SELECT s.*, ss.code as status_code, e.nom as entreprise_nom,
                       get_latitude(s.position) as lattitude, get_longitude(s.position) as longitude
                FROM signalements s
                LEFT JOIN statut_signalement ss ON s.Id_statut_signalement = ss.Id_statut_signalement
                LEFT JOIN entreprise e ON s.Id_entreprise = e.Id_entreprise
                WHERE s.Id_signalements = $1
            `, [id]);

            if (signalement.rows.length > 0) {
                const row = signalement.rows[0];
                let firebaseStatus = 'nouveau';
                if (row.status_code === 'en_cours') firebaseStatus = 'en cours';
                else if (row.status_code === 'termine') firebaseStatus = 'termine';

                const snapshot = await db.collection('road_alerts')
                    .where('lattitude', '==', parseFloat(row.lattitude))
                    .where('longitude', '==', parseFloat(row.longitude))
                    .get();

                if (!snapshot.empty) {
                    const docId = snapshot.docs[0].id;
                    await db.collection('road_alerts').doc(docId).update({
                        surface: parseFloat(row.surface),
                        budget: parseFloat(row.budget),
                        status: firebaseStatus,
                        concerned_entreprise: row.entreprise_nom || '',
                        updated_at: new Date().toISOString()
                    });
                }
            }

            res.json(new ApiModel('success', null, 'Signalement mis a jour'));
        } catch (error) {
            res.status(500).json(new ApiModel('error', null, error.message));
        }
    },

    async updateStatus(req, res) {
        const { id, status } = req.body;

        try {
            // Mettre à jour dans Postgres
            const result = await query(`
                UPDATE signalements 
                SET Id_statut_signalement = (SELECT Id_statut_signalement FROM statut_signalement WHERE code = $1),
                    updated_at = NOW()
                WHERE Id_signalements = $2
                RETURNING get_latitude(position) as lattitude, get_longitude(position) as longitude, date_signalement, id_firebase
            `, [status, id]);

            if (result.rows.length > 0) {
                // Synchroniser vers Firebase
                const row = result.rows[0];
                let firebaseStatus = 'nouveau';
                if (status === 'en_cours') firebaseStatus = 'en cours';
                else if (status === 'termine') firebaseStatus = 'termine';

                // Chercher le document Firebase correspondant par id_firebase ou coordonnées
                let docId = row.id_firebase;
                if (!docId) {
                    const snapshot = await db.collection('road_alerts')
                        .where('lattitude', '==', parseFloat(row.lattitude))
                        .where('longitude', '==', parseFloat(row.longitude))
                        .get();
                    
                    if (!snapshot.empty) {
                        docId = snapshot.docs[0].id;
                        // Mettre à jour id_firebase dans Postgres
                        await query('UPDATE signalements SET id_firebase = $1 WHERE Id_signalements = $2', [docId, id]);
                    }
                }

                if (docId) {
                    await db.collection('road_alerts').doc(docId).update({
                        status: firebaseStatus,
                        updated_at: new Date().toISOString()
                    });
                }
            }

            res.json(new ApiModel('success', null, 'Statut mis a jour'));
        } catch (error) {
            res.status(500).json(new ApiModel('error', null, error.message));
        }
    },

    async getEntreprises(req, res) {
        try {
            const result = await query('SELECT Id_entreprise as id, nom FROM entreprise ORDER BY nom');
            res.json(new ApiModel('success', result.rows, null));
        } catch (error) {
            res.status(500).json(new ApiModel('error', null, error.message));
        }
    }
};

export default webSignalementController;
