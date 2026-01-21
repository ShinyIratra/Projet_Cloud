require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const authRoutes = require('./src/routes/authRoutes');

const app = express();

app.use(cors());
app.use(bodyParser.json());

// On branche nos routes sur /api
// Ex: http://localhost:3000/api/login
app.use('/api', authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur Firebase-Only démarré sur le port ${PORT}`);
});