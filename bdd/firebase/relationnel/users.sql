\c postgres;
DROP DATABASE IF EXISTS roadAlerts;
CREATE DATABASE roadAlerts;
\c roadAlerts;

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
    password VARCHAR(255) NOT NULL,
    id_type_user INT REFERENCES type_user(id_type_user) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users_status
(
    id_users_status SERIAL PRIMARY KEY,
    id_users INT NOT NULL,
    id_statut_type INT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    reason TEXT,
    id_users REFERENCES users(id_users),
    id_statut_type REFERENCES statut_type(id_statut_type)
);

CREATE TABLE Configurations 
(
    id_configurations SERIAL PRIMARY KEY,
    code VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    value TEXT NOT NULL
);