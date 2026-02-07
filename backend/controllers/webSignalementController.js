import { query } from '../config/postgres.js';
import { db } from '../config/firebase.js';
import ApiModel from '../models/ApiModel.js';

const webSignalementController = {

    async getAll(req, res) {
        try {
            // Utilise une sous-requête pour obtenir le dernier statut depuis Historique_StatutSignalements
            const result = await query(`
                SELECT 
                    s.Id_signalements as id,
                    s.titre,
                    s.surface,
                    s.budget,
                    get_latitude(s.position) as lattitude,
                    get_longitude(s.position) as longitude,
                    s.date_signalement,
                    COALESCE(ss.label, 'Nouveau') as status,
                    COALESCE(ss.code, 'nouveau') as status_code,
                    e.nom as entreprise,
                    hss.update_at as updated_at
                FROM signalements s
                LEFT JOIN entreprise e ON s.Id_entreprise = e.Id_entreprise
                LEFT JOIN (
                    SELECT DISTINCT ON (Id_signalements) 
                        Id_signalements, Id_statut_signalement, update_at
                    FROM Historique_StatutSignalements
                    ORDER BY Id_signalements, update_at DESC
                ) hss ON s.Id_signalements = hss.Id_signalements
                LEFT JOIN statut_signalement ss ON hss.Id_statut_signalement = ss.Id_statut_signalement
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
            console.error('Erreur getAll signalements:', error);
            res.status(500).json(new ApiModel('error', null, 'Erreur lors de la récupération des signalements'));
        }
    },

    async create(req, res) {
        const { surface, budget, lattitude, longitude, entreprise, status, userId } = req.body;

        try {
            // Valider les champs obligatoires
            if (surface === undefined || surface === null) {
                return res.status(400).json(new ApiModel('error', null, 'Le champ surface est obligatoire'));
            }
            if (!lattitude || !longitude) {
                return res.status(400).json(new ApiModel('error', null, 'Les coordonnées (latitude et longitude) sont obligatoires'));
            }
            if (!userId) {
                return res.status(400).json(new ApiModel('error', null, 'Vous devez être connecté pour créer un signalement'));
            }

            // Vérifier que l'utilisateur existe
            const userCheck = await query('SELECT Id_users FROM users WHERE Id_users = $1', [userId]);
            if (userCheck.rows.length === 0) {
                return res.status(400).json(new ApiModel('error', null, 'Utilisateur invalide'));
            }

            // Chercher l'ID de l'entreprise si fournie
            let entrepriseId = null;
            if (entreprise && entreprise.trim() !== '') {
                const entrepriseResult = await query(
                    'SELECT Id_entreprise FROM entreprise WHERE LOWER(nom) = LOWER($1)',
                    [entreprise.trim()]
                );
                if (entrepriseResult.rows.length > 0) {
                    entrepriseId = entrepriseResult.rows[0].id_entreprise;
                } else {
                    // Créer l'entreprise si elle n'existe pas
                    const newEntreprise = await query(
                        'INSERT INTO entreprise (nom) VALUES ($1) RETURNING Id_entreprise',
                        [entreprise.trim()]
                    );
                    entrepriseId = newEntreprise.rows[0].id_entreprise;
                }
            }

            // Déterminer le code du statut (par défaut: nouveau)
            const statusCode = status || 'nouveau';

            // Insérer le signalement (sans Id_statut_signalement car le statut est dans Historique)
            const result = await query(`
                INSERT INTO signalements (surface, budget, position, Id_entreprise, Id_users)
                VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography, $5, $6)
                RETURNING Id_signalements, get_latitude(position) as lattitude, get_longitude(position) as longitude, date_signalement
            `, [surface, budget || 0, longitude, lattitude, entrepriseId, userId]);

            const newId = result.rows[0].id_signalements;

            // Insérer le statut initial dans Historique_StatutSignalements
            await query(`
                INSERT INTO Historique_StatutSignalements (Id_signalements, Id_statut_signalement)
                VALUES ($1, (SELECT Id_statut_signalement FROM statut_signalement WHERE code = $2))
            `, [newId, statusCode]);

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
                UID: newId.toString()
            });

            // Mettre à jour l'id_firebase dans Postgres
            await query('UPDATE signalements SET id_firebase = $1 WHERE Id_signalements = $2', [docRef.id, newId]);

            res.status(201).json(new ApiModel('success', { id: newId }, 'Signalement créé avec succès'));
        } catch (error) {
            console.error('Erreur création signalement:', error);
            res.status(500).json(new ApiModel('error', null, 'Erreur lors de la création du signalement'));
        }
    },

    async getStats(req, res) {
        try {
            // Utiliser la vue ou une sous-requête pour récupérer les statistiques avec l'historique des statuts
            const result = await query(`
                SELECT 
                    COUNT(*) as total_points,
                    COALESCE(SUM(s.surface), 0) as total_surface,
                    COALESCE(SUM(s.budget), 0) as total_budget,
                    COUNT(CASE WHEN ss.code = 'termine' THEN 1 END) as termine,
                    COUNT(CASE WHEN ss.code = 'en_cours' THEN 1 END) as en_cours,
                    COUNT(CASE WHEN ss.code = 'nouveau' OR ss.code IS NULL THEN 1 END) as nouveau
                FROM signalements s
                LEFT JOIN (
                    SELECT DISTINCT ON (Id_signalements) 
                        Id_signalements, Id_statut_signalement
                    FROM Historique_StatutSignalements
                    ORDER BY Id_signalements, update_at DESC
                ) hss ON s.Id_signalements = hss.Id_signalements
                LEFT JOIN statut_signalement ss ON hss.Id_statut_signalement = ss.Id_statut_signalement
            `);

            const stats = result.rows[0];
            const total = parseInt(stats.total_points) || 0;
            const termine = parseInt(stats.termine) || 0;
            const en_cours = parseInt(stats.en_cours) || 0;
            const nouveau = parseInt(stats.nouveau) || 0;
            
            // Calcul de l'avancement global basé sur les pourcentages de chaque statut
            // nouveau = 0%, en_cours = 50%, terminé = 100%
            const avancement = total > 0 
                ? Math.round(((nouveau * 0) + (en_cours * 50) + (termine * 100)) / total)
                : 0;

            res.json(new ApiModel('success', {
                total_points: total,
                total_surface: parseFloat(stats.total_surface) || 0,
                total_budget: parseFloat(stats.total_budget) || 0,
                avancement: avancement,
                termine: termine,
                en_cours: en_cours,
                nouveau: nouveau
            }, null));
        } catch (error) {
            console.error('Erreur getStats:', error);
            res.status(500).json(new ApiModel('error', null, 'Erreur lors de la récupération des statistiques'));
        }
    },

    async update(req, res) {
        const { id, surface, budget, entreprise, status } = req.body;

        try {
            // Vérifier que le signalement existe
            if (!id) {
                return res.status(400).json(new ApiModel('error', null, 'ID du signalement requis'));
            }

            const existCheck = await query('SELECT Id_signalements FROM signalements WHERE Id_signalements = $1', [id]);
            if (existCheck.rows.length === 0) {
                return res.status(404).json(new ApiModel('error', null, 'Signalement non trouvé'));
            }

            let sql = 'UPDATE signalements SET ';
            const updates = [];
            const values = [];
            let paramIndex = 1;

            if (surface !== undefined && surface !== null) {
                updates.push(`surface = $${paramIndex++}`);
                values.push(surface);
            }
            if (budget !== undefined && budget !== null) {
                updates.push(`budget = $${paramIndex++}`);
                values.push(budget);
            }
            if (entreprise !== undefined) {
                // Chercher l'ID de l'entreprise
                if (entreprise && entreprise.trim() !== '') {
                    const entrepriseResult = await query(
                        'SELECT Id_entreprise FROM entreprise WHERE LOWER(nom) = LOWER($1)',
                        [entreprise.trim()]
                    );
                    if (entrepriseResult.rows.length > 0) {
                        updates.push(`Id_entreprise = $${paramIndex++}`);
                        values.push(entrepriseResult.rows[0].id_entreprise);
                    } else {
                        // Créer l'entreprise si elle n'existe pas
                        const newEnt = await query('INSERT INTO entreprise (nom) VALUES ($1) RETURNING Id_entreprise', [entreprise.trim()]);
                        updates.push(`Id_entreprise = $${paramIndex++}`);
                        values.push(newEnt.rows[0].id_entreprise);
                    }
                } else {
                    updates.push(`Id_entreprise = NULL`);
                }
            }

            // Si un changement de statut est demandé, l'ajouter dans Historique_StatutSignalements
            if (status !== undefined && status !== null) {
                const statusCheck = await query('SELECT Id_statut_signalement FROM statut_signalement WHERE code = $1', [status]);
                if (statusCheck.rows.length === 0) {
                    return res.status(400).json(new ApiModel('error', null, 'Statut invalide. Utilisez: nouveau, en_cours ou termine'));
                }
                await query(`
                    INSERT INTO Historique_StatutSignalements (Id_signalements, Id_statut_signalement)
                    VALUES ($1, (SELECT Id_statut_signalement FROM statut_signalement WHERE code = $2))
                `, [id, status]);
            }

            // Effectuer la mise à jour des autres champs si nécessaire
            if (updates.length > 0) {
                sql += updates.join(', ') + ` WHERE Id_signalements = $${paramIndex}`;
                values.push(id);
                await query(sql, values);
            }

            // Synchroniser vers Firebase
            const signalement = await query(`
                SELECT s.*, ss.code as status_code, e.nom as entreprise_nom,
                       get_latitude(s.position) as lattitude, get_longitude(s.position) as longitude
                FROM signalements s
                LEFT JOIN (
                    SELECT DISTINCT ON (Id_signalements) Id_signalements, Id_statut_signalement
                    FROM Historique_StatutSignalements ORDER BY Id_signalements, update_at DESC
                ) hss ON s.Id_signalements = hss.Id_signalements
                LEFT JOIN statut_signalement ss ON hss.Id_statut_signalement = ss.Id_statut_signalement
                LEFT JOIN entreprise e ON s.Id_entreprise = e.Id_entreprise
                WHERE s.Id_signalements = $1
            `, [id]);

            if (signalement.rows.length > 0) {
                const row = signalement.rows[0];
                let firebaseStatus = 'nouveau';
                if (row.status_code === 'en_cours') firebaseStatus = 'en cours';
                else if (row.status_code === 'termine') firebaseStatus = 'termine';

                // Chercher le document Firebase correspondant
                let docId = row.id_firebase;
                if (!docId) {
                    const snapshot = await db.collection('road_alerts')
                        .where('lattitude', '==', parseFloat(row.lattitude))
                        .where('longitude', '==', parseFloat(row.longitude))
                        .get();

                    if (!snapshot.empty) {
                        docId = snapshot.docs[0].id;
                        // Mettre à jour id_firebase
                        await query('UPDATE signalements SET id_firebase = $1 WHERE Id_signalements = $2', [docId, id]);
                    }
                }

                if (docId) {
                    await db.collection('road_alerts').doc(docId).update({
                        surface: parseFloat(row.surface),
                        budget: parseFloat(row.budget),
                        status: firebaseStatus,
                        concerned_entreprise: row.entreprise_nom || '',
                        updated_at: new Date().toISOString()
                    });
                }
            }

            res.json(new ApiModel('success', { id }, 'Signalement mis à jour avec succès'));
        } catch (error) {
            console.error('Erreur update signalement:', error);
            res.status(500).json(new ApiModel('error', null, 'Erreur lors de la mise à jour du signalement'));
        }
    },

    async updateStatus(req, res) {
        const { id, status } = req.body;

        try {
            // Validation des paramètres
            if (!id) {
                return res.status(400).json(new ApiModel('error', null, 'ID du signalement requis'));
            }
            if (!status) {
                return res.status(400).json(new ApiModel('error', null, 'Nouveau statut requis'));
            }

            // Vérifier que le statut est valide
            const validStatuses = ['nouveau', 'en_cours', 'termine'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json(new ApiModel('error', null, 'Statut invalide. Utilisez: nouveau, en_cours ou termine'));
            }

            // Vérifier que le signalement existe
            const existCheck = await query('SELECT Id_signalements, id_firebase FROM signalements WHERE Id_signalements = $1', [id]);
            if (existCheck.rows.length === 0) {
                return res.status(404).json(new ApiModel('error', null, 'Signalement non trouvé'));
            }

            // Insérer le nouveau statut dans l'historique
            await query(`
                INSERT INTO Historique_StatutSignalements (Id_signalements, Id_statut_signalement)
                VALUES ($1, (SELECT Id_statut_signalement FROM statut_signalement WHERE code = $2))
            `, [id, status]);

            // Récupérer les infos mises à jour
            const result = await query(`
                SELECT get_latitude(position) as lattitude, get_longitude(position) as longitude, 
                       date_signalement, id_firebase
                FROM signalements WHERE Id_signalements = $1
            `, [id]);

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

            // Message de succès selon le statut
            let message = 'Statut mis à jour avec succès';
            if (status === 'en_cours') message = 'Les travaux ont démarré !';
            else if (status === 'termine') message = 'Signalement marqué comme terminé !';

            res.json(new ApiModel('success', { id, status }, message));
        } catch (error) {
            console.error('Erreur updateStatus:', error);
            res.status(500).json(new ApiModel('error', null, 'Erreur lors de la mise à jour du statut'));
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
