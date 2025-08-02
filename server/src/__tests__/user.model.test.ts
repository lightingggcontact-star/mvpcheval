import { MongoMemoryServer } from 'mongodb-memory-server';
import Database from '../config/database';
import User from '../models/User';
import { DietType } from '../types/user.types';

describe('User Model', () => {
  let mongoServer: MongoMemoryServer;
  let database: Database;

  beforeAll(async () => {
    // Démarrer MongoDB en mémoire pour les tests
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Configurer l'URI pour les tests
    process.env.MONGODB_URI = mongoUri;
    
    database = Database.getInstance();
    await database.connect();
  });

  afterAll(async () => {
    // Nettoyer et fermer la connexion
    await User.deleteMany({});
    await database.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    // Nettoyer entre chaque test
    await User.deleteMany({});
  });

  describe('User Creation', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.name).toBe(userData.name);
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.password).not.toBe(userData.password); // Password should be hashed
      expect(savedUser.isEmailVerified).toBe(false);
      expect(savedUser.dietarySettings.diet).toBe(DietType.NONE);
      expect(savedUser.createdAt).toBeDefined();
      expect(savedUser.updatedAt).toBeDefined();
    });

    it('should hash password before saving', async () => {
      const userData = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123'
      };

      const user = new User(userData);
      await user.save();

      expect(user.password).not.toBe(userData.password);
      expect(user.password.length).toBeGreaterThan(50); // Hashed password is longer
    });

    it('should create user with dietary settings', async () => {
      const userData = {
        name: 'Vegan User',
        email: 'vegan@example.com',
        password: 'password123',
        dietarySettings: {
          diet: DietType.VEGAN,
          allergies: ['nuts', 'dairy'],
          preferences: ['organic'],
          calorieGoal: 2000
        }
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.dietarySettings.diet).toBe(DietType.VEGAN);
      expect(savedUser.dietarySettings.allergies).toEqual(['nuts', 'dairy']);
      expect(savedUser.dietarySettings.preferences).toEqual(['organic']);
      expect(savedUser.dietarySettings.calorieGoal).toBe(2000);
    });
  });

  describe('User Validation', () => {
    it('should require name', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow('Le nom est requis');
    });

    it('should require email', async () => {
      const userData = {
        name: 'Test User',
        password: 'password123'
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow('L\'email est requis');
    });

    it('should require password', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com'
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow('Le mot de passe est requis');
    });

    it('should validate email format', async () => {
      const userData = {
        name: 'Test User',
        email: 'invalid-email',
        password: 'password123'
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow('Veuillez fournir un email valide');
    });

    it('should enforce unique email', async () => {
      const userData = {
        name: 'First User',
        email: 'duplicate@example.com',
        password: 'password123'
      };

      const userData2 = {
        name: 'Second User',
        email: 'duplicate@example.com',
        password: 'password456'
      };

      const user1 = new User(userData);
      await user1.save();

      const user2 = new User(userData2);
      
      await expect(user2.save()).rejects.toThrow();
    });

    it('should enforce minimum password length', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: '123' // Too short
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow('Le mot de passe doit contenir au moins 6 caractères');
    });
  });

  describe('User Methods', () => {
    let testUser: any;

    beforeEach(async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };
      
      testUser = new User(userData);
      await testUser.save();
    });

    it('should compare password correctly', async () => {
      const isMatch = await testUser.comparePassword('password123');
      expect(isMatch).toBe(true);

      const isWrongMatch = await testUser.comparePassword('wrongpassword');
      expect(isWrongMatch).toBe(false);
    });

    it('should generate auth token', () => {
      const token = testUser.generateAuthToken();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(50);
    });

    it('should find user by credentials', async () => {
      const foundUser = await User.findByCredentials('test@example.com', 'password123');
      expect(foundUser.email).toBe('test@example.com');
      expect(foundUser.name).toBe('Test User');
    });

    it('should throw error for invalid credentials', async () => {
      await expect(
        User.findByCredentials('test@example.com', 'wrongpassword')
      ).rejects.toThrow('Identifiants invalides');

      await expect(
        User.findByCredentials('wrong@example.com', 'password123')
      ).rejects.toThrow('Identifiants invalides');
    });
  });

  describe('JSON Transformation', () => {
    it('should not include password in JSON output', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };

      const user = new User(userData);
      await user.save();

      const userJSON = user.toJSON();
      expect(userJSON.password).toBeUndefined();
      expect(userJSON.__v).toBeUndefined();
      expect(userJSON.name).toBe('Test User');
      expect(userJSON.email).toBe('test@example.com');
    });
  });
});