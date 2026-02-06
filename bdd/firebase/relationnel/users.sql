DROP DATABASE IF EXISTS roadalerts;
CREATE DATABASE roadalerts;
\c roadalerts;

-- Activer l'extension PostGIS pour les types géographiques
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE type_user(
   Id_type_user SERIAL,
   label VARCHAR(200)  NOT NULL,
   order_index INTEGER NOT NULL,
   PRIMARY KEY(Id_type_user),
   UNIQUE(label)
);

CREATE TABLE statut_type(
   Id_statut_type SERIAL,
   code VARCHAR(50)  NOT NULL,
   label VARCHAR(100)  NOT NULL,
   PRIMARY KEY(Id_statut_type),
   UNIQUE(code),
   UNIQUE(label)
);

CREATE TABLE users(
   Id_users SERIAL,
   username VARCHAR(100)  NOT NULL,
   email VARCHAR(200)  NOT NULL,
   password VARCHAR(255)  NOT NULL,
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   Id_type_user INTEGER NOT NULL,
   PRIMARY KEY(Id_users),
   UNIQUE(username),
   FOREIGN KEY(Id_type_user) REFERENCES type_user(Id_type_user)
);

CREATE TABLE users_status(
   Id_users_status SERIAL,
   update_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
   reason TEXT,
   Id_statut_type INTEGER NOT NULL,
   Id_users INTEGER NOT NULL,
   PRIMARY KEY(Id_users_status),
   FOREIGN KEY(Id_statut_type) REFERENCES statut_type(Id_statut_type),
   FOREIGN KEY(Id_users) REFERENCES users(Id_users)
);

CREATE TABLE configurations(
   Id_configurations SERIAL,
   code VARCHAR(255)  NOT NULL,
   description TEXT,
   valeur TEXT NOT NULL,
   PRIMARY KEY(Id_configurations),
   UNIQUE(code)
);

CREATE TABLE entreprise(
   Id_entreprise SERIAL,
   nom VARCHAR(200)  NOT NULL,
   PRIMARY KEY(Id_entreprise)
);

CREATE TABLE statut_signalement(
   Id_statut_signalement SERIAL,
   code VARCHAR(50)  NOT NULL,
   label VARCHAR(100)  NOT NULL,
   pourcentage INT NOT NULL DEFAULT 0 CHECK (pourcentage >= 0 AND pourcentage <= 100),
   PRIMARY KEY(Id_statut_signalement),
   UNIQUE(label)
);

CREATE TABLE signalements(
   Id_signalements SERIAL,
   titre VARCHAR(255),
   surface NUMERIC(15,2)  NOT NULL,
   budget NUMERIC(15,2)  NOT NULL,
   position GEOGRAPHY(POINT, 4326) NOT NULL,
   date_signalement TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
   Id_entreprise INTEGER,
   Id_users INTEGER NOT NULL,
   id_firebase VARCHAR(255) UNIQUE,
   PRIMARY KEY(Id_signalements),
   FOREIGN KEY(Id_entreprise) REFERENCES entreprise(Id_entreprise),
   FOREIGN KEY(Id_users) REFERENCES users(Id_users)
);

CREATE TABLE photos_signalements(
   Id_photos_signalements SERIAL,
   chemin TEXT NOT NULL,
   Id_signalements INTEGER,
   PRIMARY KEY(Id_photos_signalements),
   FOREIGN KEY(Id_signalements) REFERENCES signalements(Id_signalements)
);

CREATE TABLE Historique_StatutSignalements(
   Id_Historique_StatutSignalements SERIAL,
   update_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
   Id_signalements INTEGER NOT NULL,
   Id_statut_signalement INTEGER NOT NULL,
   PRIMARY KEY(Id_Historique_StatutSignalements),
   FOREIGN KEY(Id_signalements) REFERENCES signalements(Id_signalements),
   FOREIGN KEY(Id_statut_signalement) REFERENCES statut_signalement(Id_statut_signalement)
);


-- Fonctions helper pour extraire lat/lng depuis position
CREATE OR REPLACE FUNCTION get_latitude(pos GEOGRAPHY)
RETURNS DOUBLE PRECISION AS $$
BEGIN
  RETURN ST_Y(pos::geometry);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_longitude(pos GEOGRAPHY)
RETURNS DOUBLE PRECISION AS $$
BEGIN
  RETURN ST_X(pos::geometry);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Donnees initiales

INSERT INTO type_user (label, order_index) VALUES
('utilisateur', 1),
('manager', 2);

INSERT INTO statut_type (code, label) VALUES
('active', 'Actif'),
('blocked', 'Bloque');

INSERT INTO statut_signalement (code, label, pourcentage) VALUES
('nouveau', 'Nouveau', 0),
('en_cours', 'En cours', 50),
('termine', 'Termine', 100);

INSERT INTO configurations (code, description, valeur) VALUES
('MAX_LOGIN_ATTEMPTS', 'Nombre max de tentatives de connexion', '3'),
('SESSION_TIMEOUT', 'Duree de session en secondes', '3600');

INSERT INTO entreprise (nom) VALUES
('COLAS Madagascar'),
('SOGEA SATOM'),
('Entreprise XYZ'),
('ITU Madagascar');

-- Manager par defaut (password: manager123)
INSERT INTO users (username, email, password, Id_type_user) VALUES
('manager', 'manager@roadalert.com', 'manager123', 2);

INSERT INTO users_status (Id_statut_type, Id_users) VALUES
(1, 1);

-- ============================================
-- INDEX POUR LES PERFORMANCES
-- ============================================

CREATE INDEX idx_signalements_entreprise ON signalements(Id_entreprise);
CREATE INDEX idx_historique_statut ON Historique_StatutSignalements(Id_signalements, update_at DESC);
CREATE INDEX idx_historique_statut_signalement ON Historique_StatutSignalements(Id_statut_signalement);

-- ============================================
-- VUES POUR LES STATISTIQUES
-- ============================================

-- Vue pour obtenir les signalements avec leur pourcentage d'avancement
-- Le statut actuel = dernier statut dans Historique_StatutSignalements (update_at DESC)
CREATE OR REPLACE VIEW v_signalements_avancement AS
SELECT 
    s.Id_signalements,
    s.titre,
    s.surface,
    s.budget,
    get_latitude(s.position) AS latitude,
    get_longitude(s.position) AS longitude,
    s.date_signalement,
    ss.code AS statut_code,
    ss.label AS statut_label,
    ss.pourcentage AS avancement_pourcentage,
    hss.update_at AS date_dernier_statut,
    h_debut.date_debut,
    h_fin.date_fin,
    CASE 
        WHEN h_debut.date_debut IS NOT NULL AND h_fin.date_fin IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (h_fin.date_fin - h_debut.date_debut)) / 86400.0
        ELSE NULL 
    END AS duree_jours,
    CASE 
        WHEN h_debut.date_debut IS NOT NULL AND h_fin.date_fin IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (h_fin.date_fin - h_debut.date_debut)) / 3600.0
        ELSE NULL 
    END AS duree_heures,
    e.nom AS entreprise_nom,
    u.username AS signale_par
FROM signalements s
LEFT JOIN entreprise e ON s.Id_entreprise = e.Id_entreprise
LEFT JOIN users u ON s.Id_users = u.Id_users
-- Dernier statut = statut actuel
LEFT JOIN (
    SELECT DISTINCT ON (Id_signalements) 
        Id_signalements, Id_statut_signalement, update_at
    FROM Historique_StatutSignalements
    ORDER BY Id_signalements, update_at DESC
) hss ON s.Id_signalements = hss.Id_signalements
LEFT JOIN statut_signalement ss ON hss.Id_statut_signalement = ss.Id_statut_signalement
-- Date debut = premiere fois statut 'en_cours'
LEFT JOIN (
    SELECT h.Id_signalements, MIN(h.update_at) AS date_debut
    FROM Historique_StatutSignalements h
    JOIN statut_signalement st ON h.Id_statut_signalement = st.Id_statut_signalement
    WHERE st.code = 'en_cours'
    GROUP BY h.Id_signalements
) h_debut ON s.Id_signalements = h_debut.Id_signalements
-- Date fin = premiere fois statut 'termine'
LEFT JOIN (
    SELECT h.Id_signalements, MIN(h.update_at) AS date_fin
    FROM Historique_StatutSignalements h
    JOIN statut_signalement st ON h.Id_statut_signalement = st.Id_statut_signalement
    WHERE st.code = 'termine'
    GROUP BY h.Id_signalements
) h_fin ON s.Id_signalements = h_fin.Id_signalements;

-- Vue pour les statistiques globales de performance
CREATE OR REPLACE VIEW v_statistiques_signalements AS
SELECT 
    COUNT(*) AS total_signalements,
    COUNT(CASE WHEN ss.code = 'nouveau' THEN 1 END) AS signalements_nouveaux,
    COUNT(CASE WHEN ss.code = 'en_cours' THEN 1 END) AS signalements_en_cours,
    COUNT(CASE WHEN ss.code = 'termine' THEN 1 END) AS signalements_termines,
    ROUND(AVG(ss.pourcentage)::numeric, 2) AS avancement_moyen,
    ROUND(SUM(s.budget)::numeric, 2) AS budget_total,
    ROUND(SUM(s.surface)::numeric, 2) AS surface_totale,
    ROUND(AVG(
        CASE 
            WHEN h_debut.date_debut IS NOT NULL AND h_fin.date_fin IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (h_fin.date_fin - h_debut.date_debut)) / 86400.0
        END
    )::numeric, 2) AS delai_moyen_jours,
    ROUND(MIN(
        CASE 
            WHEN h_debut.date_debut IS NOT NULL AND h_fin.date_fin IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (h_fin.date_fin - h_debut.date_debut)) / 86400.0
        END
    )::numeric, 2) AS delai_min_jours,
    ROUND(MAX(
        CASE 
            WHEN h_debut.date_debut IS NOT NULL AND h_fin.date_fin IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (h_fin.date_fin - h_debut.date_debut)) / 86400.0
        END
    )::numeric, 2) AS delai_max_jours
FROM signalements s
LEFT JOIN (
    SELECT DISTINCT ON (Id_signalements) 
        Id_signalements, Id_statut_signalement
    FROM Historique_StatutSignalements
    ORDER BY Id_signalements, update_at DESC
) hss ON s.Id_signalements = hss.Id_signalements
LEFT JOIN statut_signalement ss ON hss.Id_statut_signalement = ss.Id_statut_signalement
LEFT JOIN (
    SELECT h.Id_signalements, MIN(h.update_at) AS date_debut
    FROM Historique_StatutSignalements h
    JOIN statut_signalement st ON h.Id_statut_signalement = st.Id_statut_signalement
    WHERE st.code = 'en_cours'
    GROUP BY h.Id_signalements
) h_debut ON s.Id_signalements = h_debut.Id_signalements
LEFT JOIN (
    SELECT h.Id_signalements, MIN(h.update_at) AS date_fin
    FROM Historique_StatutSignalements h
    JOIN statut_signalement st ON h.Id_statut_signalement = st.Id_statut_signalement
    WHERE st.code = 'termine'
    GROUP BY h.Id_signalements
) h_fin ON s.Id_signalements = h_fin.Id_signalements;

-- ============================================
-- FONCTIONS POUR LES STATISTIQUES
-- ============================================

-- Fonction pour obtenir les statistiques par période
CREATE OR REPLACE FUNCTION get_statistiques_periode(
    p_date_debut TIMESTAMP DEFAULT NULL,
    p_date_fin TIMESTAMP DEFAULT NULL
)
RETURNS TABLE (
    total_signalements BIGINT,
    signalements_nouveaux BIGINT,
    signalements_en_cours BIGINT,
    signalements_termines BIGINT,
    avancement_moyen NUMERIC,
    budget_total NUMERIC,
    surface_totale NUMERIC,
    delai_moyen_jours NUMERIC,
    delai_min_jours NUMERIC,
    delai_max_jours NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT AS total_signalements,
        COUNT(CASE WHEN ss.code = 'nouveau' THEN 1 END)::BIGINT AS signalements_nouveaux,
        COUNT(CASE WHEN ss.code = 'en_cours' THEN 1 END)::BIGINT AS signalements_en_cours,
        COUNT(CASE WHEN ss.code = 'termine' THEN 1 END)::BIGINT AS signalements_termines,
        ROUND(AVG(ss.pourcentage)::numeric, 2) AS avancement_moyen,
        ROUND(SUM(s.budget)::numeric, 2) AS budget_total,
        ROUND(SUM(s.surface)::numeric, 2) AS surface_totale,
        ROUND(AVG(
            CASE 
                WHEN h_debut.date_debut IS NOT NULL AND h_fin.date_fin IS NOT NULL 
                THEN EXTRACT(EPOCH FROM (h_fin.date_fin - h_debut.date_debut)) / 86400.0
            END
        )::numeric, 2) AS delai_moyen_jours,
        ROUND(MIN(
            CASE 
                WHEN h_debut.date_debut IS NOT NULL AND h_fin.date_fin IS NOT NULL 
                THEN EXTRACT(EPOCH FROM (h_fin.date_fin - h_debut.date_debut)) / 86400.0
            END
        )::numeric, 2) AS delai_min_jours,
        ROUND(MAX(
            CASE 
                WHEN h_debut.date_debut IS NOT NULL AND h_fin.date_fin IS NOT NULL 
                THEN EXTRACT(EPOCH FROM (h_fin.date_fin - h_debut.date_debut)) / 86400.0
            END
        )::numeric, 2) AS delai_max_jours
    FROM signalements s
    LEFT JOIN (
        SELECT DISTINCT ON (Id_signalements) 
            Id_signalements, Id_statut_signalement
        FROM Historique_StatutSignalements
        ORDER BY Id_signalements, update_at DESC
    ) hss ON s.Id_signalements = hss.Id_signalements
    LEFT JOIN statut_signalement ss ON hss.Id_statut_signalement = ss.Id_statut_signalement
    LEFT JOIN (
        SELECT h.Id_signalements, MIN(h.update_at) AS date_debut
        FROM Historique_StatutSignalements h
        JOIN statut_signalement st ON h.Id_statut_signalement = st.Id_statut_signalement
        WHERE st.code = 'en_cours'
        GROUP BY h.Id_signalements
    ) h_debut ON s.Id_signalements = h_debut.Id_signalements
    LEFT JOIN (
        SELECT h.Id_signalements, MIN(h.update_at) AS date_fin
        FROM Historique_StatutSignalements h
        JOIN statut_signalement st ON h.Id_statut_signalement = st.Id_statut_signalement
        WHERE st.code = 'termine'
        GROUP BY h.Id_signalements
    ) h_fin ON s.Id_signalements = h_fin.Id_signalements
    WHERE (p_date_debut IS NULL OR s.date_signalement >= p_date_debut)
      AND (p_date_fin IS NULL OR s.date_signalement <= p_date_fin);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les statistiques par entreprise
CREATE OR REPLACE FUNCTION get_statistiques_par_entreprise()
RETURNS TABLE (
    entreprise_id INT,
    entreprise_nom VARCHAR,
    total_signalements BIGINT,
    signalements_termines BIGINT,
    avancement_moyen NUMERIC,
    budget_total NUMERIC,
    delai_moyen_jours NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.Id_entreprise,
        e.nom,
        COUNT(s.Id_signalements)::BIGINT AS total_signalements,
        COUNT(CASE WHEN ss.code = 'termine' THEN 1 END)::BIGINT AS signalements_termines,
        ROUND(AVG(ss.pourcentage)::numeric, 2) AS avancement_moyen,
        ROUND(SUM(s.budget)::numeric, 2) AS budget_total,
        ROUND(AVG(
            CASE 
                WHEN h_debut.date_debut IS NOT NULL AND h_fin.date_fin IS NOT NULL 
                THEN EXTRACT(EPOCH FROM (h_fin.date_fin - h_debut.date_debut)) / 86400.0
            END
        )::numeric, 2) AS delai_moyen_jours
    FROM entreprise e
    LEFT JOIN signalements s ON e.Id_entreprise = s.Id_entreprise
    LEFT JOIN (
        SELECT DISTINCT ON (Id_signalements) 
            Id_signalements, Id_statut_signalement
        FROM Historique_StatutSignalements
        ORDER BY Id_signalements, update_at DESC
    ) hss ON s.Id_signalements = hss.Id_signalements
    LEFT JOIN statut_signalement ss ON hss.Id_statut_signalement = ss.Id_statut_signalement
    LEFT JOIN (
        SELECT h.Id_signalements, MIN(h.update_at) AS date_debut
        FROM Historique_StatutSignalements h
        JOIN statut_signalement st ON h.Id_statut_signalement = st.Id_statut_signalement
        WHERE st.code = 'en_cours'
        GROUP BY h.Id_signalements
    ) h_debut ON s.Id_signalements = h_debut.Id_signalements
    LEFT JOIN (
        SELECT h.Id_signalements, MIN(h.update_at) AS date_fin
        FROM Historique_StatutSignalements h
        JOIN statut_signalement st ON h.Id_statut_signalement = st.Id_statut_signalement
        WHERE st.code = 'termine'
        GROUP BY h.Id_signalements
    ) h_fin ON s.Id_signalements = h_fin.Id_signalements
    GROUP BY e.Id_entreprise, e.nom
    ORDER BY e.nom;
END;
$$ LANGUAGE plpgsql;
