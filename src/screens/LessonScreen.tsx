import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  ActivityIndicator, ScrollView, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, TYPOGRAPHY } from '../theme/theme';
import { Lesson, Sign } from '../types/data.types';
import { learningService } from '../services/learning.service';
import { getSignById } from '../services/dictionary.service';
import { useProgress } from '../hooks/useProgress';
import FlashCard from '../components/lesson/FlashCard';
import QuizCard, { QuizQuestion } from '../components/lesson/QuizCard';
import LessonComplete from '../components/lesson/LessonComplete';

// ─── Types ────────────────────────────────────────────────────────────────────
type Phase = 'learn' | 'quiz' | 'complete';

// ─── Quiz helpers ─────────────────────────────────────────────────────────────
function buildQuizOptions(correct: Sign, allSigns: Sign[]): Sign[] {
  // Get wrong options from the same signs pool (different id)
  const pool = allSigns.filter(s => s.id !== correct.id);
  const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, 3);
  return [correct, ...shuffled].sort(() => Math.random() - 0.5);
}

function buildQuizQuestions(lessons: Lesson[], signsMap: Record<string, Sign>): QuizQuestion[] {
  const allSigns = Object.values(signsMap);
  return lessons
    .map(lesson => {
      const sign = signsMap[lesson.signId];
      if (!sign) return null;
      return {
        sign,
        options: buildQuizOptions(sign, allSigns.length >= 4 ? allSigns : lessons.map(l => signsMap[l.signId]).filter(Boolean) as Sign[]),
      };
    })
    .filter(Boolean) as QuizQuestion[];
}

// ─── Component ────────────────────────────────────────────────────────────────
export const LessonScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { pathId, pathTitle } = route.params || {};

  const { completeLesson, completePath, recordQuizScore, progress } = useProgress();

  // Data state
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [signsMap, setSignsMap] = useState<Record<string, Sign>>({});
  const [loading, setLoading] = useState(true);

  // Phase state machine
  const [phase, setPhase] = useState<Phase>('learn');
  const [learnIndex, setLearnIndex] = useState(0);

  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);

  // Exit warn dialog
  const handleExit = useCallback(() => {
    Alert.alert(
      "Thoát bài học?",
      "Tiến độ của bạn sẽ không được lưu.",
      [
        { text: "Hủy", style: "cancel" },
        { text: "Đồng ý", style: "destructive", onPress: () => navigation.goBack() }
      ]
    );
  }, [navigation]);

  // ── Fetch data ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!pathId) { setLoading(false); return; }

    (async () => {
      try {
        const fetchedLessons = await learningService.getLessonsForPath(pathId);
        // Study all lessons in the path (e.g. 13 letters for split ASL Alphabet, 3-7 for others)
        setLessons(fetchedLessons);

        const map: Record<string, Sign> = {};
        await Promise.all(
          fetchedLessons.map(async (lesson: Lesson) => {
            const sign = await getSignById(lesson.signId);
            if (sign) map[lesson.signId] = sign;
          })
        );
        setSignsMap(map);
      } catch (err) {
        console.error('LessonScreen load error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [pathId]);

  // ── Phase: Learn handlers ─────────────────────────────────────────────────
  const handleLearnNext = useCallback(() => {
    if (learnIndex < lessons.length - 1) {
      setLearnIndex(prev => prev + 1);
    } else {
      // Build quiz questions and transition
      const questions = buildQuizQuestions(lessons, signsMap);
      setQuizQuestions(questions);
      setQuizIndex(0);
      setCorrectCount(0);
      setPhase('quiz');
    }
  }, [learnIndex, lessons, signsMap]);

  // handleOpenVideo removed — FlashCard handles video inline

  // ── Phase: Quiz handlers ──────────────────────────────────────────────────
  const handleQuizAnswer = useCallback(async (isCorrect: boolean) => {
    const newCorrect = correctCount + (isCorrect ? 1 : 0);

    if (quizIndex < quizQuestions.length - 1) {
      setCorrectCount(newCorrect);
      setQuizIndex(prev => prev + 1);
    } else {
      // Quiz finished — save score and mark lessons complete
      const finalCorrect = newCorrect;
      const scorePercent = Math.round((finalCorrect / quizQuestions.length) * 100);

      setCorrectCount(finalCorrect);

      let earnedXP = 0;
      for (const lesson of lessons) {
        const alreadyDone = progress?.completedLessons?.includes(lesson.id);
        if (!alreadyDone) {
          await completeLesson(lesson.id, pathId, lesson.xpReward);
          earnedXP += lesson.xpReward;
        }
      }

      // Save quiz scores per-lesson (use pathId as key)
      await recordQuizScore(pathId, scorePercent);

      // Mark path complete if all lessons done
      const allDone = lessons.every(l => progress?.completedLessons?.includes(l.id) || true);
      if (allDone) await completePath(pathId);

      setXpEarned(earnedXP);
      setPhase('complete');
    }
  }, [correctCount, quizIndex, quizQuestions.length, lessons, pathId, progress, completeLesson, recordQuizScore, completePath]);

  // ── Phase: Complete handlers ───────────────────────────────────────────────
  const handleContinue = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleRetakeQuiz = useCallback(() => {
    const questions = buildQuizQuestions(lessons, signsMap);
    setQuizQuestions(questions);
    setQuizIndex(0);
    setCorrectCount(0);
    setPhase('quiz');
  }, [lessons, signsMap]);

  // ── Progress bar ───────────────────────────────────────────────────────────
  const getProgressPercent = () => {
    if (phase === 'learn') return ((learnIndex + 1) / lessons.length) * 50;
    if (phase === 'quiz')  return 50 + ((quizIndex + 1) / (quizQuestions.length || 1)) * 50;
    return 100;
  };

  // ── Render: Loading ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <LinearGradient colors={['#E8F8FF', '#F0FBFF', '#FAFEFF']} style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </LinearGradient>
    );
  }

  if (lessons.length === 0) {
    return (
      <LinearGradient colors={['#E8F8FF', '#F0FBFF', '#FAFEFF']} style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No lessons found.</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLink}>
            <Text style={styles.backLinkText}>← Go Back</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  const currentSign = signsMap[lessons[learnIndex]?.signId];

  return (
    <LinearGradient colors={['#E8F8FF', '#F0FBFF', '#FAFEFF']} style={styles.container}>
      <View style={styles.blobTL} />
      <View style={styles.blobBR} />

      <SafeAreaView style={{ flex: 1 }}>
        {/* ── Top Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleExit} style={styles.closeBtn}>
            <Ionicons name="close" size={26} color={COLORS.text} />
          </TouchableOpacity>

          {/* Progress bar: 0–50% = learn, 50–100% = quiz */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBg}>
              <LinearGradient
                colors={phase === 'complete' ? ['#22C55E', '#16A34A'] : ['#2DC7FF', '#00A3E0']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${getProgressPercent()}%` }]}
              />
            </View>
            {/* Phase label */}
            <Text style={styles.phaseLabel}>
              {phase === 'learn' ? `Learn ${learnIndex + 1}/${lessons.length}` :
               phase === 'quiz'  ? `Quiz ${quizIndex + 1}/${quizQuestions.length}` :
               'Complete!'}
            </Text>
          </View>
        </View>

        {/* ── Main Content ── */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {phase === 'learn' && currentSign && (
            <FlashCard
              sign={currentSign}
              lessonIndex={learnIndex}
              totalLessons={lessons.length}
              onNext={handleLearnNext}
            />
          )}

          {phase === 'quiz' && quizQuestions.length > 0 && (
            <QuizCard
              question={quizQuestions[quizIndex]}
              questionIndex={quizIndex}
              totalQuestions={quizQuestions.length}
              onAnswer={handleQuizAnswer}
            />
          )}

          {phase === 'complete' && (
            <LessonComplete
              pathTitle={pathTitle || 'Lesson'}
              totalLessons={lessons.length}
              xpEarned={xpEarned}
              correctAnswers={correctCount}
              totalQuestions={quizQuestions.length}
              streakDays={progress?.streakDays || 0}
              onContinue={handleContinue}
              onRetakeQuiz={handleRetakeQuiz}
            />
          )}
        </ScrollView>
      </SafeAreaView>

    </LinearGradient>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  blobTL: {
    position: 'absolute', top: -80, left: -60,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(45,199,255,0.1)',
  },
  blobBR: {
    position: 'absolute', bottom: -60, right: -60,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(45,199,255,0.07)',
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { ...TYPOGRAPHY.bodyMedium, color: COLORS.textSecondary },
  backLink: { marginTop: SPACING.md },
  backLinkText: { ...TYPOGRAPHY.labelLarge, color: COLORS.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    gap: SPACING.md,
  },
  closeBtn: { padding: 4 },
  progressContainer: { flex: 1 },
  progressBg: {
    height: 10,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: { height: '100%', borderRadius: 5 },
  phaseLabel: {
    ...TYPOGRAPHY.labelMedium,
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
});
