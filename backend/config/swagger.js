import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'RoadAlerts API - Complete Documentation',
      version: '1.0.0',
      description: 'API complète de gestion des signalements routiers - Auth Firebase, Auth Web, Signalements, et Synchronisation (Projet Cloud S5)',
      contact: {
        name: 'Équipe Promotion 17',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Serveur Local',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  // C'est ici qu'on dit à Swagger où chercher les commentaires de documentation
  apis: ['./routes/*.js'], 
};

const specs = swaggerJsdoc(options);

export default specs;