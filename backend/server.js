// Main server file
import express from 'express';
import exampleRoutes from './routes/exampleRoutes.js';
import authRoutes from './routes/authRoutes.js';

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Routes
app.use('/api', exampleRoutes);
app.use('/api', authRoutes);

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});