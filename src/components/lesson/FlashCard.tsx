import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Sign } from '../../types/data.types';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, TYPOGRAPHY } from '../../theme/theme';
import { getVideoAsset } from '../../utils/videoMap';
import VideoPlayerCard from '../ui/VideoPlayerCard';

const { width } = Dimensions.get('window');

// ─── Props ───────────────────────────────────────────────────────────────────
interface FlashCardProps {
  sign: Sign;
  lessonIndex: number;
  totalLessons: number;
  /** legacy prop – keep for compatibility with VideoModal flow */
  onWatchVideo?: () => void;
  onNext: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────
const FlashCard: React.FC<FlashCardProps> = ({
  sign, lessonIndex, totalLessons, onNext,
}) => {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    // Reset & re-animate on sign change
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    scaleAnim.setValue(0.95);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, useNativeDriver: true }),
    ]).start();
  }, [sign.id]);

  // Local video asset (bundled)
  const localAsset = getVideoAsset(sign.id);
  // Cloud URL fallback
  const cloudUrl   = sign.videoURL || undefined;
  const hasVideo   = !!localAsset || !!cloudUrl;

  const isLast = lessonIndex >= totalLessons - 1;

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] },
      ]}
    >
      <BlurView intensity={90} tint="light" style={styles.card}>

        {/* ── Category + Difficulty row ─────────────────────── */}
        <View style={styles.topRow}>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryText}>{sign.category}</Text>
          </View>
          <View style={[styles.diffBadge, getDifficultyStyle(sign.difficulty)]}>
            <Text style={styles.diffText}>{sign.difficulty}</Text>
          </View>
        </View>

        {/* ── Icon + Title ─────────────────────────────────── */}
        <Ionicons name="school-outline" size={72} color="#2DC7FF" style={{ marginBottom: SPACING.md }} />
        <Text style={styles.title}>{sign.title}</Text>

        {/* ── Video player (nhúng trực tiếp) ──────────────── */}
        <View style={styles.playerWrap}>
          {hasVideo ? (
            <VideoPlayerCard
              source={localAsset}
              sourceUrl={cloudUrl}
              height={width * 0.52}
              guideText={sign.description}
              autoPlay={false}
            />
          ) : (
            <View style={styles.noVideoBox}>
              <Ionicons name="videocam-off-outline" size={28} color={COLORS.textSecondary} />
              <Text style={styles.noVideoText}>Video chưa có — sẽ cập nhật sớm</Text>
            </View>
          )}
        </View>

        {/* ── Ghi chú nhanh (description hint) ────────────── */}
        {!hasVideo && (
          <View style={styles.descBox}>
            <Ionicons name="information-circle-outline" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
            <Text style={styles.desc}>{sign.description}</Text>
          </View>
        )}

        {/* ── "Hoàn thành" button ───────────────────────────── */}
        <TouchableOpacity style={styles.doneBtn} onPress={onNext} activeOpacity={0.85}>
          <LinearGradient
            colors={isLast ? ['#22C55E', '#16A34A'] : ['#1A1C1C', '#333']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.doneBtnGrad}
          >
            <Ionicons
              name={isLast ? 'checkmark-circle' : 'arrow-forward'}
              size={20}
              color="#FFF"
            />
            <Text style={styles.doneBtnText}>
              {isLast ? 'Hoàn thành — Vào Quiz 🧠' : 'Đã học xong! →'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* ── Progress dots ─────────────────────────────────── */}
        <View style={styles.dotsRow}>
          {Array.from({ length: Math.min(totalLessons, 12) }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === lessonIndex && styles.dotActive,
                i < lessonIndex  && styles.dotDone,
              ]}
            />
          ))}
          {totalLessons > 12 && (
            <Text style={styles.dotsMore}>+{totalLessons - 12}</Text>
          )}
        </View>

      </BlurView>
    </Animated.View>
  );
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getDifficultyStyle(difficulty: string) {
  switch (difficulty) {
    case 'Easy':   return { backgroundColor: 'rgba(34,197,94,0.15)',  borderColor: 'rgba(34,197,94,0.3)'  };
    case 'Medium': return { backgroundColor: 'rgba(251,191,36,0.15)', borderColor: 'rgba(251,191,36,0.3)' };
    case 'Hard':   return { backgroundColor: 'rgba(239,68,68,0.15)',  borderColor: 'rgba(239,68,68,0.3)'  };
    default:       return { backgroundColor: 'rgba(100,100,100,0.1)', borderColor: 'rgba(100,100,100,0.2)' };
  }
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  cardWrapper: {
    width: width - SPACING.xl * 2,
    alignSelf: 'center',
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  card: {
    padding: SPACING.sm,
    paddingTop: SPACING.md,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.8)',
    overflow: 'hidden',
  },

  // Top row: category + difficulty
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: SPACING.sm,
  },
  categoryTag: {
    backgroundColor: 'rgba(45,199,255,0.12)',
    borderRadius: BORDER_RADIUS.pill,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(45,199,255,0.25)',
  },
  categoryText: {
    ...TYPOGRAPHY.labelMedium,
    color: COLORS.primary,
    fontSize: 12,
  },
  diffBadge: {
    borderRadius: BORDER_RADIUS.pill,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderWidth: 1,
  },
  diffText: { fontSize: 12, fontWeight: '600', color: COLORS.text },

  // Emoji + title
  emoji: { fontSize: 72, marginBottom: 6 },
  title: {
    ...TYPOGRAPHY.headlineLarge,
    color: COLORS.text,
    fontSize: 28,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },

  // Video player
  playerWrap: {
    width: '100%',
    marginBottom: SPACING.sm,
  },

  // No-video fallback
  noVideoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: SPACING.sm,
    opacity: 0.6,
  },
  noVideoText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },

  // Description (only when no video)
  descBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(45,199,255,0.06)',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(45,199,255,0.15)',
    width: '100%',
  },
  desc: {
    flex: 1,
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },

  // Done button
  doneBtn: {
    width: '100%',
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  doneBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  doneBtnText: {
    color: '#FFF',
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
  },

  // Progress dots
  dotsRow: {
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingBottom: 4,
  },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  dotActive: { backgroundColor: COLORS.primary, width: 20, borderRadius: 4 },
  dotDone:   { backgroundColor: 'rgba(34,197,94,0.55)' },
  dotsMore: {
    ...TYPOGRAPHY.labelSmall,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
});

export default FlashCard;
