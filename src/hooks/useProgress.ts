import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useProgressStore } from '../store/progressStore';
import { learningService } from '../services/learning.service';
import { notificationService } from '../services/notification.service';

export const useProgress = () => {
  const { user } = useAuthStore();
  const {
    progress, status,
    setProgress, setStatus,
    addCompletedLesson, addCompletedPath,
    updateStreak, saveQuizScore,
  } = useProgressStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setProgress(null);
      setStatus('idle');
      return;
    }

    const loadProgress = async () => {
      setLoading(true);
      setStatus('loading');
      try {
        let p = await learningService.getUserProgress(user.uid);
        if (!p) {
          p = await learningService.initUserProgress(user.uid);
        }

        // Simple streak check logic
        const today = new Date().toISOString().split('T')[0];
        const lastPractice = new Date(p.lastPracticeDate).toISOString().split('T')[0];

        if (lastPractice !== today) {
          const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
          if (lastPractice !== yesterday && p.streakDays > 0) {
            await learningService.updateStreak(user.uid, 0, p.lastPracticeDate);
            p.streakDays = 0;
          }
        }

        setProgress(p);
        setStatus('success');

        // Dynamically schedule/update daily streak reminder based on user's progress
        notificationService.scheduleStreakReminder(p.lastPracticeDate).catch(err => {
          console.warn("Failed to schedule streak reminder on progress load:", err);
        });
      } catch (err) {
        console.error('Failed to load user progress:', err);
        setStatus('error');
      } finally {
        setLoading(false);
      }
    };

    if (status === 'idle') {
      loadProgress();
    }
  }, [user, status]);

  const completeLesson = async (lessonId: string, pathId: string, xpReward: number) => {
    if (!user) return;
    try {
      await learningService.markLessonComplete(user.uid, lessonId, xpReward);
      addCompletedLesson(lessonId, xpReward);

      // Check and update streak
      const today = new Date().toISOString().split('T')[0];
      const p = useProgressStore.getState().progress;
      if (p) {
        const lastPractice = new Date(p.lastPracticeDate).toISOString().split('T')[0];
        const nowIso = new Date().toISOString();
        if (lastPractice !== today) {
          const newStreak = p.streakDays + 1;
          await learningService.updateStreak(user.uid, newStreak, nowIso);
          updateStreak(newStreak, nowIso);
        }

        // Reschedule streak reminder with updated activity timestamp
        notificationService.scheduleStreakReminder(nowIso).catch(err => {
          console.warn("Failed to schedule streak reminder after lesson complete:", err);
        });
      }
    } catch (err) {
      console.error('Failed to complete lesson:', err);
    }
  };

  const completePath = async (pathId: string) => {
    if (!user) return;
    try {
      await learningService.markPathComplete(user.uid, pathId);
      addCompletedPath(pathId);
    } catch (err) {
      console.error('Failed to complete path:', err);
    }
  };

  const recordQuizScore = async (lessonId: string, score: number) => {
    if (!user) return;
    try {
      await learningService.saveQuizScore(user.uid, lessonId, score);
      saveQuizScore(lessonId, score);
    } catch (err) {
      console.error('Failed to save quiz score:', err);
    }
  };

  return { progress, status, loading, completeLesson, completePath, recordQuizScore };
};
