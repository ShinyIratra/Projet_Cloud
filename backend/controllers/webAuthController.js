import { query, isConnected } from '../config/postgres.js';
import ApiModel from '../models/ApiModel.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'votre-secret-jwt-super-securise-2024';

const webAuthController = {

    async login(req, res) {
        const { email, password } = req.body;

        try {
            // Validation des entrées
            if (!email || !password) {
                return res.status(400).json(new ApiModel('error', null, 'Email et mot de passe requis'));
            }

            // Vérifier si l'email est valide
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json(new ApiModel('error', null, 'Format d\'email invalide'));
            }

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
                return res.status(404).json(new ApiModel('error', null, 'Aucun compte trouvé avec cet email'));
            }

            const user = result.rows[0];

            if (user.status === 'blocked') {
                return res.status(403).json(new ApiModel('error', null, 'Votre compte est bloqué. Veuillez contacter un administrateur.'));
            }

            const configResult = await query(`SELECT valeur FROM configurations WHERE code = 'MAX_LOGIN_ATTEMPTS'`);
            const maxAttempts = parseInt(configResult.rows[0]?.valeur || '3');

            if (user.password !== password) {
                // Compter les tentatives échouées récentes (dernières 24h)
                const attemptsResult = await query(`
                    SELECT COUNT(*) as count FROM users_status us
                    JOIN statut_type st ON us.Id_statut_type = st.Id_statut_type
                    WHERE us.Id_users = $1 
                    AND st.code = 'blocked'
                    AND us.update_at > NOW() - INTERVAL '24 hours'
                `, [user.id_users]);

                const failedAttempts = parseInt(attemptsResult.rows[0]?.count || '0') + 1;

                if (failedAttempts >= maxAttempts) {
                    await query(`
                        INSERT INTO users_status (Id_users, Id_statut_type, reason)
                        VALUES ($1, (SELECT Id_statut_type FROM statut_type WHERE code = 'blocked'), 'Trop de tentatives de connexion échouées')
                    `, [user.id_users]);
                    return res.status(403).json(new ApiModel('error', null, `Compte bloqué après ${maxAttempts} tentatives échouées. Contactez un administrateur.`));
                }

                return res.status(401).json(new ApiModel('error', null, `Mot de passe incorrect. Il vous reste ${maxAttempts - failedAttempts} tentative(s).`));
            }

            // Connexion réussie - Génération du JWT token
            const token = jwt.sign(
                {
                    id: user.id_users,
                    email: user.email,
                    type_user: user.type_user_label
                },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            const response = new ApiModel('success', {
                id: user.id_users,
                email: user.email,
                username: user.username,
                type_user: user.type_user_label,
                token: token
            }, 'Connexion réussie ! Bienvenue ' + user.username);
            res.json(response);

        } catch (error) {
            console.error('Erreur login:', error);
            res.status(500).json(new ApiModel('error', null, 'Erreur serveur lors de la connexion'));
        }
    },

    async register(req, res) {
        const { username, email, password } = req.body;

        try {
            // Validation des entrées
            if (!username || !email || !password) {
                return res.status(400).json(new ApiModel('error', null, 'Tous les champs sont obligatoires'));
            }

            if (username.length < 3) {
                return res.status(400).json(new ApiModel('error', null, 'Le nom d\'utilisateur doit contenir au moins 3 caractères'));
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json(new ApiModel('error', null, 'Format d\'email invalide'));
            }

            if (password.length < 6) {
                return res.status(400).json(new ApiModel('error', null, 'Le mot de passe doit contenir au moins 6 caractères'));
            }

            // Vérifier si l'email existe déjà
            const existingEmail = await query('SELECT * FROM users WHERE email = $1', [email]);
            if (existingEmail.rows.length > 0) {
                return res.status(400).json(new ApiModel('error', null, 'Cet email est déjà utilisé'));
            }

            // Vérifier si le username existe déjà
            const existingUsername = await query('SELECT * FROM users WHERE username = $1', [username]);
            if (existingUsername.rows.length > 0) {
                return res.status(400).json(new ApiModel('error', null, 'Ce nom d\'utilisateur est déjà pris'));
            }

            const result = await query(`
                INSERT INTO users (username, email, password, Id_type_user)
                VALUES ($1, $2, $3, (SELECT Id_type_user FROM type_user WHERE label = 'utilisateur'))
                RETURNING Id_users
            `, [username.trim(), email.trim().toLowerCase(), password]);

            const userId = result.rows[0].id_users;

            await query(`
                INSERT INTO users_status (Id_users, Id_statut_type)
                VALUES ($1, (SELECT Id_statut_type FROM statut_type WHERE code = 'active'))
            `, [userId]);

            res.status(201).json(new ApiModel('success', { id: userId }, 'Inscription réussie ! Vous pouvez maintenant vous connecter.'));
        } catch (error) {
            console.error('Erreur register:', error);
            res.status(500).json(new ApiModel('error', null, 'Erreur serveur lors de l\'inscription'));
        }
    },

    async unblockUser(req, res) {
        const { userId } = req.body;

        try {
            // Validation de l'entrée
            if (!userId) {
                return res.status(400).json(new ApiModel('error', null, 'ID utilisateur requis'));
            }

            // Vérifier que l'utilisateur existe
            const userCheck = await query(
                'SELECT Id_users, username FROM users WHERE Id_users = $1',
                [userId]
            );

            if (userCheck.rows.length === 0) {
                return res.status(404).json(new ApiModel('error', null, 'Utilisateur non trouvé'));
            }

            // Vérifier que l'utilisateur est bien bloqué
            const statusCheck = await query(`
                SELECT st.code FROM users_status us
                JOIN statut_type st ON us.Id_statut_type = st.Id_statut_type
                WHERE us.Id_users = $1
                ORDER BY us.update_at DESC LIMIT 1
            `, [userId]);

            if (statusCheck.rows.length > 0 && statusCheck.rows[0].code !== 'blocked') {
                return res.status(400).json(new ApiModel('error', null, 'Cet utilisateur n\'est pas bloqué'));
            }

            await query(`
                INSERT INTO users_status (Id_users, Id_statut_type, reason)
                VALUES ($1, (SELECT Id_statut_type FROM statut_type WHERE code = 'active'), 'Débloqué par un manager')
            `, [userId]);

            const username = userCheck.rows[0].username;
            res.json(new ApiModel('success', { userId, username }, `L'utilisateur ${username} a été débloqué avec succès`));
        } catch (error) {
            console.error('Erreur unblockUser:', error);
            res.status(500).json(new ApiModel('error', null, 'Erreur lors du déblocage de l\'utilisateur'));
        }
    },

    async getBlockedUsers(req, res) {
        try {
            const result = await query(`
                SELECT DISTINCT ON (u.Id_users) 
                    u.Id_users, u.username, u.email, us.update_at as blocked_at, us.reason
                FROM users u
                JOIN users_status us ON u.Id_users = us.Id_users
                JOIN statut_type st ON us.Id_statut_type = st.Id_statut_type
                WHERE st.code = 'blocked'
                AND us.update_at = (
                    SELECT MAX(update_at) FROM users_status 
                    WHERE Id_users = u.Id_users
                )
                ORDER BY u.Id_users, us.update_at DESC
            `);
            res.json(new ApiModel('success', result.rows, null));
        } catch (error) {
            console.error('Erreur getBlockedUsers:', error);
            res.status(500).json(new ApiModel('error', null, 'Erreur lors de la récupération des utilisateurs bloqués'));
        }
    },

    // Modifier les informations d'un utilisateur
    async updateUserInfo(req, res) {
        const { username, email, password } = req.body;
        const userId = req.user.id; // ID de l'utilisateur connecté

        try {
            // Vérifier que l'utilisateur existe
            const userCheck = await query('SELECT Id_users FROM users WHERE Id_users = $1', [userId]);
            if (userCheck.rows.length === 0) {
                return res.status(404).json(new ApiModel('error', null, 'Utilisateur non trouvé'));
            }

            // Vérifier si l'email existe déjà pour un autre utilisateur
            if (email) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    return res.status(400).json(new ApiModel('error', null, 'Format d\'email invalide'));
                }

                const emailCheck = await query(
                    'SELECT Id_users FROM users WHERE email = $1 AND Id_users != $2',
                    [email.trim().toLowerCase(), userId]
                );
                if (emailCheck.rows.length > 0) {
                    return res.status(400).json(new ApiModel('error', null, 'Cet email est déjà utilisé par un autre compte'));
                }
            }

            // Vérifier si le username existe déjà pour un autre utilisateur
            if (username) {
                if (username.length < 3) {
                    return res.status(400).json(new ApiModel('error', null, 'Le nom d\'utilisateur doit contenir au moins 3 caractères'));
                }

                const usernameCheck = await query(
                    'SELECT Id_users FROM users WHERE username = $1 AND Id_users != $2',
                    [username.trim(), userId]
                );
                if (usernameCheck.rows.length > 0) {
                    return res.status(400).json(new ApiModel('error', null, 'Ce nom d\'utilisateur est déjà pris'));
                }
            }

            // Vérifier le mot de passe si fourni
            if (password && password.length < 6) {
                return res.status(400).json(new ApiModel('error', null, 'Le mot de passe doit contenir au moins 6 caractères'));
            }

            // Construire la requête de mise à jour dynamiquement
            const updates = [];
            const values = [];
            let paramIndex = 1;

            if (username) {
                updates.push(`username = $${paramIndex}`);
                values.push(username.trim());
                paramIndex++;
            }
            if (email) {
                updates.push(`email = $${paramIndex}`);
                values.push(email.trim().toLowerCase());
                paramIndex++;
            }
            if (password) {
                updates.push(`password = $${paramIndex}`);
                values.push(password);
                paramIndex++;
            }

            if (updates.length === 0) {
                return res.status(400).json(new ApiModel('error', null, 'Aucune information à modifier'));
            }

            // Ajouter la mise à jour de update_at
            updates.push(`update_at = NOW()`);

            values.push(userId);
            const updateQuery = `
                UPDATE users 
                SET ${updates.join(', ')}
                WHERE Id_users = $${paramIndex}
                RETURNING Id_users, username, email
            `;

            const result = await query(updateQuery, values);

            res.json(new ApiModel('success', result.rows[0], 'Vos informations ont été mises à jour avec succès'));
        } catch (error) {
            console.error('Erreur updateUserInfo:', error);
            res.status(500).json(new ApiModel('error', null, 'Erreur lors de la modification des informations'));
        }
    }
};

export default webAuthController;
