import { query } from '../config/postgres.js';
import { db } from '../config/firebase.js';
import ApiModel from '../models/ApiModel.js';

const syncController = {

    // Synchronisation bidirectionnelle intelligente
    async syncFromFirebase(req, res) {
        try {
            // Récupérer tous les signalements de Firebase
            const firebaseSnapshot = await db.collection('road_alerts').get();
            
            // Récupérer tous les signalements de Postgres avec leur statut actuel
            // On prend le MAX entre updated_at (données) et status_update_at (statut)
            const postgresResult = await query(`
                SELECT s.*, ss.code as status_code, e.nom as entreprise_nom,
                       get_latitude(s.position) as lattitude, get_longitude(s.position) as longitude,
                       hss.update_at as status_update_at,
                       s.updated_at as data_updated_at,
                       GREATEST(COALESCE(s.updated_at, s.date_signalement), COALESCE(hss.update_at, s.date_signalement)) as last_modified
                FROM signalements s
                LEFT JOIN entreprise e ON s.Id_entreprise = e.Id_entreprise
                LEFT JOIN (
                    SELECT DISTINCT ON (Id_signalements) Id_signalements, Id_statut_signalement, update_at
                    FROM Historique_StatutSignalements ORDER BY Id_signalements, update_at DESC
                ) hss ON s.Id_signalements = hss.Id_signalements
                LEFT JOIN statut_signalement ss ON hss.Id_statut_signalement = ss.Id_statut_signalement
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

                const postgresData = postgresMap.get(firebaseId);

                // SYNCHRONISATION BIDIRECTIONNELLE DES ENTREPRISES
                let entrepriseId = null;
                let entrepriseNom = null;
                
                // Cas 1: Firebase a une entreprise → synchroniser vers PostgreSQL
                if (firebaseData.concerned_entreprise && firebaseData.concerned_entreprise.trim() !== '') {
                    entrepriseNom = firebaseData.concerned_entreprise.trim();
                    const entrepriseResult = await query(
                        'SELECT Id_entreprise FROM entreprise WHERE LOWER(nom) = LOWER($1)',
                        [entrepriseNom]
                    );
                    if (entrepriseResult.rows.length > 0) {
                        entrepriseId = entrepriseResult.rows[0].id_entreprise;
                    } else {
                        // Créer l'entreprise dans PostgreSQL
                        const newEntrepriseResult = await query(
                            'INSERT INTO entreprise (nom) VALUES ($1) RETURNING Id_entreprise',
                            [entrepriseNom]
                        );
                        entrepriseId = newEntrepriseResult.rows[0].id_entreprise;
                        console.log(`Nouvelle entreprise créée depuis Firebase: ${entrepriseNom} (ID: ${entrepriseId})`);
                    }
                }
                // Cas 2: PostgreSQL a une entreprise mais pas Firebase → synchroniser vers Firebase
                else if (postgresData && postgresData.entreprise_nom && postgresData.entreprise_nom.trim() !== '') {
                    entrepriseNom = postgresData.entreprise_nom.trim();
                    entrepriseId = postgresData.id_entreprise;
                    console.log(` Entreprise depuis PostgreSQL: ${entrepriseNom} → sera synchronisée vers Firebase`);
                }

                if (!postgresData) {
                    // Nouveau signalement depuis Firebase → l'ajouter à Postgres
                    const insertResult = await query(`
                        INSERT INTO signalements (surface, budget, position, Id_entreprise, Id_users, date_signalement, id_firebase)
                        VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography, $5, 1, $6, $7)
                        RETURNING Id_signalements
                    `, [
                        firebaseData.surface || 0,
                        firebaseData.budget || 0,
                        firebaseData.longitude || 0,
                        firebaseData.lattitude || firebaseData.latitude || 0,
                        entrepriseId,
                        firebaseData.date_alert || new Date().toISOString(),
                        firebaseId
                    ]);

                    // Ajouter le statut initial dans l'historique
                    const newSignalementId = insertResult.rows[0].id_signalements;
                    await query(`
                        INSERT INTO Historique_StatutSignalements (Id_signalements, Id_statut_signalement)
                        VALUES ($1, (SELECT Id_statut_signalement FROM statut_signalement WHERE code = $2))
                    `, [newSignalementId, statusCode]);

                    addedToPostgres++;
                    postgresMap.delete(firebaseId); // Marqué comme traité
                } else {
                    // Le signalement existe dans les deux bases → comparer et synchroniser
                    const firebaseUpdateTime = new Date(firebaseData.updated_at || firebaseData.date_alert || 0);
                    // Utiliser last_modified qui est le MAX entre updated_at (données) et status_update_at (statut)
                    const postgresUpdateTime = new Date(postgresData.last_modified || postgresData.date_signalement || 0);

                    // Vérifier si l'entreprise doit être mise à jour dans PostgreSQL
                    const needsEntrepriseUpdateInPostgres = entrepriseId !== null && 
                        (postgresData.id_entreprise === null || postgresData.id_entreprise !== entrepriseId);

                    // Vérifier si l'entreprise doit être mise à jour dans Firebase
                    const firebaseHasNoEntreprise = !firebaseData.concerned_entreprise || firebaseData.concerned_entreprise.trim() === '';
                    const needsEntrepriseUpdateInFirebase = entrepriseNom && firebaseHasNoEntreprise;

                    if (firebaseUpdateTime > postgresUpdateTime) {
                        // Firebase est plus récent → mettre à jour Postgres
                        // Note: Le trigger updated_at est désactivé pour cette mise à jour, on met la date Firebase
                        await query(
                            `UPDATE signalements SET Id_entreprise = $1, surface = $2, budget = $3, updated_at = $4 WHERE Id_signalements = $5`,
                            [entrepriseId, firebaseData.surface || 0, firebaseData.budget || 0, firebaseUpdateTime, postgresData.id_signalements]
                        );

                        // Mettre à jour le statut si différent
                        if (postgresData.status_code !== statusCode) {
                            await query(`
                                INSERT INTO Historique_StatutSignalements (Id_signalements, Id_statut_signalement)
                                VALUES ($1, (SELECT Id_statut_signalement FROM statut_signalement WHERE code = $2))
                            `, [postgresData.id_signalements, statusCode]);
                        }
                        updatedInPostgres++;
                    } else if (postgresUpdateTime > firebaseUpdateTime) {
                        // Postgres est plus récent → mettre à jour Firebase
                        let status = 'nouveau';
                        if (postgresData.status_code === 'en_cours') status = 'en cours';
                        else if (postgresData.status_code === 'termine') status = 'termine';

                        await db.collection('road_alerts').doc(firebaseId).update({
                            status: status,
                            concerned_entreprise: entrepriseNom || postgresData.entreprise_nom || '',
                            surface: parseFloat(postgresData.surface),
                            budget: parseFloat(postgresData.budget),
                            updated_at: new Date().toISOString()
                        });
                        updatedInFirebase++;

                        // Mettre à jour l'entreprise dans Postgres si nécessaire
                        if (needsEntrepriseUpdateInPostgres) {
                            await query(
                                `UPDATE signalements SET Id_entreprise = $1 WHERE Id_signalements = $2`,
                                [entrepriseId, postgresData.id_signalements]
                            );
                            updatedInPostgres++;
                        }
                    } else {
                        // Les dates sont identiques → synchroniser les entreprises manquantes
                        
                        // Mettre à jour PostgreSQL si l'entreprise manque
                        if (needsEntrepriseUpdateInPostgres) {
                            await query(
                                `UPDATE signalements SET Id_entreprise = $1 WHERE Id_signalements = $2`,
                                [entrepriseId, postgresData.id_signalements]
                            );
                            updatedInPostgres++;
                            console.log(`Entreprise ${entrepriseNom} (ID: ${entrepriseId}) assignée au signalement ${postgresData.id_signalements}`);
                        }

                        // Mettre à jour Firebase si l'entreprise manque
                        if (needsEntrepriseUpdateInFirebase) {
                            await db.collection('road_alerts').doc(firebaseId).update({
                                concerned_entreprise: entrepriseNom,
                                updated_at: new Date().toISOString()
                            });
                            updatedInFirebase++;
                            console.log(`Entreprise ${entrepriseNom} synchronisée vers Firebase pour ${firebaseId}`);
                        }
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
                        updated_at: new Date().toISOString(),
                        UID: postgresData.id_signalements?.toString() || ''
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
                        updated_at: new Date().toISOString(),
                        UID: row.id_signalements?.toString() || ''
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
                updatedInFirebase,
                synced: addedToPostgres,
                updated: updatedInPostgres + updatedInFirebase
            }, `Synchronisation réussie ! ${addedToPostgres} ajoutés, ${updatedInPostgres + updatedInFirebase} mis à jour.`));
        } catch (error) {
            console.error('Erreur de synchronisation:', error);
            res.status(500).json(new ApiModel('error', null, 'Erreur lors de la synchronisation'));
        }
    },

    async syncToFirebase(req, res) {
        // Cette méthode est maintenant fusionnée avec syncFromFirebase
        // On garde la même logique pour la compatibilité
        return this.syncFromFirebase(req, res);
    },

    // Synchronisation bidirectionnelle des utilisateurs entre Postgres et Firebase
    // Compare updated_at des deux côtés pour déterminer quelle source est la plus récente
    async syncUsersToFirebase(req, res) {
        try {
            // Récupérer tous les utilisateurs de type "utilisateur" depuis Postgres
            const usersResult = await query(`
                SELECT u.Id_users, u.username, u.email,
                       tu.label as type_user,
                       st.code as status_code,
                       us.update_at as status_update_at
                FROM users u
                JOIN type_user tu ON u.Id_type_user = tu.Id_type_user
                LEFT JOIN (
                    SELECT DISTINCT ON (Id_users) 
                        Id_users, Id_statut_type, update_at
                    FROM users_status
                    ORDER BY Id_users, update_at DESC
                ) us ON u.Id_users = us.Id_users
                LEFT JOIN statut_type st ON us.Id_statut_type = st.Id_statut_type
                WHERE LOWER(tu.label) = 'utilisateur'
            `);

            // Récupérer tous les utilisateurs de Firebase
            const firebaseSnapshot = await db.collection('users').get();

            let addedToFirebase = 0;
            let updatedInFirebase = 0;
            let addedToPostgres = 0;
            let updatedInPostgres = 0;
            let errors = [];

            // Créer un map des utilisateurs Postgres par email
            const postgresMapByEmail = new Map();
            for (const user of usersResult.rows) {
                postgresMapByEmail.set(user.email.toLowerCase(), user);
            }

            // Set pour tracker les emails déjà traités
            const processedEmails = new Set();

            // 1. Parcourir Firebase → comparer avec Postgres
            for (const doc of firebaseSnapshot.docs) {
                const firebaseData = doc.data();
                const firebaseDocId = doc.id;
                const firebaseEmail = (firebaseData.email || '').toLowerCase();

                if (!firebaseEmail) continue;
                processedEmails.add(firebaseEmail);

                const postgresUser = postgresMapByEmail.get(firebaseEmail);

                if (!postgresUser) {
                    // Utilisateur existe dans Firebase mais pas dans Postgres → l'ajouter à Postgres
                    try {
                        const typeUserResult = await query(
                            `SELECT Id_type_user FROM type_user WHERE LOWER(label) = LOWER($1)`,
                            [firebaseData.type_user || 'utilisateur']
                        );
                        const typeUserId = typeUserResult.rows[0]?.id_type_user || 1;

                        const insertResult = await query(`
                            INSERT INTO users (username, email, password, Id_type_user)
                            VALUES ($1, $2, $3, $4)
                            RETURNING Id_users
                        `, [
                            firebaseEmail.split('@')[0],
                            firebaseEmail,
                            'firebase_user',
                            typeUserId
                        ]);

                        const newUserId = insertResult.rows[0].id_users;
                        const statusCode = firebaseData.status === 'blocked' ? 'blocked' : 'active';
                        await query(`
                            INSERT INTO users_status (Id_users, Id_statut_type, reason)
                            VALUES ($1, (SELECT Id_statut_type FROM statut_type WHERE code = $2), 'Synchronisé depuis Firebase')
                        `, [newUserId, statusCode]);

                        addedToPostgres++;
                    } catch (userError) {
                        if (userError.code !== '23505') {
                            console.error(`Erreur ajout utilisateur Firebase ${firebaseEmail}:`, userError);
                            errors.push(`${firebaseEmail}: ${userError.message}`);
                        }
                    }
                } else {
                    // L'utilisateur existe dans les deux bases → comparer les données
                    const firebaseStatus = firebaseData.status || 'active';
                    const postgresStatus = postgresUser.status_code || 'active';

                    // Si les statuts sont identiques → rien à faire
                    if (firebaseStatus === postgresStatus) continue;

                    // Les statuts diffèrent → comparer les dates updated_at
                    const firebaseUpdatedAt = firebaseData.updated_at ? new Date(firebaseData.updated_at) : new Date(0);
                    const postgresUpdatedAt = postgresUser.status_update_at ? new Date(postgresUser.status_update_at) : new Date(0);

                    if (postgresUpdatedAt > firebaseUpdatedAt) {
                        // Postgres est plus récent → mettre à jour Firebase
                        await db.collection('users').doc(firebaseDocId).update({
                            status: postgresStatus,
                            failed_login_attempt: postgresStatus === 'active' ? 0 : (firebaseData.failed_login_attempt || 0),
                            updated_at: postgresUpdatedAt.toISOString()
                        });
                        updatedInFirebase++;
                        console.log(`Firebase mis à jour pour ${firebaseEmail}: ${firebaseStatus} → ${postgresStatus} (Postgres plus récent)`);
                    } else if (firebaseUpdatedAt > postgresUpdatedAt) {
                        // Firebase est plus récent → mettre à jour Postgres
                        const newStatusCode = firebaseStatus === 'blocked' ? 'blocked' : 'active';
                        await query(`
                            INSERT INTO users_status (Id_users, Id_statut_type, reason)
                            VALUES ($1, (SELECT Id_statut_type FROM statut_type WHERE code = $2), $3)
                        `, [
                            postgresUser.id_users,
                            newStatusCode,
                            `Synchronisé depuis Firebase (${firebaseStatus})`
                        ]);
                        updatedInPostgres++;
                        console.log(`Postgres mis à jour pour ${firebaseEmail}: ${postgresStatus} → ${newStatusCode} (Firebase plus récent)`);
                    }
                    // Si les dates sont égales et statuts différents → situation rare, on ne touche à rien
                }
            }

            // 2. Parcourir Postgres → envoyer à Firebase ceux qui n'existent pas encore
            for (const user of usersResult.rows) {
                const email = user.email.toLowerCase();
                if (processedEmails.has(email)) continue;

                try {
                    const existingSnapshot = await db.collection('users')
                        .where('email', '==', email)
                        .get();

                    if (existingSnapshot.empty) {
                        const userRef = db.collection('users').doc();
                        await userRef.set({
                            email: email,
                            failed_login_attempt: 0,
                            status: user.status_code || 'active',
                            type_user: user.type_user,
                            updated_at: user.status_update_at ? new Date(user.status_update_at).toISOString() : new Date().toISOString()
                        });
                        addedToFirebase++;
                    }
                } catch (userError) {
                    console.error(`Erreur sync vers Firebase pour ${email}:`, userError);
                    errors.push(`${email}: ${userError.message}`);
                }
            }

            const message = errors.length > 0
                ? `Synchronisation terminée avec ${errors.length} erreur(s). Firebase: +${addedToFirebase} ↑${updatedInFirebase} | Postgres: +${addedToPostgres} ↑${updatedInPostgres}`
                : `Synchronisation réussie ! Firebase: +${addedToFirebase} ajoutés, ${updatedInFirebase} mis à jour | Postgres: +${addedToPostgres} ajoutés, ${updatedInPostgres} mis à jour`;

            res.json(new ApiModel('success', {
                addedToFirebase,
                updatedInFirebase,
                addedToPostgres,
                updatedInPostgres,
                errors: errors.length > 0 ? errors : undefined
            }, message));

        } catch (error) {
            console.error('Erreur de synchronisation des utilisateurs:', error);
            res.status(500).json(new ApiModel('error', null, 'Erreur lors de la synchronisation des utilisateurs'));
        }
    }
};

export default syncController;

