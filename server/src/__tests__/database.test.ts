import { MongoMemoryServer } from 'mongodb-memory-server';
import Database from '../config/database';

describe('Database Connection', () => {
  let mongoServer: MongoMemoryServer;
  let database: Database;
  let originalConsole: typeof console;

  beforeAll(async () => {
    // Sauvegarder et désactiver les logs pour ce test
    originalConsole = { ...console };
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
    // Démarrer MongoDB en mémoire pour les tests
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Configurer l'URI pour les tests
    process.env.MONGODB_URI = mongoUri;
    
    database = Database.getInstance();
  });

  afterAll(async () => {
    // Fermer la connexion et MongoDB
    await database.disconnect();
    await mongoServer.stop();
    
    // Restaurer les logs
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
  });

  it('should connect to MongoDB successfully', async () => {
    await database.connect();
    expect(database.isConnected()).toBe(true);
  });

  it('should handle disconnection gracefully', async () => {
    await database.connect();
    expect(database.isConnected()).toBe(true);
    
    await database.disconnect();
    expect(database.isConnected()).toBe(false);
  });

  it('should be a singleton instance', () => {
    const instance1 = Database.getInstance();
    const instance2 = Database.getInstance();
    expect(instance1).toBe(instance2);
  });
});