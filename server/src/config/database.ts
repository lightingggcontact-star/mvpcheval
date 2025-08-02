import mongoose from 'mongoose';

/**
 * Configuration et connexion à MongoDB
 */
class Database {
  private static instance: Database;
  
  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  /**
   * Établir la connexion à MongoDB
   */
  public async connect(): Promise<void> {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthy_eats';
      
      await mongoose.connect(mongoUri);
      
      console.log('✅ Connexion à MongoDB établie avec succès');
      console.log(`📍 Base de données: ${mongoose.connection.name}`);
      
      // Gestionnaires d'événements pour la connexion
      mongoose.connection.on('error', (error) => {
        console.error('❌ Erreur de connexion MongoDB:', error);
      });
      
      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️  MongoDB déconnecté');
      });
      
      mongoose.connection.on('reconnected', () => {
        console.log('🔄 MongoDB reconnecté');
      });
      
    } catch (error) {
      console.error('❌ Erreur lors de la connexion à MongoDB:', error);
      process.exit(1);
    }
  }

  /**
   * Fermer la connexion à MongoDB
   */
  public async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      console.log('🔌 Connexion MongoDB fermée');
    } catch (error) {
      console.error('❌ Erreur lors de la fermeture de la connexion:', error);
    }
  }

  /**
   * Vérifier l'état de la connexion
   */
  public isConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }
}

export default Database;