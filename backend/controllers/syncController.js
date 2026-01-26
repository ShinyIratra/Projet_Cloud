import { query } from '../config/postgres.js';
import { db } from '../config/firebase.js';
import ApiModel from '../models/ApiModel.js';

const syncController = {

    // Synchronisation bidirectionnelle intelligente
    async syncFromFirebase(req, res) {
        try {
            // Récupérer tous les signalements de Firebase
            const firebaseSnapshot = await db.collection('road_alerts').get();
            
            // Récupérer tous les signalements de Postgres
            const postgresResult = await query(`
                SELECT s.*, ss.code as status_code, e.nom as entreprise_nom,
                       get_latitude(s.position) as lattitude, get_longitude(s.position) as longitude
                FROM signalements s
                LEFT JOIN statut_signalement ss ON s.Id_statut_signalement = ss.Id_statut_signalement
                LEFT JOIN entreprise e ON s.Id_entreprise = e.Id_entreprise
            `);

            let addedToPostgres = 0;
            let updatedInPostgres = 0;
            let addedToFirebase = 0;
            let updatedInFirebase = 0;

            // Créer un map des signalements Postgres par id_firebase
            const postgresMap = new Map();
            postgresResult.rows.forEach(row => {
                if (row.id_firebase) {
                    postgresMap.set(row.id_firebase, row);
                }
            });

            // Traiter chaque signalement Firebase
            for (const doc of firebaseSnapshot.docs) {
                const firebaseData = doc.data();
                const firebaseId = doc.id;
                
                // Convertir le statut Firebase en code Postgres
                let statusCode = 'nouveau';
                if (firebaseData.status) {
                    const s = firebaseData.status.toLowerCase();
                    if (s === 'en cours') statusCode = 'en_cours';
                    else if (s === 'termine' || s.includes('termin')) statusCode = 'termine';
                }

                // Gérer l'entreprise : chercher l'ID par nom
                let entrepriseId = null;
                if (firebaseData.concerned_entreprise) {
                    const entrepriseResult = await query(
                        'SELECT Id_entreprise FROM entreprise WHERE LOWER(nom) = LOWER($1)',
                        [firebaseData.concerned_entreprise]
                    );
                    if (entrepriseResult.rows.length > 0) {
                        entrepriseId = entrepriseResult.rows[0].id_entreprise;
                    }
                }

                const postgresData = postgresMap.get(firebaseId);

                if (!postgresData) {
                    // Nouveau signalement depuis Firebase → l'ajouter à Postgres
                    await query(`
                        INSERT INTO signalements (surface, budget, position, Id_statut_signalement, Id_entreprise, Id_users, date_signalement, updated_at, id_firebase)
                        VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography, 
                            (SELECT Id_statut_signalement FROM statut_signalement WHERE code = $5),
                            $6, 1, $7, $8, $9)
                    `, [
                        firebaseData.surface || 0,
                        firebaseData.budget || 0,
                        firebaseData.longitude || 0,
                        firebaseData.lattitude || firebaseData.latitude || 0,
                        statusCode,
                        entrepriseId,
                        firebaseData.date_alert || new Date().toISOString(),
                        firebaseData.updated_at || firebaseData.date_alert || new Date().toISOString(),
                        firebaseId
                    ]);
                    addedToPostgres++;
                    postgresMap.delete(firebaseId); // Marqué comme traité
                } else {
                    // Le signalement existe dans les deux bases → comparer les dates
                    const firebaseUpdateTime = new Date(firebaseData.updated_at || firebaseData.date_alert || 0);
                    const postgresUpdateTime = new Date(postgresData.updated_at || postgresData.date_signalement || 0);

                    if (firebaseUpdateTime > postgresUpdateTime) {
                        // Firebase est plus récent → mettre à jour Postgres
                        await query(
                            `UPDATE signalements 
                             SET Id_statut_signalement = (SELECT Id_statut_signalement FROM statut_signalement WHERE code = $1),
                                 Id_entreprise = $2,
                                 surface = $3,
                                 budget = $4,
                                 updated_at = $5
                             WHERE Id_signalements = $6`,
                            [statusCode, entrepriseId, firebaseData.surface || 0, firebaseData.budget || 0, firebaseUpdateTime, postgresData.id_signalements]
                        );
                        updatedInPostgres++;
                    } else if (postgresUpdateTime > firebaseUpdateTime) {
                        // Postgres est plus récent → mettre à jour Firebase
                        let status = 'nouveau';
                        if (postgresData.status_code === 'en_cours') status = 'en cours';
                        else if (postgresData.status_code === 'termine') status = 'termine';

                        await db.collection('road_alerts').doc(firebaseId).update({
                            status: status,
                            concerned_entreprise: postgresData.entreprise_nom || '',
                            surface: parseFloat(postgresData.surface),
                            budget: parseFloat(postgresData.budget),
                            updated_at: postgresData.updated_at?.toISOString() || new Date().toISOString()
                        });
                        updatedInFirebase++;
                    }
                    postgresMap.delete(firebaseId); // Marqué comme traité
                }
            }

            // Traiter les signalements qui existent uniquement dans Postgres → les ajouter à Firebase
            for (const [firebaseId, postgresData] of postgresMap) {
                // Ignorer ceux sans id_firebase (déjà traités ou orphelins)
                if (!postgresData.id_firebase) continue;

                let status = 'nouveau';
                if (postgresData.status_code === 'en_cours') status = 'en cours';
                else if (postgresData.status_code === 'termine') status = 'termine';

                const docRef = db.collection('road_alerts').doc(postgresData.id_firebase);
                const docSnap = await docRef.get();

                if (!docSnap.exists) {
                    // Ajouter à Firebase
                    await docRef.set({
                        id: postgresData.id_firebase,
                        surface: parseFloat(postgresData.surface),
                        budget: parseFloat(postgresData.budget),
                        lattitude: parseFloat(postgresData.lattitude),
                        longitude: parseFloat(postgresData.longitude),
                        status: status,
                        concerned_entreprise: postgresData.entreprise_nom || '',
                        date_alert: postgresData.date_signalement?.toISOString() || new Date().toISOString(),
                        updated_at: postgresData.updated_at?.toISOString() || new Date().toISOString(),
                        UID: postgresData.id_users?.toString() || ''
                    });
                    addedToFirebase++;
                }
            }

            // Traiter les signalements Postgres sans id_firebase
            for (const row of postgresResult.rows) {
                if (row.id_firebase) continue; // Déjà traité

                // Chercher par coordonnées
                const snapshot = await db.collection('road_alerts')
                    .where('lattitude', '==', parseFloat(row.lattitude))
                    .where('longitude', '==', parseFloat(row.longitude))
                    .get();

                if (!snapshot.empty) {
                    // Lier avec le document Firebase existant
                    const firebaseDoc = snapshot.docs[0];
                    await query(
                        'UPDATE signalements SET id_firebase = $1 WHERE Id_signalements = $2',
                        [firebaseDoc.id, row.id_signalements]
                    );
                } else {
                    // Créer un nouveau document Firebase
                    const docRef = db.collection('road_alerts').doc();
                    let status = 'nouveau';
                    if (row.status_code === 'en_cours') status = 'en cours';
                    else if (row.status_code === 'termine') status = 'termine';

                    await docRef.set({
                        id: docRef.id,
                        surface: parseFloat(row.surface),
                        budget: parseFloat(row.budget),
                        lattitude: parseFloat(row.lattitude),
                        longitude: parseFloat(row.longitude),
                        status: status,
                        concerned_entreprise: row.entreprise_nom || '',
                        date_alert: row.date_signalement?.toISOString() || new Date().toISOString(),
                        updated_at: row.updated_at?.toISOString() || new Date().toISOString(),
                        UID: row.id_users?.toString() || ''
                    });

                    await query(
                        'UPDATE signalements SET id_firebase = $1 WHERE Id_signalements = $2',
                        [docRef.id, row.id_signalements]
                    );
                    addedToFirebase++;
                }
            }

            res.json(new ApiModel('success', { 
                addedToPostgres, 
                updatedInPostgres, 
                addedToFirebase, 
                updatedInFirebase 
            }, `Sync: +${addedToPostgres}/-${addedToFirebase} Firebase→Postgres, ${updatedInPostgres}/${updatedInFirebase} mises à jour`));
        } catch (error) {
            console.error('Erreur de synchronisation:', error);
            res.status(500).json(new ApiModel('error', null, error.message));
        }
    },

    async syncToFirebase(req, res) {
        // Cette méthode est maintenant fusionnée avec syncFromFirebase
        // On garde la même logique pour la compatibilité
        return this.syncFromFirebase(req, res);
    }
};

export default syncController;

