import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useNavigation } from '@react-navigation/native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../theme/theme';
import { LearningPath } from '../types/data.types';
import { learningService } from '../services/learning.service';
import { useProgress } from '../hooks/useProgress';

const getPathIcon = (pathId: string): keyof typeof Ionicons.glyphMap => {
  const id = pathId.toLowerCase();
  if (id.includes('alphabet') || id.includes('chu_cai')) return 'text';
  if (id.includes('number') || id.includes('so')) return 'grid-outline';
  if (id.includes('color') || id.includes('mau')) return 'color-palette-outline';
  if (id.includes('basic') || id.includes('co_ban')) return 'sparkles-outline';
  if (id.includes('greeting') || id.includes('chao')) return 'people-outline';
  return 'book-outline'; // default
};

export const LearningPathScreen = () => {
  const navigation = useNavigation<any>();
  const { progress, loading: progressLoading } = useProgress();
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaths = async () => {
      try {
        const fetchedPaths = await learningService.getLearningPaths();
        setPaths(fetchedPaths);
      } catch (err) {
        console.error("Failed to load learning paths", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPaths();
  }, []);

  if (loading || progressLoading) {
     return (
       <LinearGradient colors={['#E8F8FF', '#F0FBFF', '#FAFEFF']} style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}>
          <ActivityIndicator size="large" color={COLORS.primary} />
       </LinearGradient>
     )
  }

  const completedPathsCount = progress?.completedPaths?.length || 0;
  const totalPaths = paths.length;
  const overallPct = totalPaths > 0 ? Math.round((completedPathsCount / totalPaths) * 100) : 0;

  // English translation mapping helper for hardcoded path titles/descriptions if they come from firestore in Vietnamese
  const translateTitle = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('part 1') || t.includes('phần 1') || t.includes('alphabet_1')) return 'ASL Alphabet - Part 1';
    if (t.includes('part 2') || t.includes('phần 2') || t.includes('alphabet_2')) return 'ASL Alphabet - Part 2';
    if (t.includes('bảng chữ cái') || t.includes('alphabet')) return 'ASL Alphabet';
    if (t.includes('chào hỏi') || t.includes('greeting')) return 'Greetings & Meetings';
    if (t.includes('giao tiếp') || t.includes('essential')) return 'Essential Communication';
    if (t.includes('màu sắc') || t.includes('color')) return 'ASL Colors';
    if (t.includes('chữ số') || t.includes('number')) return 'ASL Numbers';
    return title;
  };

  const translateDesc = (desc: string) => {
    const d = desc.toLowerCase();
    if (d.includes('a to m') || d.includes('a-m') || d.includes('part 1') || d.includes('phần 1')) return 'Learn ASL finger-spelling letters A to M';
    if (d.includes('n to z') || d.includes('n-z') || d.includes('part 2') || d.includes('phần 2')) return 'Learn ASL finger-spelling letters N to Z';
    if (d.includes('chữ cái') || d.includes('letters')) return 'Learn ASL finger-spelling letters A-Z';
    if (d.includes('xã giao') || d.includes('greetings')) return 'Master essential basic everyday greeting signs';
    if (d.includes('thiết yếu') || d.includes('essential')) return 'Learn daily essential conversational signs';
    if (d.includes('màu') || d.includes('colors')) return 'Learn color names in American Sign Language';
    if (d.includes('số') || d.includes('numbers')) return 'Master numbers and simple counting signs';
    return desc;
  };

  return (
    <LinearGradient colors={['#E8F8FF', '#F0FBFF', '#FAFEFF']} style={styles.container}>
      <View style={styles.blobTL} />
      <View style={styles.blobBR} />

      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <Animatable.View animation="fadeInDown" delay={50} style={styles.header}>
          <View>
            <Text style={styles.title}>Learning Path</Text>
            <Text style={styles.subtitle}>{completedPathsCount} of {totalPaths} units completed</Text>
          </View>
          {/* XP Badge */}
          <BlurView intensity={80} tint="light" style={styles.xpBadge}>
            <Ionicons name="star" size={16} color="#2DC7FF" style={{ marginRight: 6 }} />
            <Text style={styles.xpText}>{progress?.totalXP || 0} XP</Text>
          </BlurView>
        </Animatable.View>

        {/* Overall Progress */}
        <Animatable.View animation="fadeInUp" delay={100} style={styles.overallProgressWrapper}>
          <BlurView intensity={85} tint="light" style={styles.overallProgressCard}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Overall Completion</Text>
              <Text style={styles.progressPct}>{overallPct}%</Text>
            </View>
            <View style={styles.overallBarBg}>
              <LinearGradient
                colors={['#2DC7FF', '#00A3E0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.overallBarFill, { width: `${overallPct}%` }]}
              />
            </View>
          </BlurView>
        </Animatable.View>

        {/* Level List */}
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {paths.map((path, index) => {
            const isCompleted = progress?.completedPaths?.includes(path.id);
            let isLocked = false;
            if (index > 0) {
              const prevPath = paths[index - 1];
              isLocked = !progress?.completedPaths?.includes(prevPath.id);
            }

            // Count completed lessons for this path
            const completedInPath = (progress?.completedLessons || []).filter(
              lid => lid.startsWith(path.id + '_')
            ).length;
            const lessonPct = path.lessonCount > 0
              ? Math.round((completedInPath / path.lessonCount) * 100)
              : 0;

            const quizScore = progress?.quizScores?.[path.id];

            return (
            <Animatable.View
              key={path.id}
              animation="fadeInUp"
              delay={200 + index * 100}
              style={styles.levelWrapper}
            >
              {/* Connector line */}
              {index < paths.length - 1 && (
                <View style={[styles.connector, { backgroundColor: isLocked ? COLORS.surfaceDim : COLORS.primary, opacity: isLocked ? 0.3 : 0.25 }]} />
              )}

              <View style={styles.levelCardTouch}>
                <BlurView
                  intensity={isLocked ? 60 : 85}
                  tint="light"
                  style={[styles.levelCard, isLocked && styles.levelCardLocked]}
                >
                  {/* Row 1: Header Info of Card */}
                  <View style={styles.cardHeaderRow}>
                    {/* Left Icon */}
                    <View style={[styles.levelIconCircle, isLocked && styles.levelIconLocked]}>
                      {isLocked ? (
                        <Ionicons name="lock-closed" size={22} color={COLORS.textSecondary} />
                      ) : (
                        <Ionicons name={getPathIcon(path.id)} size={22} color="#2DC7FF" />
                      )}
                    </View>

                    {/* Title and Description */}
                    <View style={styles.cardInfo}>
                      <View style={styles.levelTop}>
                        <Text numberOfLines={1} style={[styles.levelTitle, isLocked && styles.textLocked]}>
                          {translateTitle(path.title)}
                        </Text>
                        {isCompleted && (
                          <View style={styles.completedBadge}>
                            <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                          </View>
                        )}
                        {isLocked && (
                          <View style={styles.lockedBadge}>
                            <Text style={styles.lockedBadgeText}>Locked</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.levelDesc} numberOfLines={2}>
                        {translateDesc(path.description)}
                      </Text>
                    </View>

                    {/* XP Badge on the Right */}
                    {!isLocked && (
                      <View style={styles.xpMini}>
                        <Text style={styles.xpMiniText}>+{path.totalXP}</Text>
                        <Text style={styles.xpMiniLabel}>XP</Text>
                      </View>
                    )}
                  </View>

                  {/* Row 2: Progress Section (Full width below header) */}
                  {!isLocked && (
                    <View style={styles.progressSectionFull}>
                      <View style={styles.progressBarBg}>
                        <LinearGradient
                          colors={['#2DC7FF', '#00A3E0']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={[styles.progressBarFill, { width: `${lessonPct}%` }]}
                        />
                      </View>
                      <Text style={styles.progressPctSmall}>
                        {completedInPath}/{path.lessonCount}
                      </Text>
                    </View>
                  )}

                  {/* Quiz Score Badge */}
                  {quizScore !== undefined && !isLocked && (
                    <View style={[styles.quizBadge, quizScore >= 70 ? styles.quizPass : styles.quizFail]}>
                      <Text style={styles.quizBadgeText}>
                        Quiz Score: {quizScore}%
                      </Text>
                    </View>
                  )}

                  {/* Row 3: Actions side-by-side with generous gap and padding */}
                  {!isLocked && (
                    <View style={styles.actionRowFull}>
                      <TouchableOpacity
                        style={styles.learnBtn}
                        onPress={() => navigation.navigate('Lesson', { pathId: path.id, pathTitle: translateTitle(path.title) })}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="play-circle" size={16} color="#FFF" style={{ marginRight: 4 }} />
                        <Text numberOfLines={1} style={styles.learnBtnText}>Start Lesson</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.flashBtn}
                        onPress={() => navigation.navigate('FlashCardReview', { pathId: path.id, pathTitle: translateTitle(path.title) })}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="layers-outline" size={16} color={COLORS.primary} style={{ marginRight: 4 }} />
                        <Text numberOfLines={1} style={styles.flashBtnText}>Flashcards</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </BlurView>
              </View>
            </Animatable.View>
          )})}
        </ScrollView>

      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  blobTL: {
    position: 'absolute',
    top: -100,
    left: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(45,199,255,0.12)',
  },
  blobBR: {
    position: 'absolute',
    bottom: -60,
    right: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(45,199,255,0.08)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  title: {
    ...TYPOGRAPHY.headlineLarge,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  subtitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.pill,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  xpText: {
    ...TYPOGRAPHY.labelLarge,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  overallProgressWrapper: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  overallProgressCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.75)',
    ...SHADOWS.soft,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  progressLabel: {
    ...TYPOGRAPHY.labelLarge,
    color: COLORS.textSecondary,
  },
  progressPct: {
    ...TYPOGRAPHY.labelLarge,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  overallBarBg: {
    height: 8,
    backgroundColor: 'rgba(45,199,255,0.15)',
    borderRadius: BORDER_RADIUS.pill,
    overflow: 'hidden',
  },
  overallBarFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.pill,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl,
    alignItems: 'center',
  },
  levelWrapper: {
    width: '100%',
    alignItems: 'center',
    marginBottom: SPACING.md,
    position: 'relative',
  },
  connector: {
    position: 'absolute',
    bottom: -SPACING.md,
    width: 3,
    height: SPACING.md,
    left: '50%',
    marginLeft: -1.5,
    zIndex: 0,
  },
  levelCardTouch: {
    width: '100%',
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.soft,
    zIndex: 1,
  },
  levelCard: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  levelCardLocked: {
    opacity: 0.75,
    borderColor: 'rgba(200,200,200,0.5)',
  },

  // Premium Header Row styles
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  levelIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(45,199,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
    flexShrink: 0,
  },
  levelIconLocked: {
    backgroundColor: 'rgba(100,100,100,0.08)',
  },
  cardInfo: {
    flex: 1,
    paddingRight: SPACING.xs,
  },
  levelTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  levelTitle: {
    ...TYPOGRAPHY.labelLarge,
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
    flexShrink: 1,
  },
  textLocked: {
    color: COLORS.textSecondary,
  },
  completedBadge: {
    marginLeft: SPACING.xs,
  },
  lockedBadge: {
    backgroundColor: 'rgba(150,150,150,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.pill,
    marginLeft: SPACING.xs,
  },
  lockedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  levelDesc: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  xpMini: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: SPACING.xs,
  },
  xpMiniText: {
    ...TYPOGRAPHY.labelLarge,
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  xpMiniLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },

  // Full width Progress Bar Row
  progressSectionFull: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  progressBarBg: {
    flex: 1,
    height: 7,
    backgroundColor: 'rgba(45,199,255,0.15)',
    borderRadius: BORDER_RADIUS.pill,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.pill,
  },
  progressPctSmall: {
    ...TYPOGRAPHY.labelLarge,
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: 'bold',
    width: 36,
    textAlign: 'right',
  },

  quizBadge: {
    borderRadius: BORDER_RADIUS.pill,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    marginTop: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  quizPass: {
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderColor: 'rgba(34,197,94,0.3)',
  },
  quizFail: {
    backgroundColor: 'rgba(251,191,36,0.1)',
    borderColor: 'rgba(251,191,36,0.3)',
  },
  quizBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.text,
  },

  // Action Buttons Row (Full-width side-by-side, never overlapping)
  actionRowFull: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginTop: SPACING.md,
  },
  learnBtn: {
    flex: 1.1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 11,
    ...SHADOWS.sm,
  },
  learnBtnText: {
    ...TYPOGRAPHY.labelSmall,
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  flashBtn: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(45,199,255,0.1)',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: 'rgba(45,199,255,0.25)',
    paddingVertical: 11,
  },
  flashBtnText: {
    ...TYPOGRAPHY.labelSmall,
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
});
