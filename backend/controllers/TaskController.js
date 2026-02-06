import { query } from '../config/postgres.js';
import TaskModel from '../models/TaskModel.js';
import ApiModel from '../models/ApiModel.js';

/**
 * TaskController - Contrôleur pour la gestion des travaux
 * Gère les opérations CRUD et les statistiques de performance
 */
const TaskController = {

    // =====================
    // OPÉRATIONS CRUD
    // =====================

    /**
     * Créer un nouveau travail
     */
    async createTask(req, res) {
        try {
            const { 
                titre, 
                description, 
                statut = 'nouveau', 
                date_debut, 
                date_fin, 
                date_prevue_fin,
                id_signalement,
                id_entreprise,
                id_users_responsable 
            } = req.body;

            if (!titre) {
                return res.status(400).json(
                    new ApiModel('error', null, 'Le titre est obligatoire')
                );
            }

            // Récupérer l'id du statut
            const statutResult = await query(
                'SELECT id_statut_travaux FROM statut_travaux WHERE code = $1',
                [statut]
            );

            const idStatut = statutResult.rows[0]?.id_statut_travaux || 1;

            const result = await query(
                `INSERT INTO travaux 
                (titre, description, id_statut_travaux, date_debut, date_fin, date_prevue_fin, 
                 id_signalement, id_entreprise, id_users_responsable)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *`,
                [titre, description, idStatut, date_debut, date_fin, date_prevue_fin,
                 id_signalement, id_entreprise, id_users_responsable]
            );

            const task = new TaskModel({
                ...result.rows[0],
                statut_code: statut
            });

            res.status(201).json(
                new ApiModel('success', task.toJSON(), 'Travail créé avec succès')
            );
        } catch (error) {
            console.error('Erreur création travail:', error);
            res.status(500).json(
                new ApiModel('error', null, error.message)
            );
        }
    },

    /**
     * Récupérer tous les travaux avec avancement
     */
    async getAllTasks(req, res) {
        try {
            const result = await query(`
                SELECT 
                    t.id_travaux,
                    t.titre,
                    t.description,
                    st.code AS statut_code,
                    st.label AS statut_label,
                    st.pourcentage AS avancement_pourcentage,
                    t.date_debut,
                    t.date_fin,
                    t.date_prevue_fin,
                    t.id_signalement,
                    t.id_entreprise,
                    t.id_users_responsable,
                    e.nom AS entreprise_nom,
                    u.username AS responsable_nom,
                    t.created_at,
                    t.updated_at
                FROM travaux t
                LEFT JOIN statut_travaux st ON t.id_statut_travaux = st.id_statut_travaux
                LEFT JOIN entreprise e ON t.id_entreprise = e.id_entreprise
                LEFT JOIN users u ON t.id_users_responsable = u.id_users
                ORDER BY t.created_at DESC
            `);

            const tasks = result.rows.map(row => {
                const task = new TaskModel({
                    id: row.id_travaux,
                    titre: row.titre,
                    description: row.description,
                    statut: row.statut_code,
                    date_debut: row.date_debut,
                    date_fin: row.date_fin,
                    date_prevue_fin: row.date_prevue_fin,
                    id_signalement: row.id_signalement,
                    id_entreprise: row.id_entreprise,
                    id_responsable: row.id_users_responsable,
                    entreprise_nom: row.entreprise_nom,
                    responsable_nom: row.responsable_nom,
                    created_at: row.created_at,
                    updated_at: row.updated_at
                });
                return task.toJSON();
            });

            res.status(200).json(
                new ApiModel('success', tasks, null)
            );
        } catch (error) {
            console.error('Erreur récupération travaux:', error);
            res.status(500).json(
                new ApiModel('error', null, error.message)
            );
        }
    },

    /**
     * Récupérer un travail par son ID
     */
    async getTaskById(req, res) {
        try {
            const { id } = req.params;

            const result = await query(`
                SELECT 
                    t.id_travaux,
                    t.titre,
                    t.description,
                    st.code AS statut_code,
                    st.label AS statut_label,
                    st.pourcentage AS avancement_pourcentage,
                    t.date_debut,
                    t.date_fin,
                    t.date_prevue_fin,
                    t.id_signalement,
                    t.id_entreprise,
                    t.id_users_responsable,
                    e.nom AS entreprise_nom,
                    u.username AS responsable_nom,
                    t.created_at,
                    t.updated_at
                FROM travaux t
                LEFT JOIN statut_travaux st ON t.id_statut_travaux = st.id_statut_travaux
                LEFT JOIN entreprise e ON t.id_entreprise = e.id_entreprise
                LEFT JOIN users u ON t.id_users_responsable = u.id_users
                WHERE t.id_travaux = $1
            `, [id]);

            if (result.rows.length === 0) {
                return res.status(404).json(
                    new ApiModel('error', null, 'Travail non trouvé')
                );
            }

            const row = result.rows[0];
            const task = new TaskModel({
                id: row.id_travaux,
                titre: row.titre,
                description: row.description,
                statut: row.statut_code,
                date_debut: row.date_debut,
                date_fin: row.date_fin,
                date_prevue_fin: row.date_prevue_fin,
                id_signalement: row.id_signalement,
                id_entreprise: row.id_entreprise,
                id_responsable: row.id_users_responsable,
                entreprise_nom: row.entreprise_nom,
                responsable_nom: row.responsable_nom,
                created_at: row.created_at,
                updated_at: row.updated_at
            });

            res.status(200).json(
                new ApiModel('success', task.toJSON(), null)
            );
        } catch (error) {
            console.error('Erreur récupération travail:', error);
            res.status(500).json(
                new ApiModel('error', null, error.message)
            );
        }
    },

    /**
     * Mettre à jour un travail
     */
    async updateTask(req, res) {
        try {
            const { id } = req.params;
            const { 
                titre, 
                description, 
                statut, 
                date_debut, 
                date_fin, 
                date_prevue_fin,
                id_signalement,
                id_entreprise,
                id_users_responsable 
            } = req.body;

            // Récupérer l'id du statut si fourni
            let idStatut = null;
            if (statut) {
                const statutResult = await query(
                    'SELECT id_statut_travaux FROM statut_travaux WHERE code = $1',
                    [statut]
                );
                idStatut = statutResult.rows[0]?.id_statut_travaux;
            }

            const result = await query(`
                UPDATE travaux SET
                    titre = COALESCE($1, titre),
                    description = COALESCE($2, description),
                    id_statut_travaux = COALESCE($3, id_statut_travaux),
                    date_debut = COALESCE($4, date_debut),
                    date_fin = COALESCE($5, date_fin),
                    date_prevue_fin = COALESCE($6, date_prevue_fin),
                    id_signalement = COALESCE($7, id_signalement),
                    id_entreprise = COALESCE($8, id_entreprise),
                    id_users_responsable = COALESCE($9, id_users_responsable),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id_travaux = $10
                RETURNING *
            `, [titre, description, idStatut, date_debut, date_fin, date_prevue_fin,
                id_signalement, id_entreprise, id_users_responsable, id]);

            if (result.rows.length === 0) {
                return res.status(404).json(
                    new ApiModel('error', null, 'Travail non trouvé')
                );
            }

            res.status(200).json(
                new ApiModel('success', result.rows[0], 'Travail mis à jour avec succès')
            );
        } catch (error) {
            console.error('Erreur mise à jour travail:', error);
            res.status(500).json(
                new ApiModel('error', null, error.message)
            );
        }
    },

    /**
     * Mettre à jour le statut d'un travail (et calcul automatique du pourcentage)
     */
    async updateTaskStatus(req, res) {
        try {
            const { id } = req.params;
            const { statut } = req.body;

            if (!statut) {
                return res.status(400).json(
                    new ApiModel('error', null, 'Le statut est obligatoire')
                );
            }

            // Récupérer l'id et le pourcentage du statut
            const statutResult = await query(
                'SELECT id_statut_travaux, pourcentage FROM statut_travaux WHERE code = $1',
                [statut]
            );

            if (statutResult.rows.length === 0) {
                return res.status(400).json(
                    new ApiModel('error', null, 'Statut invalide. Utilisez: nouveau, en_cours, termine')
                );
            }

            const { id_statut_travaux, pourcentage } = statutResult.rows[0];

            // Préparer les dates automatiques selon le statut
            let updateQuery = `
                UPDATE travaux SET
                    id_statut_travaux = $1,
                    updated_at = CURRENT_TIMESTAMP
            `;
            const params = [id_statut_travaux];
            let paramIndex = 2;

            // Si passage à "en_cours", définir date_debut si null
            if (statut === 'en_cours') {
                updateQuery += `, date_debut = COALESCE(date_debut, CURRENT_TIMESTAMP)`;
            }

            // Si passage à "termine", définir date_fin si null
            if (statut === 'termine') {
                updateQuery += `, date_fin = COALESCE(date_fin, CURRENT_TIMESTAMP)`;
            }

            updateQuery += ` WHERE id_travaux = $${paramIndex} RETURNING *`;
            params.push(id);

            const result = await query(updateQuery, params);

            if (result.rows.length === 0) {
                return res.status(404).json(
                    new ApiModel('error', null, 'Travail non trouvé')
                );
            }

            res.status(200).json(
                new ApiModel('success', {
                    ...result.rows[0],
                    statut: statut,
                    avancement_pourcentage: pourcentage
                }, `Statut mis à jour: ${pourcentage}% d'avancement`)
            );
        } catch (error) {
            console.error('Erreur mise à jour statut:', error);
            res.status(500).json(
                new ApiModel('error', null, error.message)
            );
        }
    },

    /**
     * Supprimer un travail
     */
    async deleteTask(req, res) {
        try {
            const { id } = req.params;

            const result = await query(
                'DELETE FROM travaux WHERE id_travaux = $1 RETURNING *',
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json(
                    new ApiModel('error', null, 'Travail non trouvé')
                );
            }

            res.status(200).json(
                new ApiModel('success', null, 'Travail supprimé avec succès')
            );
        } catch (error) {
            console.error('Erreur suppression travail:', error);
            res.status(500).json(
                new ApiModel('error', null, error.message)
            );
        }
    },

    // =====================
    // STATISTIQUES DE PERFORMANCE
    // =====================

    /**
     * Récupérer les statistiques globales
     */
    async getStatistiques(req, res) {
        try {
            const result = await query(`
                SELECT 
                    COUNT(*) AS total_travaux,
                    COUNT(CASE WHEN st.code = 'nouveau' THEN 1 END) AS travaux_nouveaux,
                    COUNT(CASE WHEN st.code = 'en_cours' THEN 1 END) AS travaux_en_cours,
                    COUNT(CASE WHEN st.code = 'termine' THEN 1 END) AS travaux_termines,
                    ROUND(AVG(st.pourcentage)::numeric, 2) AS avancement_moyen,
                    ROUND(AVG(
                        CASE 
                            WHEN t.date_debut IS NOT NULL AND t.date_fin IS NOT NULL 
                            THEN EXTRACT(EPOCH FROM (t.date_fin - t.date_debut)) / 86400.0
                        END
                    )::numeric, 2) AS delai_moyen_jours,
                    ROUND(MIN(
                        CASE 
                            WHEN t.date_debut IS NOT NULL AND t.date_fin IS NOT NULL 
                            THEN EXTRACT(EPOCH FROM (t.date_fin - t.date_debut)) / 86400.0
                        END
                    )::numeric, 2) AS delai_min_jours,
                    ROUND(MAX(
                        CASE 
                            WHEN t.date_debut IS NOT NULL AND t.date_fin IS NOT NULL 
                            THEN EXTRACT(EPOCH FROM (t.date_fin - t.date_debut)) / 86400.0
                        END
                    )::numeric, 2) AS delai_max_jours,
                    COUNT(
                        CASE 
                            WHEN t.date_prevue_fin IS NOT NULL 
                            AND (
                                (st.code = 'termine' AND t.date_fin > t.date_prevue_fin)
                                OR (st.code != 'termine' AND CURRENT_TIMESTAMP > t.date_prevue_fin)
                            )
                            THEN 1 
                        END
                    ) AS travaux_en_retard
                FROM travaux t
                LEFT JOIN statut_travaux st ON t.id_statut_travaux = st.id_statut_travaux
            `);

            const stats = result.rows[0];

            // Convertir les valeurs en nombres
            const statistiques = {
                total_travaux: parseInt(stats.total_travaux) || 0,
                travaux_nouveaux: parseInt(stats.travaux_nouveaux) || 0,
                travaux_en_cours: parseInt(stats.travaux_en_cours) || 0,
                travaux_termines: parseInt(stats.travaux_termines) || 0,
                avancement_moyen: parseFloat(stats.avancement_moyen) || 0,
                delai_moyen_jours: stats.delai_moyen_jours ? parseFloat(stats.delai_moyen_jours) : null,
                delai_min_jours: stats.delai_min_jours ? parseFloat(stats.delai_min_jours) : null,
                delai_max_jours: stats.delai_max_jours ? parseFloat(stats.delai_max_jours) : null,
                travaux_en_retard: parseInt(stats.travaux_en_retard) || 0,
                taux_completion: stats.total_travaux > 0 
                    ? Math.round((parseInt(stats.travaux_termines) / parseInt(stats.total_travaux)) * 100 * 100) / 100
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
     * Récupérer les statistiques par période
     */
    async getStatistiquesPeriode(req, res) {
        try {
            const { date_debut, date_fin } = req.query;

            let whereClause = '';
            const params = [];

            if (date_debut) {
                params.push(date_debut);
                whereClause += ` AND t.created_at >= $${params.length}`;
            }
            if (date_fin) {
                params.push(date_fin);
                whereClause += ` AND t.created_at <= $${params.length}`;
            }

            const result = await query(`
                SELECT 
                    COUNT(*) AS total_travaux,
                    COUNT(CASE WHEN st.code = 'nouveau' THEN 1 END) AS travaux_nouveaux,
                    COUNT(CASE WHEN st.code = 'en_cours' THEN 1 END) AS travaux_en_cours,
                    COUNT(CASE WHEN st.code = 'termine' THEN 1 END) AS travaux_termines,
                    ROUND(AVG(st.pourcentage)::numeric, 2) AS avancement_moyen,
                    ROUND(AVG(
                        CASE 
                            WHEN t.date_debut IS NOT NULL AND t.date_fin IS NOT NULL 
                            THEN EXTRACT(EPOCH FROM (t.date_fin - t.date_debut)) / 86400.0
                        END
                    )::numeric, 2) AS delai_moyen_jours
                FROM travaux t
                LEFT JOIN statut_travaux st ON t.id_statut_travaux = st.id_statut_travaux
                WHERE 1=1 ${whereClause}
            `, params);

            res.status(200).json(
                new ApiModel('success', result.rows[0], null)
            );
        } catch (error) {
            console.error('Erreur statistiques période:', error);
            res.status(500).json(
                new ApiModel('error', null, error.message)
            );
        }
    },

    /**
     * Récupérer les statistiques par entreprise
     */
    async getStatistiquesParEntreprise(req, res) {
        try {
            const result = await query(`
                SELECT 
                    e.id_entreprise,
                    e.nom AS entreprise_nom,
                    COUNT(t.id_travaux) AS total_travaux,
                    COUNT(CASE WHEN st.code = 'termine' THEN 1 END) AS travaux_termines,
                    ROUND(AVG(st.pourcentage)::numeric, 2) AS avancement_moyen,
                    ROUND(AVG(
                        CASE 
                            WHEN t.date_debut IS NOT NULL AND t.date_fin IS NOT NULL 
                            THEN EXTRACT(EPOCH FROM (t.date_fin - t.date_debut)) / 86400.0
                        END
                    )::numeric, 2) AS delai_moyen_jours
                FROM entreprise e
                LEFT JOIN travaux t ON e.id_entreprise = t.id_entreprise
                LEFT JOIN statut_travaux st ON t.id_statut_travaux = st.id_statut_travaux
                GROUP BY e.id_entreprise, e.nom
                ORDER BY e.nom
            `);

            const statsEntreprises = result.rows.map(row => ({
                id_entreprise: row.id_entreprise,
                entreprise_nom: row.entreprise_nom,
                total_travaux: parseInt(row.total_travaux) || 0,
                travaux_termines: parseInt(row.travaux_termines) || 0,
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
     * Récupérer les statuts disponibles avec leurs pourcentages
     */
    async getStatuts(req, res) {
        try {
            const result = await query(`
                SELECT code, label, pourcentage 
                FROM statut_travaux 
                ORDER BY pourcentage
            `);

            res.status(200).json(
                new ApiModel('success', result.rows, null)
            );
        } catch (error) {
            console.error('Erreur récupération statuts:', error);
            res.status(500).json(
                new ApiModel('error', null, error.message)
            );
        }
    },

    /**
     * Récupérer le tableau de performance détaillé
     */
    async getPerformanceTable(req, res) {
        try {
            const result = await query(`
                SELECT 
                    t.id_travaux,
                    t.titre,
                    st.label AS statut,
                    st.pourcentage AS avancement_pourcentage,
                    t.date_debut,
                    t.date_fin,
                    t.date_prevue_fin,
                    CASE 
                        WHEN t.date_debut IS NOT NULL AND t.date_fin IS NOT NULL 
                        THEN ROUND(EXTRACT(EPOCH FROM (t.date_fin - t.date_debut)) / 86400.0, 2)
                        ELSE NULL 
                    END AS duree_jours,
                    CASE 
                        WHEN t.date_prevue_fin IS NOT NULL 
                        AND (
                            (st.code = 'termine' AND t.date_fin > t.date_prevue_fin)
                            OR (st.code != 'termine' AND CURRENT_TIMESTAMP > t.date_prevue_fin)
                        )
                        THEN true
                        ELSE false
                    END AS en_retard,
                    e.nom AS entreprise_nom,
                    u.username AS responsable_nom
                FROM travaux t
                LEFT JOIN statut_travaux st ON t.id_statut_travaux = st.id_statut_travaux
                LEFT JOIN entreprise e ON t.id_entreprise = e.id_entreprise
                LEFT JOIN users u ON t.id_users_responsable = u.id_users
                ORDER BY t.created_at DESC
            `);

            res.status(200).json(
                new ApiModel('success', result.rows, null)
            );
        } catch (error) {
            console.error('Erreur tableau performance:', error);
            res.status(500).json(
                new ApiModel('error', null, error.message)
            );
        }
    }
};

export default TaskController;
