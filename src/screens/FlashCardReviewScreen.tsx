import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
  Alert,
  ScrollView,
  PanResponder,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, TYPOGRAPHY } from '../theme/theme';
import { Sign, Lesson, FlashCardProgress } from '../types/data.types';
import { learningService } from '../services/learning.service';
import { flashcardService } from '../services/flashcard.service';
import { getSignById } from '../services/dictionary.service';
import { getVideoAsset } from '../utils/videoMap';
import { useAuthStore } from '../store/authStore';
import VideoPlayerCard from '../components/ui/VideoPlayerCard';

const { width: SCREEN_W } = Dimensions.get('window');

type CardResult = 'known' | 'unknown' | 'pending';

interface ReviewCard {
  sign: Sign;
  result: CardResult;
}

type EntryMode = 'loading' | 'choosing' | 'reviewing';

export const FlashCardReviewScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { pathId, pathTitle, resumeUnmastered } = route.params || {};
  const user = useAuthStore((s) => s.user);

  // ── Core state ──────────────────────────────────────────────
  const [allCards, setAllCards] = useState<ReviewCard[]>([]);
  const [cards, setCards] = useState<ReviewCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // ── Entry point selection ───────────────────────────────────
  const [entryMode, setEntryMode] = useState<EntryMode>('loading');
  const [savedProgress, setSavedProgress] = useState<FlashCardProgress | null>(null);

  // ── Refs to fix stale closures in PanResponder ──────────────
  const currentIdxRef = useRef(0);
  const cardsRef = useRef<ReviewCard[]>([]);

  // Keep refs in sync with state
  useEffect(() => { currentIdxRef.current = currentIdx; }, [currentIdx]);
  useEffect(() => { cardsRef.current = cards; }, [cards]);

  // ── Animation values ────────────────────────────────────────
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const pan = useRef(new Animated.ValueXY()).current;

  const rotate = pan.x.interpolate({
    inputRange: [-200, 0, 200],
    outputRange: ['-10deg', '0deg', '10deg'],
  });

  const borderTint = pan.x.interpolate({
    inputRange: [-120, 0, 120],
    outputRange: ['rgba(239, 68, 68, 0.4)', 'rgba(255, 255, 255, 0.8)', 'rgba(34, 197, 94, 0.4)'],
    extrapolate: 'clamp',
  });

  // ── Load all signs for this path ────────────────────────────
  useEffect(() => {
    if (!pathId) { setLoading(false); return; }
    (async () => {
      try {
        const lessons: Lesson[] = await learningService.getLessonsForPath(pathId);
        const reviewCards: ReviewCard[] = [];
        await Promise.all(
          lessons.map(async (lesson) => {
            const sign = await getSignById(lesson.signId);
            if (sign) reviewCards.push({ sign, result: 'pending' });
          })
        );
        reviewCards.sort((a, b) => {
          const li = lessons.findIndex((l) => l.signId === a.sign.id);
          const lj = lessons.findIndex((l) => l.signId === b.sign.id);
          return li - lj;
        });
        setAllCards(reviewCards);

        // Check for saved progress
        if (user?.uid) {
          const progress = await flashcardService.getProgress(user.uid, pathId);
          if (progress && progress.unmasteredSignIds.length > 0) {
            // If navigated back from summary with "continue unmastered"
            if (resumeUnmastered) {
              const unmastered = reviewCards.filter((c) =>
                progress.unmasteredSignIds.includes(c.sign.id)
              );
              setCards(unmastered.length > 0 ? unmastered : reviewCards);
              setEntryMode('reviewing');
            } else {
              setSavedProgress(progress);
              setEntryMode('choosing');
            }
          } else {
            setCards(reviewCards);
            setEntryMode('reviewing');
          }
        } else {
          setCards(reviewCards);
          setEntryMode('reviewing');
        }
      } catch (err) {
        console.error('FlashCardReview load error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [pathId, user?.uid, resumeUnmastered]);

  // ── Entry point handlers ────────────────────────────────────
  const handleContinueUnmastered = useCallback(() => {
    if (!savedProgress) return;
    const unmastered = allCards.filter((c) =>
      savedProgress.unmasteredSignIds.includes(c.sign.id)
    );
    setCards(unmastered.length > 0 ? unmastered : allCards);
    setCurrentIdx(0);
    setEntryMode('reviewing');
  }, [savedProgress, allCards]);

  const handleResetAll = useCallback(async () => {
    if (user?.uid && pathId) {
      await flashcardService.resetProgress(user.uid, pathId);
    }
    setCards(allCards);
    setCurrentIdx(0);
    setSavedProgress(null);
    setEntryMode('reviewing');
  }, [user?.uid, pathId, allCards]);

  // ── Exit handler ────────────────────────────────────────────
  const handleExit = useCallback(() => {
    Alert.alert(
      'Exit review?',
      'Your progress in this session will not be saved.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', style: 'destructive', onPress: () => navigation.goBack() },
      ]
    );
  }, [navigation]);

  // ── Flip the card (toggle) ──────────────────────────────────
  const flipCard = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  // ── Navigate to summary ─────────────────────────────────────
  const goToSummary = useCallback(
    async (finalCards: ReviewCard[]) => {
      const mastered = finalCards.filter((c) => c.result === 'known');
      const unmastered = finalCards.filter((c) => c.result === 'unknown');

      // Save progress to Firestore
      if (user?.uid && pathId) {
        const prevProgress = savedProgress;
        const totalReviews = (prevProgress?.totalReviews || 0) + 1;

        // Merge with previous progress: keep previously mastered signs that aren't in current session
        const previouslyMastered = prevProgress?.masteredSignIds || [];
        const currentSessionSignIds = finalCards.map((c) => c.sign.id);
        const keptMastered = previouslyMastered.filter(
          (id) => !currentSessionSignIds.includes(id)
        );

        const allMasteredIds = [...new Set([...keptMastered, ...mastered.map((c) => c.sign.id)])];
        const allUnmasteredIds = unmastered
          .map((c) => c.sign.id)
          .filter((id) => !allMasteredIds.includes(id));

        await flashcardService.saveProgress(
          user.uid,
          pathId,
          allMasteredIds,
          allUnmasteredIds,
          totalReviews
        );
      }

      navigation.replace('FlashCardSummary', {
        pathId,
        pathTitle,
        masteredSigns: mastered.map((c) => ({
          id: c.sign.id,
          title: c.sign.title,
        })),
        unmasteredSigns: unmastered.map((c) => ({
          id: c.sign.id,
          title: c.sign.title,
        })),
        totalCount: finalCards.length,
      });
    },
    [user?.uid, pathId, pathTitle, savedProgress, navigation]
  );

  // ── Next card transition — uses refs to avoid stale closure ─
  const goNext = useCallback(
    (result: CardResult, isSwipe: boolean = false) => {
      const idx = currentIdxRef.current;
      const currentCards = cardsRef.current;

      // Update the result for the current card
      const updated = [...currentCards];
      updated[idx] = { ...updated[idx], result };
      setCards(updated);
      cardsRef.current = updated;

      // If this was the last card, go to summary
      if (idx >= currentCards.length - 1) {
        goToSummary(updated);
        return;
      }

      const nextIdx = idx + 1;

      if (isSwipe) {
        // Since the card has already been swiped off-screen:
        // 1. Prepare next card off-screen on the opposite side
        slideAnim.setValue(result === 'known' ? SCREEN_W : -SCREEN_W);
        fadeAnim.setValue(0);
        setIsFlipped(false);
        
        // 2. Set index
        setCurrentIdx(nextIdx);
        currentIdxRef.current = nextIdx;

        // 3. Slide in the next card
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: false,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 180,
            useNativeDriver: false,
          }),
        ]).start();
      } else {
        // Slide out, then slide in next card
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: result === 'known' ? -SCREEN_W : SCREEN_W,
            duration: 250,
            useNativeDriver: false,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 180,
            useNativeDriver: false,
          }),
        ]).start(() => {
          slideAnim.setValue(result === 'known' ? SCREEN_W : -SCREEN_W);
          fadeAnim.setValue(0);
          setIsFlipped(false);
          setCurrentIdx(nextIdx);
          currentIdxRef.current = nextIdx;

          Animated.parallel([
            Animated.timing(slideAnim, {
              toValue: 0,
              duration: 250,
              useNativeDriver: false,
            }),
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 180,
              useNativeDriver: false,
            }),
          ]).start();
        });
      }
    },
    [slideAnim, fadeAnim, goToSummary]
  );

  // ── Ref for goNext so PanResponder always has the latest ────
  const goNextRef = useRef<(result: CardResult, isSwipe?: boolean) => void>(goNext);
  useEffect(() => { goNextRef.current = goNext; }, [goNext]);

  // ── PanResponder — reads goNextRef to avoid stale closure ───
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 15 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_e, gestureState) => {
        if (gestureState.dx > 120) {
          Animated.timing(pan, {
            toValue: { x: SCREEN_W + 50, y: gestureState.dy },
            duration: 200,
            useNativeDriver: false,
          }).start(() => {
            goNextRef.current('known', true);
            pan.setValue({ x: 0, y: 0 });
          });
        } else if (gestureState.dx < -120) {
          Animated.timing(pan, {
            toValue: { x: -SCREEN_W - 50, y: gestureState.dy },
            duration: 200,
            useNativeDriver: false,
          }).start(() => {
            goNextRef.current('unknown', true);
            pan.setValue({ x: 0, y: 0 });
          });
        } else {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            friction: 5,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  // ── Real-time counters ──────────────────────────────────────
  const masteredCount = useMemo(() => cards.filter((c) => c.result === 'known').length, [cards]);
  const learningCount = useMemo(() => cards.filter((c) => c.result === 'unknown').length, [cards]);

  // ── Loading state ───────────────────────────────────────────
  if (loading) {
    return (
      <LinearGradient colors={['#E8F8FF', '#F0FBFF', '#FAFEFF']} style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </LinearGradient>
    );
  }

  // ── Empty state ─────────────────────────────────────────────
  if (allCards.length === 0 && !loading) {
    return (
      <LinearGradient colors={['#E8F8FF', '#F0FBFF', '#FAFEFF']} style={styles.container}>
        <SafeAreaView style={styles.centered}>
          <Ionicons name="layers-outline" size={48} color={COLORS.textSecondary} style={{ marginBottom: 12 }} />
          <Text style={styles.noCardsText}>No signs available in this lesson.</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ── Entry point selection modal ─────────────────────────────
  if (entryMode === 'choosing' && savedProgress) {
    const unmasteredCount = savedProgress.unmasteredSignIds.length;
    const prevMastered = savedProgress.masteredSignIds.length;
    const total = unmasteredCount + prevMastered;
    const prevRate = savedProgress.completionRate;

    return (
      <LinearGradient colors={['#E8F8FF', '#F0FBFF', '#FAFEFF']} style={styles.container}>
        <View style={styles.blobTL} />
        <View style={styles.blobBR} />
        <SafeAreaView style={{ flex: 1 }}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
              <Ionicons name="arrow-back" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Flashcards</Text>
              <Text style={styles.headerSub}>{pathTitle}</Text>
            </View>
            <View style={{ width: 28 }} />
          </View>

          <View style={styles.entryContent}>
            {/* Progress indicator */}
            <View style={styles.entryProgressCard}>
              <BlurView intensity={70} tint="light" style={styles.entryProgressBlur}>
                <Ionicons name="bookmark" size={28} color={COLORS.primary} style={{ marginBottom: 8 }} />
                <Text style={styles.entryProgressTitle}>Previous Progress</Text>
                <Text style={styles.entryProgressRate}>{prevRate}%</Text>
                <Text style={styles.entryProgressSub}>
                  {prevMastered} mastered · {unmasteredCount} remaining
                </Text>
              </BlurView>
            </View>

            {/* Option buttons */}
            <View style={styles.entryOptions}>
              <TouchableOpacity
                style={styles.entryOptionPrimary}
                onPress={handleContinueUnmastered}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#2DC7FF', '#00A3E0']}
                  style={styles.entryOptionGrad}
                >
                  <Ionicons name="play-forward" size={20} color="#FFF" />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.entryOptionPrimaryText}>
                      Continue with {unmasteredCount} word{unmasteredCount !== 1 ? 's' : ''}
                    </Text>
                    <Text style={styles.entryOptionPrimarySub}>
                      Review only unmastered signs
                    </Text>
                  </View>
                  <Ionicons name="arrow-forward" size={18} color="rgba(255,255,255,0.7)" />
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.entryOptionSecondary}
                onPress={handleResetAll}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh" size={20} color={COLORS.primary} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.entryOptionSecText}>
                    Reset & Review All {total} words
                  </Text>
                  <Text style={styles.entryOptionSecSub}>
                    Start fresh from the beginning
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ── Main review UI ──────────────────────────────────────────
  if (cards.length === 0) {
    return (
      <LinearGradient colors={['#E8F8FF', '#F0FBFF', '#FAFEFF']} style={styles.container}>
        <SafeAreaView style={styles.centered}>
          <Text style={styles.noCardsText}>No cards to review.</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const current = cards[currentIdx];
  if (!current) return null;

  const localAsset = getVideoAsset(current.sign.id);
  const cloudUrl = current.sign.videoURL || undefined;

  return (
    <LinearGradient colors={['#E8F8FF', '#F0FBFF', '#FAFEFF']} style={styles.container}>
      <View style={styles.blobTL} />
      <View style={styles.blobBR} />

      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleExit} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Flashcards</Text>
            <Text style={styles.headerSub}>{pathTitle}</Text>
          </View>
          <Text style={styles.counter}>
            {currentIdx + 1} / {cards.length}
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBg}>
          <View
            style={[
              styles.progressFill,
              { width: `${((currentIdx + 1) / cards.length) * 100}%` },
            ]}
          />
        </View>

        {/* Counters */}
        <View style={styles.countersRow}>
          <BlurView intensity={70} tint="light" style={styles.countersBlur}>
            <View style={styles.counterBox}>
              <Ionicons name="help-circle" size={16} color="#64748B" style={{ marginRight: 4 }} />
              <Text style={styles.learningText}>
                Learning: <Text style={{ fontWeight: 'bold', color: '#475569' }}>{learningCount}</Text>
              </Text>
            </View>
            <View style={styles.counterDivider} />
            <View style={styles.counterBox}>
              <Ionicons name="checkmark-circle" size={16} color="#22C55E" style={{ marginRight: 4 }} />
              <Text style={styles.masteredText}>
                Mastered: <Text style={{ fontWeight: 'bold', color: '#16A34A' }}>{masteredCount}</Text>
              </Text>
            </View>
          </BlurView>
        </View>

        {/* Card Area */}
        <View style={styles.cardArea}>
          <Animated.View
            style={[
              styles.flashCard,
              {
                opacity: fadeAnim,
                borderColor: borderTint,
                transform: [
                  { translateX: Animated.add(slideAnim, pan.x) },
                  { translateY: pan.y },
                  { rotate },
                ],
              },
            ]}
            {...panResponder.panHandlers}
          >
            <BlurView intensity={80} tint="light" style={styles.cardBlur}>
              {!isFlipped ? (
                /* ──── FRONT FACE ──── */
                <View style={styles.frontContent}>
                  <View style={styles.cardTopRow}>
                    <View style={styles.catTag}>
                      <Text style={styles.catText}>{current.sign.category}</Text>
                    </View>
                    <Text style={styles.cardHint}>Tap to view sign</Text>
                  </View>

                  <View style={styles.frontCenter}>
                    <Ionicons name="school" size={64} color="#2DC7FF" style={{ marginBottom: 12 }} />
                    <Text style={styles.cardTitle}>{current.sign.title}</Text>
                  </View>

                  <TouchableOpacity style={styles.flipBtn} onPress={flipCard} activeOpacity={0.8}>
                    <LinearGradient
                      colors={['rgba(45,199,255,0.2)', 'rgba(45,199,255,0.08)']}
                      style={styles.flipBtnGrad}
                    >
                      <Ionicons name="eye-outline" size={20} color={COLORS.primary} />
                      <Text style={styles.flipBtnText}>Show Motion</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              ) : (
                /* ──── BACK FACE ──── */
                <ScrollView
                  style={{ flex: 1, width: '100%' }}
                  contentContainerStyle={styles.backContent}
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                >
                  <Text style={styles.backTitle}>{current.sign.title}</Text>

                  <View style={styles.videoArea}>
                    <VideoPlayerCard
                      source={localAsset}
                      sourceUrl={cloudUrl}
                      height={SCREEN_W * 0.45}
                      autoPlay
                      compact
                    />
                  </View>

                  {current.sign.description ? (
                    <Text style={styles.backDesc}>{current.sign.description}</Text>
                  ) : null}

                  {/* Swipe hints */}
                  <View style={styles.swipeHintRow}>
                    <View style={styles.hintL}>
                      <Ionicons name="arrow-back" size={14} color="#64748B" />
                      <Text style={styles.hintLText}>Swipe Left to Study Again</Text>
                    </View>
                    <View style={styles.hintDivider} />
                    <View style={styles.hintR}>
                      <Text style={styles.hintRText}>Swipe Right if Mastered</Text>
                      <Ionicons name="arrow-forward" size={14} color="#22C55E" />
                    </View>
                  </View>
                </ScrollView>
              )}
            </BlurView>
          </Animated.View>
        </View>

        {/* Bottom helper */}
        {!isFlipped && (
          <TouchableOpacity style={styles.bottomFlip} onPress={flipCard}>
            <Ionicons name="eye-outline" size={18} color={COLORS.textSecondary} style={{ marginRight: 6 }} />
            <Text style={styles.bottomFlipText}>Tap anywhere to view ASL sign video</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: SPACING.md },
  blobTL: {
    position: 'absolute', top: -60, left: -60,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(45,199,255,0.08)',
  },
  blobBR: {
    position: 'absolute', bottom: -80, right: -40,
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(45,199,255,0.05)',
  },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingTop: SPACING.sm, paddingBottom: 8,
  },
  closeBtn: { padding: 4 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { ...TYPOGRAPHY.labelLarge, color: COLORS.text, fontSize: 17 },
  headerSub: { ...TYPOGRAPHY.labelSmall, color: COLORS.textSecondary, marginTop: 2 },
  counter: { ...TYPOGRAPHY.labelMedium, color: COLORS.primary, fontWeight: 'bold' },

  // Progress Bar
  progressBg: {
    height: 6, backgroundColor: 'rgba(45,199,255,0.1)',
    marginHorizontal: SPACING.md, borderRadius: BORDER_RADIUS.pill,
    overflow: 'hidden', marginBottom: SPACING.sm,
  },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.pill },

  // Counters
  countersRow: { paddingHorizontal: SPACING.md, marginBottom: SPACING.sm },
  countersBlur: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.pill, borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
    ...SHADOWS.soft, overflow: 'hidden',
  },
  counterBox: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'center' },
  counterDivider: { width: 1, height: 18, backgroundColor: 'rgba(200,220,235,0.6)' },
  learningText: { ...TYPOGRAPHY.labelSmall, color: COLORS.textSecondary, fontSize: 12 },
  masteredText: { ...TYPOGRAPHY.labelSmall, color: '#16A34A', fontSize: 12 },

  // Card Area
  cardArea: {
    flex: 1, justifyContent: 'center',
    paddingHorizontal: SPACING.md, marginBottom: SPACING.xs,
  },
  flashCard: {
    width: '100%',
    height: SCREEN_W * 1.12,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden', borderWidth: 2,
    ...SHADOWS.glass,
  },
  cardBlur: {
    flex: 1, borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
  },

  // Front face
  frontContent: {
    flex: 1, padding: SPACING.md, paddingVertical: SPACING.lg,
    alignItems: 'center', justifyContent: 'space-between',
  },
  cardTopRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', width: '100%',
  },
  catTag: {
    backgroundColor: 'rgba(45,199,255,0.12)', borderRadius: BORDER_RADIUS.pill,
    paddingHorizontal: 12, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(45,199,255,0.25)',
  },
  catText: { ...TYPOGRAPHY.labelSmall, color: COLORS.primary, fontWeight: 'bold' },
  cardHint: { ...TYPOGRAPHY.labelSmall, color: COLORS.textSecondary, fontSize: 11 },
  frontCenter: { alignItems: 'center', justifyContent: 'center' },
  cardTitle: {
    ...TYPOGRAPHY.headlineLarge, color: COLORS.text,
    fontSize: 34, textAlign: 'center',
  },
  flipBtn: { width: '100%', borderRadius: BORDER_RADIUS.lg, overflow: 'hidden' },
  flipBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, gap: 8,
    borderWidth: 1.5, borderColor: 'rgba(45,199,255,0.3)', borderRadius: BORDER_RADIUS.lg,
  },
  flipBtnText: { ...TYPOGRAPHY.labelLarge, color: COLORS.primary, fontWeight: 'bold' },

  // Back face
  backContent: {
    padding: SPACING.md, paddingTop: SPACING.sm,
    alignItems: 'center', paddingBottom: SPACING.md,
  },
  backTitle: {
    ...TYPOGRAPHY.headlineMedium, color: COLORS.text,
    fontSize: 22, textAlign: 'center', fontWeight: 'bold', marginBottom: 8,
  },
  videoArea: { width: '100%', borderRadius: BORDER_RADIUS.lg, overflow: 'hidden', marginBottom: 8 },
  backDesc: {
    ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary,
    lineHeight: 18, textAlign: 'center', paddingHorizontal: 6, marginBottom: 10,
  },

  // Swipe hints
  swipeHintRow: {
    flexDirection: 'row', width: '100%',
    backgroundColor: 'rgba(255,255,255,0.6)', paddingVertical: 10, paddingHorizontal: SPACING.xs,
    borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: 'rgba(200,220,235,0.4)',
    alignItems: 'center',
  },
  hintL: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-start' },
  hintDivider: { width: 1, height: 18, backgroundColor: 'rgba(200,220,235,0.8)', marginHorizontal: 4 },
  hintR: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' },
  hintLText: { fontSize: 10, fontWeight: '600', color: '#64748B', marginLeft: 4 },
  hintRText: { fontSize: 10, fontWeight: '600', color: '#16A34A', marginRight: 4 },

  // Bottom prompt
  bottomFlip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: SPACING.sm,
  },
  bottomFlipText: { ...TYPOGRAPHY.labelMedium, color: COLORS.textSecondary, fontSize: 13 },

  // Empty / Error states
  noCardsText: {
    ...TYPOGRAPHY.bodyMedium, color: COLORS.textSecondary,
    textAlign: 'center', marginBottom: SPACING.md,
  },
  backBtn: {
    backgroundColor: COLORS.primary, paddingHorizontal: 24,
    paddingVertical: 12, borderRadius: BORDER_RADIUS.md,
  },
  backBtnText: { ...TYPOGRAPHY.labelLarge, color: '#FFF' },

  // ── Entry Point Selection ───────────────────────────────────
  entryContent: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xl,
  },
  entryProgressCard: {
    marginBottom: SPACING.lg, borderRadius: BORDER_RADIUS.xl, overflow: 'hidden',
  },
  entryProgressBlur: {
    padding: SPACING.lg, alignItems: 'center',
    borderRadius: BORDER_RADIUS.xl, borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.8)', overflow: 'hidden',
    ...SHADOWS.glass,
  },
  entryProgressTitle: {
    ...TYPOGRAPHY.labelLarge, color: COLORS.textSecondary, fontSize: 13, marginBottom: 4,
  },
  entryProgressRate: {
    ...TYPOGRAPHY.headlineLarge, color: COLORS.primary, fontSize: 44, fontWeight: 'bold',
  },
  entryProgressSub: {
    ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary, marginTop: 4,
  },
  entryOptions: { gap: 12 },
  entryOptionPrimary: {
    borderRadius: BORDER_RADIUS.lg, overflow: 'hidden',
    ...SHADOWS.glass,
  },
  entryOptionGrad: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 16, paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  entryOptionPrimaryText: {
    ...TYPOGRAPHY.labelLarge, color: '#FFF', fontSize: 15,
  },
  entryOptionPrimarySub: {
    ...TYPOGRAPHY.labelSmall, color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2,
  },
  entryOptionSecondary: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 16, paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg, borderWidth: 1.5,
    borderColor: 'rgba(45,199,255,0.25)', backgroundColor: 'rgba(255,255,255,0.7)',
  },
  entryOptionSecText: {
    ...TYPOGRAPHY.labelLarge, color: COLORS.text, fontSize: 15,
  },
  entryOptionSecSub: {
    ...TYPOGRAPHY.labelSmall, color: COLORS.textSecondary, fontSize: 11, marginTop: 2,
  },
});
