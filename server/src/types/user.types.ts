import { Document } from 'mongoose';

/**
 * Régimes alimentaires supportés
 */
export enum DietType {
  NONE = 'none',
  VEGETARIAN = 'vegetarian',
  VEGAN = 'vegan',
  GLUTEN_FREE = 'gluten_free',
  KETO = 'keto',
  PALEO = 'paleo',
  MEDITERRANEAN = 'mediterranean'
}

/**
 * Interface pour les paramètres d'alimentation de l'utilisateur
 */
export interface DietarySettings {
  diet: DietType;
  allergies: string[];
  preferences: string[];
  calorieGoal?: number;
}

/**
 * Interface pour l'utilisateur (sans mot de passe)
 */
export interface IUser {
  name: string;
  email: string;
  bio?: string;
  profilePicture?: string;
  dietarySettings: DietarySettings;
  followers: string[];
  following: string[];
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface pour l'utilisateur avec mot de passe (pour l'authentification)
 */
export interface IUserAuth extends IUser {
  password: string;
}

/**
 * Interface pour l'utilisateur MongoDB Document
 */
export interface IUserDocument extends IUserAuth, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAuthToken(): string;
}

/**
 * Interface pour la création d'un utilisateur
 */
export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  bio?: string;
  dietarySettings?: Partial<DietarySettings>;
}

/**
 * Interface pour la mise à jour d'un utilisateur
 */
export interface UpdateUserData {
  name?: string;
  bio?: string;
  profilePicture?: string;
  dietarySettings?: Partial<DietarySettings>;
}