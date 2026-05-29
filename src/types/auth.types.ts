// User profile stored in Firestore
export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  createdAt: number;
  totalXP: number;
  streakDays: number;
  lastActiveDate: string; // ISO date string "YYYY-MM-DD"
  phoneNumber?: string;
}

// Auth state shape used in Zustand store
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber?: string;
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';
