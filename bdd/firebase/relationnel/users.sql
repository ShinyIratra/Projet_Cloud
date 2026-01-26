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
   PRIMARY KEY(Id_statut_signalement),
   UNIQUE(label)
);

CREATE TABLE signalements(
   Id_signalements SERIAL,
   surface NUMERIC(15,2)   NOT NULL,
   budget NUMERIC(15,2)   NOT NULL,
   position GEOGRAPHY(POINT, 4326) NOT NULL,
   date_signalement TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   Id_statut_signalement INTEGER,
   Id_entreprise INTEGER,
   Id_users INTEGER NOT NULL,
   id_firebase VARCHAR(255) UNIQUE,
   PRIMARY KEY(Id_signalements),
   FOREIGN KEY(Id_statut_signalement) REFERENCES statut_signalement(Id_statut_signalement),
   FOREIGN KEY(Id_entreprise) REFERENCES entreprise(Id_entreprise),
   FOREIGN KEY(Id_users) REFERENCES users(Id_users)
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

INSERT INTO statut_signalement (code, label) VALUES
('nouveau', 'Nouveau'),
('en_cours', 'En cours'),
('termine', 'Termine');

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