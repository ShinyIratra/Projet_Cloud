import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// Routes mobiles supprimées - la logique métier est maintenant dans l'APK mobile
// import authRoutes from './routes/authRoutes.js';
// import userRoutes from './routes/userRoutes.js';
// import roadAlertRoutes from './routes/roadAlertRoutes.js';
// import notificationRoutes from './routes/notificationRoutes.js';
import webRoutes from './routes/webRoutes.js';
import taskRoutes from './routes/taskRoutes.js';

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


// Routes Web uniquement (le mobile utilise Firebase directement)
// Les routes mobiles (/api/login, /api/register, /api/road_alerts, etc.) ont été supprimées
// car elles sont maintenant gérées localement dans l'application mobile
app.use('/api/web', webRoutes);

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Documentation disponible sur http://localhost:${PORT}/api-docs`);
});