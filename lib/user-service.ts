import { User } from 'firebase/auth';
import { firestoreUtils, COLLECTIONS } from './firestore';

export interface UserProfile {
  id: string;
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
  monthlyIncome?: number;
  isEarning?: boolean;
  preferences?: {
    currency?: string;
    timezone?: string;
    notifications?: boolean;
  };
}

export interface UserStats {
  totalBudgets: number;
  totalDebts: number;
  totalGoals: number;
  totalSavings: number;
  lastBudgetDate?: Date;
}

export const userService = {
  // Create a new user profile in Firestore
  async createUserProfile(user: User): Promise<void> {
    try {
      const userProfile: Omit<UserProfile, 'id'> = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || undefined,
        photoURL: user.photoURL || undefined,
        emailVerified: user.emailVerified,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
        preferences: {
          currency: 'GBP',
          timezone: 'Europe/London',
          notifications: true,
        }
      };

      // Create user profile document
      await firestoreUtils.create(COLLECTIONS.USERS, userProfile);

      // Initialize user stats document
      const userStats: Omit<UserStats, 'id'> = {
        totalBudgets: 0,
        totalDebts: 0,
        totalGoals: 0,
        totalSavings: 0,
      };

      await firestoreUtils.create('userStats', userStats);

      console.log('User profile and stats created successfully for:', user.uid);
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  },

  // Update user profile
  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const userDoc = await firestoreUtils.getWhere<UserProfile>(
        COLLECTIONS.USERS, 
        'uid', 
        '==', 
        uid
      );

      if (userDoc.length > 0) {
        await firestoreUtils.update(COLLECTIONS.USERS, userDoc[0].id, updates);
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  // Get user profile
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userDocs = await firestoreUtils.getWhere<UserProfile>(
        COLLECTIONS.USERS, 
        'uid', 
        '==', 
        uid
      );

      return userDocs.length > 0 ? userDocs[0] : null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  },

  // Update last login time
  async updateLastLogin(uid: string): Promise<void> {
    try {
      await this.updateUserProfile(uid, {
        lastLoginAt: new Date(),
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating last login:', error);
      // Don't throw error for last login update as it's not critical
    }
  },

  // Update user stats
  async updateUserStats(uid: string, stats: Partial<UserStats>): Promise<void> {
    try {
      const statsDocs = await firestoreUtils.getWhere<UserStats>(
        'userStats', 
        'uid', 
        '==', 
        uid
      );

      if (statsDocs.length > 0) {
        await firestoreUtils.update('userStats', statsDocs[0].id, stats);
      }
    } catch (error) {
      console.error('Error updating user stats:', error);
      throw error;
    }
  },

  // Get user stats
  async getUserStats(uid: string): Promise<UserStats | null> {
    try {
      const statsDocs = await firestoreUtils.getWhere<UserStats>(
        'userStats', 
        'uid', 
        '==', 
        uid
      );

      return statsDocs.length > 0 ? statsDocs[0] : null;
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  },

  // Initialize user data structure (called when user first signs up)
  async initializeUserData(user: User): Promise<void> {
    try {
      // Create user profile only - no sample data
      await this.createUserProfile(user);

      console.log('User profile created successfully for:', user.uid);
    } catch (error) {
      console.error('Error initializing user data:', error);
      throw error;
    }
  }
}; 