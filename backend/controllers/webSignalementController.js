import { query } from '../config/postgres.js';
import ApiModel from '../models/ApiModel.js';

const webSignalementController = {

    async getAll(req, res) {
        try {
            const result = await query(`
                SELECT 
                    s.Id_signalements as id,
                    s.surface,
                    s.budget,
                    s.lattitude,
                    s.longitude,
                    s.date_signalement,
                    ss.label as status,
                    ss.code as status_code,
                    e.nom as entreprise
                FROM signalements s
                LEFT JOIN statut_signalement ss ON s.Id_statut_signalement = ss.Id_statut_signalement
                LEFT JOIN entreprise e ON s.Id_entreprise = e.Id_entreprise
                ORDER BY s.date_signalement DESC
            `);
            res.json(new ApiModel('success', result.rows, null));
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
                updates.push(`Id_entreprise = (SELECT Id_entreprise FROM entreprise WHERE nom = $${paramIndex++})`);
                values.push(entreprise);
            }
            if (status !== undefined) {
                updates.push(`Id_statut_signalement = (SELECT Id_statut_signalement FROM statut_signalement WHERE code = $${paramIndex++})`);
                values.push(status);
            }

            if (updates.length === 0) {
                return res.status(400).json(new ApiModel('error', null, 'Aucune donnee a mettre a jour'));
            }

            sql += updates.join(', ') + ` WHERE Id_signalements = $${paramIndex}`;
            values.push(id);

            await query(sql, values);
            res.json(new ApiModel('success', null, 'Signalement mis a jour'));
        } catch (error) {
            res.status(500).json(new ApiModel('error', null, error.message));
        }
    },

    async updateStatus(req, res) {
        const { id, status } = req.body;

        try {
            await query(`
                UPDATE signalements 
                SET Id_statut_signalement = (SELECT Id_statut_signalement FROM statut_signalement WHERE code = $1)
                WHERE Id_signalements = $2
            `, [status, id]);

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
