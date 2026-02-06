-- ============================================
-- TABLE TRAVAUX - Système de suivi d'avancement
-- ============================================

-- Table des statuts de travaux avec pourcentage d'avancement
CREATE TABLE statut_travaux (
    id_statut_travaux SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    label VARCHAR(100) NOT NULL,
    pourcentage INT NOT NULL CHECK (pourcentage >= 0 AND pourcentage <= 100)
);

-- Insertion des statuts par défaut avec leurs pourcentages
INSERT INTO statut_travaux (code, label, pourcentage) VALUES
    ('nouveau', 'Nouveau', 0),
    ('en_cours', 'En cours', 50),
    ('termine', 'Terminé', 100);

-- Table principale des travaux
CREATE TABLE travaux (
    id_travaux SERIAL PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    id_statut_travaux INT REFERENCES statut_travaux(id_statut_travaux) DEFAULT 1,
    date_debut TIMESTAMP,
    date_fin TIMESTAMP,
    date_prevue_fin TIMESTAMP,
    id_signalement INT, -- Référence optionnelle à un signalement
    id_entreprise INT REFERENCES entreprise(id_entreprise),
    id_users_responsable INT REFERENCES users(id_users),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour améliorer les performances des requêtes statistiques
CREATE INDEX idx_travaux_statut ON travaux(id_statut_travaux);
CREATE INDEX idx_travaux_dates ON travaux(date_debut, date_fin);
CREATE INDEX idx_travaux_entreprise ON travaux(id_entreprise);

-- ============================================
-- VUES ET FONCTIONS POUR LES STATISTIQUES
-- ============================================

-- Vue pour obtenir les travaux avec leur pourcentage d'avancement
CREATE OR REPLACE VIEW v_travaux_avancement AS
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
    CASE 
        WHEN t.date_debut IS NOT NULL AND t.date_fin IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (t.date_fin - t.date_debut)) / 86400.0
        ELSE NULL 
    END AS duree_jours,
    CASE 
        WHEN t.date_debut IS NOT NULL AND t.date_fin IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (t.date_fin - t.date_debut)) / 3600.0
        ELSE NULL 
    END AS duree_heures,
    e.nom AS entreprise_nom,
    u.username AS responsable_nom,
    t.created_at,
    t.updated_at
FROM travaux t
LEFT JOIN statut_travaux st ON t.id_statut_travaux = st.id_statut_travaux
LEFT JOIN entreprise e ON t.id_entreprise = e.id_entreprise
LEFT JOIN users u ON t.id_users_responsable = u.id_users;

-- Vue pour les statistiques globales de performance
CREATE OR REPLACE VIEW v_statistiques_travaux AS
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
    )::numeric, 2) AS delai_max_jours
FROM travaux t
LEFT JOIN statut_travaux st ON t.id_statut_travaux = st.id_statut_travaux;

-- Fonction pour obtenir les statistiques par période
CREATE OR REPLACE FUNCTION get_statistiques_periode(
    p_date_debut TIMESTAMP DEFAULT NULL,
    p_date_fin TIMESTAMP DEFAULT NULL
)
RETURNS TABLE (
    total_travaux BIGINT,
    travaux_nouveaux BIGINT,
    travaux_en_cours BIGINT,
    travaux_termines BIGINT,
    avancement_moyen NUMERIC,
    delai_moyen_jours NUMERIC,
    delai_min_jours NUMERIC,
    delai_max_jours NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT AS total_travaux,
        COUNT(CASE WHEN st.code = 'nouveau' THEN 1 END)::BIGINT AS travaux_nouveaux,
        COUNT(CASE WHEN st.code = 'en_cours' THEN 1 END)::BIGINT AS travaux_en_cours,
        COUNT(CASE WHEN st.code = 'termine' THEN 1 END)::BIGINT AS travaux_termines,
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
        )::numeric, 2) AS delai_max_jours
    FROM travaux t
    LEFT JOIN statut_travaux st ON t.id_statut_travaux = st.id_statut_travaux
    WHERE (p_date_debut IS NULL OR t.created_at >= p_date_debut)
      AND (p_date_fin IS NULL OR t.created_at <= p_date_fin);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les statistiques par entreprise
CREATE OR REPLACE FUNCTION get_statistiques_par_entreprise()
RETURNS TABLE (
    entreprise_id INT,
    entreprise_nom VARCHAR,
    total_travaux BIGINT,
    travaux_termines BIGINT,
    avancement_moyen NUMERIC,
    delai_moyen_jours NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id_entreprise,
        e.nom,
        COUNT(t.id_travaux)::BIGINT AS total_travaux,
        COUNT(CASE WHEN st.code = 'termine' THEN 1 END)::BIGINT AS travaux_termines,
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
    ORDER BY e.nom;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour automatiquement les dates lors des changements de statut
CREATE OR REPLACE FUNCTION update_travaux_dates()
RETURNS TRIGGER AS $$
DECLARE
    nouveau_statut_code VARCHAR(50);
BEGIN
    -- Récupérer le code du nouveau statut
    SELECT code INTO nouveau_statut_code 
    FROM statut_travaux 
    WHERE id_statut_travaux = NEW.id_statut_travaux;
    
    -- Mettre à jour updated_at
    NEW.updated_at = CURRENT_TIMESTAMP;
    
    -- Si le statut passe à "en_cours" et pas de date_debut, la définir
    IF nouveau_statut_code = 'en_cours' AND NEW.date_debut IS NULL THEN
        NEW.date_debut = CURRENT_TIMESTAMP;
    END IF;
    
    -- Si le statut passe à "termine" et pas de date_fin, la définir
    IF nouveau_statut_code = 'termine' AND NEW.date_fin IS NULL THEN
        NEW.date_fin = CURRENT_TIMESTAMP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_travaux_dates
    BEFORE UPDATE ON travaux
    FOR EACH ROW
    EXECUTE FUNCTION update_travaux_dates();

-- ============================================
-- DONNÉES DE TEST
-- ============================================

-- Insérer quelques travaux de test (à adapter selon vos données existantes)
-- Note: Ces inserts supposent que vous avez déjà des entreprises et des utilisateurs
/*
INSERT INTO travaux (titre, description, id_statut_travaux, date_debut, date_fin, id_entreprise, id_users_responsable)
VALUES 
    ('Réparation route nationale', 'Travaux de réparation sur la RN7', 3, '2026-01-15 08:00:00', '2026-01-20 17:00:00', 1, 1),
    ('Nid de poule avenue principale', 'Rebouchage de nids de poule', 2, '2026-01-25 09:00:00', NULL, 1, 1),
    ('Signalisation manquante', 'Installation de panneaux de signalisation', 1, NULL, NULL, 2, 2);
*/
