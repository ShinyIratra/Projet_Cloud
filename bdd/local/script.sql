\c postgres;
DROP DATABASE IF EXISTS roadAlerts;
CREATE DATABASE roadAlerts;
\c roadAlerts;

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE type_user
(
    id_type_user SERIAL PRIMARY KEY,
    label VARCHAR(255) UNIQUE NOT NULL,
    order_index INT NOT NULL
);

CREATE TABLE statut_type
(
    id_statut_type SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    label VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE users (
    id_users SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    failed_login_attempts INT DEFAULT 0,
    password VARCHAR(255) NOT NULL,
    id_type_user INT REFERENCES type_user(id_type_user) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users_status
(
    id_users_status SERIAL PRIMARY KEY,
    id_users INT REFERENCES users(id_users) NOT NULL,
    id_statut_type INT REFERENCES statut_type(id_statut_type) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    reason TEXT
);

CREATE TABLE entreprise
(
    id_entreprise SERIAL PRIMARY KEY,
    nom VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE signalements
(
    id_signalements SERIAL PRIMARY KEY,
    surface VARCHAR(255) NOT NULL,
    budget INT NOT NULL,
    location GEOMETRY(Point, 4326) NOT NULL,
    date_signalement TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    id_statut_signalement INT REFERENCES statut_signalement(id_statut_signalement) NOT NULL,
    id_entreprise INT REFERENCES entreprise(id_entreprise) NOT NULL,
    id_users INT REFERENCES users(id_users) NOT NULL
);

CREATE TABLE statut_signalement
(
    id_statut_signalement SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    label VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE configurations 
(
    id_configurations SERIAL PRIMARY KEY,
    code VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    valeur TEXT NOT NULL
);