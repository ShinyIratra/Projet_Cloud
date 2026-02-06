import { query, isConnected } from '../config/postgres.js';
import ApiModel from '../models/ApiModel.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'votre-secret-jwt-super-securise-2024';

const webAuthController = {

    async login(req, res) {
        const { email, password } = req.body;

        try {
            const result = await query(`
                SELECT u.*, tu.label as type_user_label, 
                    (SELECT st.code FROM users_status us 
                     JOIN statut_type st ON us.Id_statut_type = st.Id_statut_type 
                     WHERE us.Id_users = u.Id_users 
                     ORDER BY us.update_at DESC LIMIT 1) as status
                FROM users u
                JOIN type_user tu ON u.Id_type_user = tu.Id_type_user
                WHERE u.email = $1
            `, [email]);

            if (result.rows.length === 0) {
                return res.status(404).json(new ApiModel('error', null, 'Compte non trouve'));
            }

            const user = result.rows[0];

            if (user.status === 'blocked') {
                return res.status(403).json(new ApiModel('error', null, 'Compte bloque. Contactez un manager.'));
            }

            const configResult = await query(`SELECT valeur FROM configurations WHERE code = 'MAX_LOGIN_ATTEMPTS'`);
            const maxAttempts = configResult.rows[0]?.valeur || 3;

            if (user.password !== password) {
                const attempts = await query(`
                    SELECT COUNT(*) as count FROM users_status us
                    JOIN statut_type st ON us.Id_statut_type = st.Id_statut_type
                    WHERE us.Id_users = $1 AND st.code = 'blocked'
                `, [user.id_users]);

                const failedAttempts = parseInt(attempts.rows[0]?.count || 0) + 1;

                if (failedAttempts >= maxAttempts) {
                    await query(`
                        INSERT INTO users_status (Id_users, Id_statut_type)
                        VALUES ($1, (SELECT Id_statut_type FROM statut_type WHERE code = 'blocked'))
                    `, [user.id_users]);
                    return res.status(403).json(new ApiModel('error', null, 'Compte bloque apres 3 tentatives'));
                }

                return res.status(401).json(new ApiModel('error', null, 'Mot de passe incorrect'));
            }

            // Génération du JWT token
            const token = jwt.sign(
                {
                    id: user.id_users,
                    email: user.email,
                    type_user: user.type_user_label
                },
                JWT_SECRET,
                { expiresIn: '1h' }
            );

            const response = new ApiModel('success', {
                id: user.id_users,
                email: user.email,
                username: user.username,
                type_user: user.type_user_label,
                token: token
            }, 'Connexion reussie');
            res.json(response);

        } catch (error) {
            res.status(500).json(new ApiModel('error', null, error.message));
        }
    },

    async register(req, res) {
        const { username, email, password } = req.body;

        try {
            const existingUser = await query('SELECT * FROM users WHERE email = $1', [email]);
            if (existingUser.rows.length > 0) {
                return res.status(400).json(new ApiModel('error', null, 'Email deja utilise'));
            }

            const result = await query(`
                INSERT INTO users (username, email, password, Id_type_user)
                VALUES ($1, $2, $3, (SELECT Id_type_user FROM type_user WHERE label = 'utilisateur'))
                RETURNING Id_users
            `, [username, email, password]);

            const userId = result.rows[0].id_users;

            await query(`
                INSERT INTO users_status (Id_users, Id_statut_type)
                VALUES ($1, (SELECT Id_statut_type FROM statut_type WHERE code = 'active'))
            `, [userId]);

            res.status(201).json(new ApiModel('success', { id: userId }, 'Inscription reussie'));
        } catch (error) {
            res.status(500).json(new ApiModel('error', null, error.message));
        }
    },

    async unblockUser(req, res) {
        const { userId } = req.body;

        try {
            // Le manager est déjà vérifié via le middleware isManager
            // Vérifier que l'utilisateur existe
            const userCheck = await query(
                'SELECT Id_users FROM users WHERE Id_users = $1',
                [userId]
            );

            if (userCheck.rows.length === 0) {
                return res.status(404).json(new ApiModel('error', null, 'Utilisateur non trouve'));
            }

            await query(`
                INSERT INTO users_status (Id_users, Id_statut_type)
                VALUES ($1, (SELECT Id_statut_type FROM statut_type WHERE code = 'active'))
            `, [userId]);

            res.json(new ApiModel('success', null, 'Utilisateur debloque'));
        } catch (error) {
            res.status(500).json(new ApiModel('error', null, error.message));
        }
    },

    async getBlockedUsers(req, res) {
        try {
            const result = await query(`
                SELECT DISTINCT u.Id_users, u.username, u.email
                FROM users u
                JOIN users_status us ON u.Id_users = us.Id_users
                JOIN statut_type st ON us.Id_statut_type = st.Id_statut_type
                WHERE st.code = 'blocked'
                AND us.update_at = (SELECT MAX(update_at) FROM users_status WHERE Id_users = u.Id_users)
            `);
            res.json(new ApiModel('success', result.rows, null));
        } catch (error) {
            res.status(500).json(new ApiModel('error', null, error.message));
        }
    },

    // Modifier les informations d'un utilisateur
    async updateUserInfo(req, res) {
        const { username, email, password } = req.body;
        const userId = req.user.id; // ID de l'utilisateur connecté

        try {
            // Vérifier si l'email existe déjà pour un autre utilisateur
            if (email) {
                const emailCheck = await query(
                    'SELECT Id_users FROM users WHERE email = $1 AND Id_users != $2',
                    [email, userId]
                );
                if (emailCheck.rows.length > 0) {
                    return res.status(400).json(new ApiModel('error', null, 'Email deja utilise par un autre utilisateur'));
                }
            }

            // Construire la requête de mise à jour dynamiquement
            const updates = [];
            const values = [];
            let paramIndex = 1;

            if (username) {
                updates.push(`username = $${paramIndex}`);
                values.push(username);
                paramIndex++;
            }
            if (email) {
                updates.push(`email = $${paramIndex}`);
                values.push(email);
                paramIndex++;
            }
            if (password) {
                updates.push(`password = $${paramIndex}`);
                values.push(password);
                paramIndex++;
            }

            if (updates.length === 0) {
                return res.status(400).json(new ApiModel('error', null, 'Aucune information a modifier'));
            }

            values.push(userId);
            const updateQuery = `
                UPDATE users 
                SET ${updates.join(', ')}
                WHERE Id_users = $${paramIndex}
                RETURNING Id_users, username, email
            `;

            const result = await query(updateQuery, values);

            if (result.rows.length === 0) {
                return res.status(404).json(new ApiModel('error', null, 'Utilisateur non trouve'));
            }

            res.json(new ApiModel('success', result.rows[0], 'Informations modifiees avec succes'));
        } catch (error) {
            res.status(500).json(new ApiModel('error', null, error.message));
        }
    }
};

export default webAuthController;
