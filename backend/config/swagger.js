import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'RoadAlerts API - Auth Module',
      version: '1.0.0',
      description: 'API de gestion des utilisateurs utilisant Firebase Auth (Projet Cloud S5)',
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