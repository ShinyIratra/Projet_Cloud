import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
    host: process.env.PG_HOST || 'localhost',
    port: parseInt(process.env.PG_PORT || '5433'),
    database: process.env.PG_DATABASE || 'roadalerts',
    user: process.env.PG_USER || 'postgres',
    password: process.env.PG_PASSWORD || 'postgres'
});

pool.on('error', (err) => {
    console.error('Erreur PostgreSQL:', err);
});

const query = async (text, params) => {
    const result = await pool.query(text, params);
    return result;
};

const isConnected = async () => {
    try {
        await pool.query('SELECT 1');
        return true;
    } catch (error) {
        return false;
    }
};

export { pool, query, isConnected };
