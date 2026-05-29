import { create } from 'zustand';
import { UserProgress } from '../types/data.types';

interface ProgressStore {
  progress: UserProgress | null;
  status: 'idle' | 'loading' | 'success' | 'error';
  setProgress: (progress: UserProgress | null) => void;
  setStatus: (status: 'idle' | 'loading' | 'success' | 'error') => void;
  addCompletedLesson: (lessonId: string, xpReward: number) => void;
  addCompletedPath: (pathId: string) => void;
  updateStreak: (streakDays: number, lastPracticeDate: string) => void;
  saveQuizScore: (lessonId: string, score: number) => void;
}

export const useProgressStore = create<ProgressStore>((set) => ({
  progress: null,
  status: 'idle',

  setProgress: (progress) => set({ progress }),
  setStatus: (status) => set({ status }),

  addCompletedLesson: (lessonId, xpReward) =>
    set((state) => {
      if (!state.progress) return state;
      if (state.progress.completedLessons.includes(lessonId)) return state;

      return {
        progress: {
          ...state.progress,
          completedLessons: [...state.progress.completedLessons, lessonId],
          totalXP: state.progress.totalXP + xpReward,
          lessonXP: {
            ...(state.progress.lessonXP || {}),
            [lessonId]: xpReward,
          },
        }
      };
    }),

  addCompletedPath: (pathId) =>
    set((state) => {
      if (!state.progress) return state;
      if (state.progress.completedPaths.includes(pathId)) return state;

      return {
        progress: {
          ...state.progress,
          completedPaths: [...state.progress.completedPaths, pathId],
        }
      };
    }),

  updateStreak: (streakDays, lastPracticeDate) =>
    set((state) => {
      if (!state.progress) return state;
      return {
        progress: {
          ...state.progress,
          streakDays,
          lastPracticeDate,
        }
      };
    }),

  saveQuizScore: (lessonId, score) =>
    set((state) => {
      if (!state.progress) return state;
      return {
        progress: {
          ...state.progress,
          quizScores: {
            ...(state.progress.quizScores || {}),
            [lessonId]: score,
          },
        }
      };
    }),
}));
