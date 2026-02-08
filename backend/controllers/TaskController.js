import { query } from '../config/postgres.js';
import TaskModel from '../models/TaskModel.js';
import ApiModel from '../models/ApiModel.js';

/**
 * TaskController - Contrôleur pour le suivi d'avancement des signalements
 * S'adapte à la base existante (tables signalements + statut_signalement)
 * Calcul automatique : Nouveau → 0%, En cours → 50%, Terminé → 100%
 * Dates enregistrées : date_signalement (début), updated_at (mise à jour/fin)
 */
const TaskController = {

    // =====================
    // LISTE DES SIGNALEMENTS AVEC AVANCEMENT
    // =====================

    /**
     * Récupérer tous les signalements avec leur avancement calculé
     */
    async getAllAvancement(req, res) {
        try {
            const result = await query(`
                SELECT 
                    s.id_signalements,
                    s.surface,
                    s.budget,
                    ss.code AS statut_code,
                    ss.label AS statut_label,
                    CASE 
                        WHEN ss.code = 'nouveau' THEN 0
                        WHEN ss.code = 'en_cours' THEN 50
                        WHEN ss.code = 'termine' THEN 100
                        ELSE 0
                    END AS avancement_pourcentage,
                    s.date_signalement,
                    s.updated_at,
                    CASE 
                        WHEN ss.code = 'termine' THEN s.updated_at
                        ELSE NULL
                    END AS date_fin,
                    CASE 
                        WHEN ss.code = 'termine' AND s.date_signalement IS NOT NULL 
                        THEN ROUND(EXTRACT(EPOCH FROM (s.updated_at - s.date_signalement)) / 86400.0, 2)
                        ELSE NULL
                    END AS duree_jours,
                    e.nom AS entreprise_nom,
                    u.username AS utilisateur_nom,
                    s.id_entreprise,
                    s.id_users,
                    s.id_firebase
                FROM signalements s
                LEFT JOIN statut_signalement ss ON s.id_statut_signalement = ss.id_statut_signalement
                LEFT JOIN entreprise e ON s.id_entreprise = e.id_entreprise
                LEFT JOIN users u ON s.id_users = u.id_users
                ORDER BY s.date_signalement DESC
            `);

            const signalements = result.rows.map(row => {
                const task = new TaskModel({
                    id_signalements: row.id_signalements,
                    surface: parseFloat(row.surface) || 0,
                    budget: parseFloat(row.budget) || 0,
                    statut_code: row.statut_code,
                    statut_label: row.statut_label,
                    date_signalement: row.date_signalement,
                    updated_at: row.updated_at,
                    id_entreprise: row.id_entreprise,
                    entreprise_nom: row.entreprise_nom,
                    id_users: row.id_users,
                    utilisateur_nom: row.utilisateur_nom,
                    id_firebase: row.id_firebase
                });
                return task.toJSON();
            });

            res.status(200).json(
                new ApiModel('success', signalements, null)
            );
        } catch (error) {
            console.error('Erreur récupération avancement:', error);
            res.status(500).json(
                new ApiModel('error', null, error.message)
            );
        }
    },

    /**
     * Récupérer l'avancement d'un signalement par ID
     */
    async getAvancementById(req, res) {
        try {
            const { id } = req.params;

            const result = await query(`
                SELECT 
                    s.id_signalements,
                    s.surface,
                    s.budget,
                    ss.code AS statut_code,
                    ss.label AS statut_label,
                    CASE 
                        WHEN ss.code = 'nouveau' THEN 0
                        WHEN ss.code = 'en_cours' THEN 50
                        WHEN ss.code = 'termine' THEN 100
                        ELSE 0
                    END AS avancement_pourcentage,
                    s.date_signalement,
                    s.updated_at,
                    CASE 
                        WHEN ss.code = 'termine' THEN s.updated_at
                        ELSE NULL
                    END AS date_fin,
                    CASE 
                        WHEN ss.code = 'termine' AND s.date_signalement IS NOT NULL 
                        THEN ROUND(EXTRACT(EPOCH FROM (s.updated_at - s.date_signalement)) / 86400.0, 2)
                        ELSE NULL
                    END AS duree_jours,
                    e.nom AS entreprise_nom,
                    u.username AS utilisateur_nom,
                    s.id_entreprise,
                    s.id_users,
                    s.id_firebase
                FROM signalements s
                LEFT JOIN statut_signalement ss ON s.id_statut_signalement = ss.id_statut_signalement
                LEFT JOIN entreprise e ON s.id_entreprise = e.id_entreprise
                LEFT JOIN users u ON s.id_users = u.id_users
                WHERE s.id_signalements = $1
            `, [id]);

            if (result.rows.length === 0) {
                return res.status(404).json(
                    new ApiModel('error', null, 'Signalement non trouvé')
                );
            }

            const row = result.rows[0];
            const task = new TaskModel({
                id_signalements: row.id_signalements,
                surface: parseFloat(row.surface) || 0,
                budget: parseFloat(row.budget) || 0,
                statut_code: row.statut_code,
                statut_label: row.statut_label,
                date_signalement: row.date_signalement,
                updated_at: row.updated_at,
                id_entreprise: row.id_entreprise,
                entreprise_nom: row.entreprise_nom,
                id_users: row.id_users,
                utilisateur_nom: row.utilisateur_nom,
                id_firebase: row.id_firebase
            });

            res.status(200).json(
                new ApiModel('success', task.toJSON(), null)
            );
        } catch (error) {
            console.error('Erreur récupération avancement:', error);
            res.status(500).json(
                new ApiModel('error', null, error.message)
            );
        }
    },

    /**
     * Mettre à jour le statut d'un signalement (calcul automatique du %)
     * Met à jour automatiquement updated_at pour enregistrer la date de transition
     */
    async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const { statut } = req.body;

            if (!statut) {
                return res.status(400).json(
                    new ApiModel('error', null, 'Le statut est obligatoire')
                );
            }

            // Vérifier que le statut existe
            const statutResult = await query(
                'SELECT id_statut_signalement, code, label FROM statut_signalement WHERE code = $1',
                [statut]
            );

            if (statutResult.rows.length === 0) {
                return res.status(400).json(
                    new ApiModel('error', null, 'Statut invalide. Utilisez: nouveau, en_cours, termine')
                );
            }

            const { id_statut_signalement } = statutResult.rows[0];
            const pourcentage = TaskModel.statutToPourcentage(statut);

            // Mettre à jour le signalement (updated_at enregistre la date de transition)
            const result = await query(`
                UPDATE signalements SET
                    id_statut_signalement = $1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id_signalements = $2
                RETURNING *
            `, [id_statut_signalement, id]);

            if (result.rows.length === 0) {
                return res.status(404).json(
                    new ApiModel('error', null, 'Signalement non trouvé')
                );
            }

            res.status(200).json(
                new ApiModel('success', {
                    id: parseInt(id),
                    statut: statut,
                    avancement_pourcentage: pourcentage,
                    date_mise_a_jour: result.rows[0].updated_at
                }, `Statut mis à jour: ${pourcentage}% d'avancement`)
            );
        } catch (error) {
            console.error('Erreur mise à jour statut:', error);
            res.status(500).json(
                new ApiModel('error', null, error.message)
            );
        }
    },

    // =====================
    // STATISTIQUES DE PERFORMANCE
    // =====================

    /**
     * Statistiques globales calculées depuis la table signalements
     * Inclut le délai moyen de traitement
     */
    async getStatistiques(req, res) {
        try {
            const result = await query(`
                SELECT 
                    COUNT(*) AS total_signalements,
                    COUNT(CASE WHEN ss.code = 'nouveau' THEN 1 END) AS signalements_nouveaux,
                    COUNT(CASE WHEN ss.code = 'en_cours' THEN 1 END) AS signalements_en_cours,
                    COUNT(CASE WHEN ss.code = 'termine' THEN 1 END) AS signalements_termines,
                    ROUND(AVG(
                        CASE 
                            WHEN ss.code = 'nouveau' THEN 0
                            WHEN ss.code = 'en_cours' THEN 50
                            WHEN ss.code = 'termine' THEN 100
                            ELSE 0
                        END
                    )::numeric, 2) AS avancement_moyen,
                    ROUND(AVG(
                        CASE 
                            WHEN ss.code = 'termine' AND s.date_signalement IS NOT NULL 
                            THEN EXTRACT(EPOCH FROM (s.updated_at - s.date_signalement)) / 86400.0
                        END
                    )::numeric, 2) AS delai_moyen_jours,
                    ROUND(MIN(
                        CASE 
                            WHEN ss.code = 'termine' AND s.date_signalement IS NOT NULL 
                            THEN EXTRACT(EPOCH FROM (s.updated_at - s.date_signalement)) / 86400.0
                        END
                    )::numeric, 2) AS delai_min_jours,
                    ROUND(MAX(
                        CASE 
                            WHEN ss.code = 'termine' AND s.date_signalement IS NOT NULL 
                            THEN EXTRACT(EPOCH FROM (s.updated_at - s.date_signalement)) / 86400.0
                        END
                    )::numeric, 2) AS delai_max_jours
                FROM signalements s
                LEFT JOIN statut_signalement ss ON s.id_statut_signalement = ss.id_statut_signalement
            `);

            const stats = result.rows[0];

            const totalSignalements = parseInt(stats.total_signalements) || 0;
            const signalementTermines = parseInt(stats.signalements_termines) || 0;

            const statistiques = {
                total_signalements: totalSignalements,
                signalements_nouveaux: parseInt(stats.signalements_nouveaux) || 0,
                signalements_en_cours: parseInt(stats.signalements_en_cours) || 0,
                signalements_termines: signalementTermines,
                avancement_moyen: parseFloat(stats.avancement_moyen) || 0,
                delai_moyen_jours: stats.delai_moyen_jours ? parseFloat(stats.delai_moyen_jours) : null,
                delai_min_jours: stats.delai_min_jours ? parseFloat(stats.delai_min_jours) : null,
                delai_max_jours: stats.delai_max_jours ? parseFloat(stats.delai_max_jours) : null,
                taux_completion: totalSignalements > 0 
                    ? Math.round((signalementTermines / totalSignalements) * 100 * 100) / 100
                    : 0
            };

            res.status(200).json(
                new ApiModel('success', statistiques, null)
            );
        } catch (error) {
            console.error('Erreur statistiques:', error);
            res.status(500).json(
                new ApiModel('error', null, error.message)
            );
        }
    },

    /**
     * Statistiques par entreprise
     */
    async getStatistiquesParEntreprise(req, res) {
        try {
            const result = await query(`
                SELECT 
                    e.id_entreprise,
                    e.nom AS entreprise_nom,
                    COUNT(s.id_signalements) AS total_signalements,
                    COUNT(CASE WHEN ss.code = 'termine' THEN 1 END) AS signalements_termines,
                    ROUND(AVG(
                        CASE 
                            WHEN ss.code = 'nouveau' THEN 0
                            WHEN ss.code = 'en_cours' THEN 50
                            WHEN ss.code = 'termine' THEN 100
                            ELSE 0
                        END
                    )::numeric, 2) AS avancement_moyen,
                    ROUND(AVG(
                        CASE 
                            WHEN ss.code = 'termine' AND s.date_signalement IS NOT NULL 
                            THEN EXTRACT(EPOCH FROM (s.updated_at - s.date_signalement)) / 86400.0
                        END
                    )::numeric, 2) AS delai_moyen_jours
                FROM entreprise e
                LEFT JOIN signalements s ON e.id_entreprise = s.id_entreprise
                LEFT JOIN statut_signalement ss ON s.id_statut_signalement = ss.id_statut_signalement
                GROUP BY e.id_entreprise, e.nom
                ORDER BY e.nom
            `);

            const statsEntreprises = result.rows.map(row => ({
                id_entreprise: row.id_entreprise,
                entreprise_nom: row.entreprise_nom,
                total_signalements: parseInt(row.total_signalements) || 0,
                signalements_termines: parseInt(row.signalements_termines) || 0,
                avancement_moyen: parseFloat(row.avancement_moyen) || 0,
                delai_moyen_jours: row.delai_moyen_jours ? parseFloat(row.delai_moyen_jours) : null
            }));

            res.status(200).json(
                new ApiModel('success', statsEntreprises, null)
            );
        } catch (error) {
            console.error('Erreur statistiques entreprises:', error);
            res.status(500).json(
                new ApiModel('error', null, error.message)
            );
        }
    },

    /**
     * Tableau de performance détaillé : chaque signalement avec ses dates et durées
     */
    async getPerformanceTable(req, res) {
        try {
            const result = await query(`
                SELECT 
                    s.id_signalements,
                    s.surface,
                    s.budget,
                    ss.code AS statut_code,
                    ss.label AS statut_label,
                    CASE 
                        WHEN ss.code = 'nouveau' THEN 0
                        WHEN ss.code = 'en_cours' THEN 50
                        WHEN ss.code = 'termine' THEN 100
                        ELSE 0
                    END AS avancement_pourcentage,
                    s.date_signalement,
                    s.updated_at AS date_mise_a_jour,
                    CASE 
                        WHEN ss.code = 'termine' THEN s.updated_at
                        ELSE NULL
                    END AS date_fin,
                    CASE 
                        WHEN ss.code = 'termine' AND s.date_signalement IS NOT NULL 
                        THEN ROUND(EXTRACT(EPOCH FROM (s.updated_at - s.date_signalement)) / 86400.0, 2)
                        ELSE NULL
                    END AS duree_jours,
                    e.nom AS entreprise_nom,
                    u.username AS utilisateur_nom,
                    s.id_entreprise,
                    s.id_users
                FROM signalements s
                LEFT JOIN statut_signalement ss ON s.id_statut_signalement = ss.id_statut_signalement
                LEFT JOIN entreprise e ON s.id_entreprise = e.id_entreprise
                LEFT JOIN users u ON s.id_users = u.id_users
                ORDER BY s.date_signalement DESC
            `);

            const rows = result.rows.map(row => ({
                id: row.id_signalements,
                surface: parseFloat(row.surface) || 0,
                budget: parseFloat(row.budget) || 0,
                statut: row.statut_code,
                statut_label: row.statut_label,
                avancement_pourcentage: parseInt(row.avancement_pourcentage),
                date_signalement: row.date_signalement,
                date_mise_a_jour: row.date_mise_a_jour,
                date_fin: row.date_fin,
                duree_jours: row.duree_jours ? parseFloat(row.duree_jours) : null,
                entreprise_nom: row.entreprise_nom,
                utilisateur_nom: row.utilisateur_nom
            }));

            res.status(200).json(
                new ApiModel('success', rows, null)
            );
        } catch (error) {
            console.error('Erreur tableau performance:', error);
            res.status(500).json(
                new ApiModel('error', null, error.message)
            );
        }
    },

    /**
     * Récupérer les statuts disponibles avec pourcentages
     */
    async getStatuts(req, res) {
        try {
            const result = await query(`
                SELECT code, label FROM statut_signalement ORDER BY id_statut_signalement
            `);

            const statuts = result.rows.map(row => ({
                code: row.code,
                label: row.label,
                pourcentage: TaskModel.statutToPourcentage(row.code)
            }));

            res.status(200).json(
                new ApiModel('success', statuts, null)
            );
        } catch (error) {
            console.error('Erreur récupération statuts:', error);
            res.status(500).json(
                new ApiModel('error', null, error.message)
            );
        }
    }
};

export default TaskController;
