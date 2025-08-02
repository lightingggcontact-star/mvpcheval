import mongoose, { Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { IUserDocument, DietType } from '../types/user.types';

/**
 * Schéma pour les paramètres d'alimentation
 */
const DietarySettingsSchema = new Schema({
  diet: {
    type: String,
    enum: Object.values(DietType),
    default: DietType.NONE
  },
  allergies: [{
    type: String,
    trim: true
  }],
  preferences: [{
    type: String,
    trim: true
  }],
  calorieGoal: {
    type: Number,
    min: 800,
    max: 5000
  }
}, { _id: false });

/**
 * Schéma utilisateur principal
 */
const UserSchema = new Schema<IUserDocument>({
  name: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true,
    minlength: [2, 'Le nom doit contenir au moins 2 caractères'],
    maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères']
  },
  email: {
    type: String,
    required: [true, 'L\'email est requis'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Veuillez fournir un email valide'
    ]
  },
  password: {
    type: String,
    required: [true, 'Le mot de passe est requis'],
    minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères'],
    select: false // Par défaut, ne pas inclure le mot de passe dans les requêtes
  },
  bio: {
    type: String,
    maxlength: [500, 'La bio ne peut pas dépasser 500 caractères'],
    trim: true
  },
  profilePicture: {
    type: String,
    default: null
  },
  dietarySettings: {
    type: DietarySettingsSchema,
    default: () => ({
      diet: DietType.NONE,
      allergies: [],
      preferences: []
    })
  },
  followers: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  isEmailVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true, // Ajoute automatiquement createdAt et updatedAt
  toJSON: {
    transform: function(doc: any, ret: any) {
      // Supprimer le mot de passe et __v des réponses JSON
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  }
});

/**
 * Index pour optimiser les recherches
 */
UserSchema.index({ email: 1 });
UserSchema.index({ name: 1 });

/**
 * Middleware pre-save pour hacher le mot de passe
 */
UserSchema.pre('save', async function(next) {
  // Ne hacher que si le mot de passe a été modifié
  if (!this.isModified('password')) return next();

  try {
    // Hacher le mot de passe avec un salt de 12 rounds
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

/**
 * Méthode pour comparer le mot de passe
 */
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Méthode pour générer un token JWT
 */
UserSchema.methods.generateAuthToken = function(): string {
  const payload = {
    userId: this._id,
    email: this.email
  };
  
  const secret = process.env.JWT_SECRET || 'default_secret';
  const expiresIn = process.env.JWT_EXPIRE || '7d';
  
  return jwt.sign(payload, secret, { expiresIn } as any);
};

/**
 * Méthode statique pour trouver un utilisateur par email avec mot de passe
 */
UserSchema.statics.findByCredentials = async function(email: string, password: string) {
  const user = await this.findOne({ email }).select('+password');
  
  if (!user) {
    throw new Error('Identifiants invalides');
  }

  const isMatch = await user.comparePassword(password);
  
  if (!isMatch) {
    throw new Error('Identifiants invalides');
  }

  return user;
};

// Interface pour les méthodes statiques
interface IUserModel extends Model<IUserDocument> {
  findByCredentials(email: string, password: string): Promise<IUserDocument>;
}

/**
 * Modèle User
 */
const User = mongoose.model<IUserDocument, IUserModel>('User', UserSchema);

export default User;