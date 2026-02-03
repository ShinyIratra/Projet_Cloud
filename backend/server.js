import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import roadAlertRoutes from './routes/roadAlertRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import webRoutes from './routes/webRoutes.js';

import swaggerUi from 'swagger-ui-express';
import swaggerSpecs from './config/swagger.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware CORS
app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());

// L'interface accessible sur http://localhost:3000/api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));


// Note : Swagger utilise les chemins définis dans authRoutes.js (/api/login, etc.)
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', roadAlertRoutes);
app.use('/api', notificationRoutes);
app.use('/api/web', webRoutes);

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Documentation disponible sur http://localhost:${PORT}/api-docs`);
});