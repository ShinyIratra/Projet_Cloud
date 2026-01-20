import express from 'express';
import exampleRoutes from './routes/exampleRoutes.js';
import authRoutes from './routes/authRoutes.js';

import swaggerUi from 'swagger-ui-express';
import swaggerSpecs from './config/swagger.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// L'interface accessible sur http://localhost:3000/api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));


// Note : Swagger utilise les chemins définis dans authRoutes.js (/api/login, etc.)
app.use('/api', exampleRoutes);
app.use('/api', authRoutes);

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Documentation disponible sur http://localhost:${PORT}/api-docs`);
});