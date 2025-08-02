import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Database from './config/database';

// Charger les variables d'environnement
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Endpoint de statut pour la Tâche 1
app.get('/api/status', (req, res) => {
  const database = Database.getInstance();
  res.json({ 
    status: 'running',
    message: 'Healthy Eats API is operational',
    database: {
      connected: database.isConnected(),
      name: database.isConnected() ? require('mongoose').connection.name : 'disconnected'
    },
    timestamp: new Date().toISOString()
  });
});

// Route de base
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Healthy Eats API',
    version: '1.0.0'
  });
});

// Démarrer le serveur seulement si ce fichier est exécuté directement
if (require.main === module) {
  // Fonction pour démarrer le serveur avec MongoDB
  const startServer = async () => {
    try {
      // Connexion à MongoDB
      const database = Database.getInstance();
      await database.connect();
      
      // Démarrer le serveur Express
      app.listen(PORT, () => {
        console.log(`🚀 Serveur démarré sur le port ${PORT}`);
        console.log(`📍 API disponible sur http://localhost:${PORT}`);
        console.log(`✅ Status endpoint: http://localhost:${PORT}/api/status`);
      });
      
    } catch (error) {
      console.error('❌ Erreur lors du démarrage du serveur:', error);
      process.exit(1);
    }
  };

  // Gestion gracieuse de l'arrêt
  process.on('SIGINT', async () => {
    console.log('\n🛑 Arrêt du serveur...');
    const database = Database.getInstance();
    await database.disconnect();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🛑 Arrêt du serveur...');
    const database = Database.getInstance();
    await database.disconnect();
    process.exit(0);
  });

  startServer();
}

export default app;