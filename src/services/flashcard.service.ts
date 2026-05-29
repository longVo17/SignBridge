import { db } from '../config/firebase';
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { FlashCardProgress } from '../types/data.types';

const getProgressRef = (uid: string, pathId: string) =>
  doc(db, 'flashcardProgress', uid, 'paths', pathId);

export const flashcardService = {
  getProgress: async (uid: string, pathId: string): Promise<FlashCardProgress | null> => {
    try {
      const ref = getProgressRef(uid, pathId);
      const snap = await getDoc(ref);
      if (snap.exists()) return snap.data() as FlashCardProgress;
      return null;
    } catch (error) {
      console.error(`Error fetching flashcard progress for ${pathId}:`, error);
      return null;
    }
  },

  saveProgress: async (
    uid: string,
    pathId: string,
    masteredSignIds: string[],
    unmasteredSignIds: string[],
    totalReviews: number,
  ): Promise<void> => {
    try {
      const ref = getProgressRef(uid, pathId);
      const total = masteredSignIds.length + unmasteredSignIds.length;
      const completionRate = total > 0 ? Math.round((masteredSignIds.length / total) * 100) : 0;

      const progress: FlashCardProgress = {
        pathId,
        masteredSignIds,
        unmasteredSignIds,
        lastReviewDate: new Date().toISOString(),
        totalReviews,
        completionRate,
      };
      await setDoc(ref, progress, { merge: true });
    } catch (error) {
      console.error(`Error saving flashcard progress for ${pathId}:`, error);
      throw error;
    }
  },

  resetProgress: async (uid: string, pathId: string): Promise<void> => {
    try {
      const ref = getProgressRef(uid, pathId);
      await deleteDoc(ref);
    } catch (error) {
      console.error(`Error resetting flashcard progress for ${pathId}:`, error);
      throw error;
    }
  },

  getAllProgress: async (uid: string): Promise<FlashCardProgress[]> => {
    try {
      const pathsColRef = collection(db, 'flashcardProgress', uid, 'paths');
      const snap = await getDocs(pathsColRef);
      const list: FlashCardProgress[] = [];
      snap.forEach((doc) => {
        list.push(doc.data() as FlashCardProgress);
      });
      return list;
    } catch (error) {
      console.error('Error fetching all flashcard progress:', error);
      return [];
    }
  },
};
