import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, Image, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, TYPOGRAPHY } from '../../theme/theme';
import { useAuthStore } from '../../store/authStore';
import { useProgressStore } from '../../store/progressStore';
import { getLeaderboard } from '../../services/auth.service';
import { UserProfile } from '../../types/auth.types';

const { width } = Dimensions.get('window');

const PASS_THRESHOLD = 70; // % needed to pass

interface LessonCompleteProps {
  pathTitle: string;
  totalLessons: number;
  xpEarned: number;
  correctAnswers: number;
  totalQuestions: number;
  streakDays: number;
  onContinue: () => void;
  onRetakeQuiz: () => void;
}

const LessonComplete: React.FC<LessonCompleteProps> = ({
  pathTitle, totalLessons, xpEarned,
  correctAnswers, totalQuestions,
  streakDays, onContinue, onRetakeQuiz,
}) => {
  const { user } = useAuthStore();
  const { progress } = useProgressStore();
  
  const scorePercent = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
  const passed = scorePercent >= PASS_THRESHOLD;

  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const starAnim = useRef(new Animated.Value(0)).current;

  // Leaderboard states
  const [leaderboard, setLeaderboard] = useState<UserProfile[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 100, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(starAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(starAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
        ]),
        { iterations: 3 }
      ).start();
    });
  }, []);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const fetched = await getLeaderboard(10);
        const merged = [...fetched];

        // Ensure current user is present and reflects their active XP
        if (user) {
          const currentXP = (progress?.totalXP || 0) + (passed ? xpEarned : 0);
          const existingIdx = merged.findIndex(u => u.uid === user.uid);
          
          if (existingIdx !== -1) {
            merged[existingIdx].totalXP = Math.max(merged[existingIdx].totalXP, currentXP);
            if (user.displayName) merged[existingIdx].displayName = user.displayName;
            if (user.photoURL) merged[existingIdx].photoURL = user.photoURL;
          } else {
            merged.push({
              uid: user.uid,
              displayName: user.displayName || 'You',
              photoURL: user.photoURL,
              totalXP: currentXP,
              email: user.email || '',
              createdAt: 0,
              streakDays: streakDays,
              lastActiveDate: '',
            });
          }
        }

        // Sort descending by totalXP
        merged.sort((a, b) => b.totalXP - a.totalXP);
        
        // Take top 5 for neat display
        setLeaderboard(merged.slice(0, 5));
      } catch (err) {
        console.error("Failed to load leaderboard in LessonComplete:", err);
      } finally {
        setLeaderboardLoading(false);
      }
    };

    loadLeaderboard();
  }, [user, progress, passed, xpEarned]);

  const starOpacity = starAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });
  const starScale = starAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });

  const currentUserRank = leaderboard.findIndex(u => u.uid === user?.uid) + 1;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
      <BlurView intensity={95} tint="light" style={styles.card}>
        {/* Result Vector Icon */}
        <Animated.View style={[{ transform: [{ scale: starScale }], opacity: starOpacity, marginBottom: SPACING.md }]}>
          {passed ? (
            <Ionicons name="trophy" size={80} color="#F59E0B" />
          ) : (
            <Ionicons name="alert-circle" size={80} color="#FF8C42" />
          )}
        </Animated.View>

        {/* Title */}
        <Text style={styles.title}>{passed ? 'Lesson Complete!' : 'Keep Practicing!'}</Text>
        <Text style={styles.subtitle}>{pathTitle}</Text>

        {/* Score card */}
        <View style={[styles.scoreCard, passed ? styles.scoreCardPass : styles.scoreCardFail]}>
          <Text style={[styles.scorePercent, { color: passed ? '#16A34A' : '#DC2626' }]}>
            {scorePercent}%
          </Text>
          <Text style={styles.scoreLabel}>
            {correctAnswers} / {totalQuestions} correct
          </Text>
          <Text style={styles.scoreThreshold}>
            {passed ? (
              <Text style={{ color: '#16A34A', fontWeight: 'bold' }}>Passed (≥70% required)</Text>
            ) : (
              <Text style={{ color: '#DC2626', fontWeight: 'bold' }}>Need {PASS_THRESHOLD}% to pass</Text>
            )}
          </Text>
        </View>

        {passed && (
          <>
            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <LinearGradient colors={['#2DC7FF', '#00A3E0']} style={styles.statIcon}>
                  <Ionicons name="star" size={20} color="#FFF" />
                </LinearGradient>
                <Text style={styles.statValue}>+{xpEarned}</Text>
                <Text style={styles.statLabel}>XP Earned</Text>
              </View>
              <View style={styles.stat}>
                <LinearGradient colors={['#FF8C42', '#FF6B00']} style={styles.statIcon}>
                  <Ionicons name="flame" size={20} color="#FFF" />
                </LinearGradient>
                <Text style={styles.statValue}>{streakDays}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
              <View style={styles.stat}>
                <LinearGradient colors={['#22C55E', '#16A34A']} style={styles.statIcon}>
                  <Ionicons name="book" size={20} color="#FFF" />
                </LinearGradient>
                <Text style={styles.statValue}>{totalLessons}</Text>
                <Text style={styles.statLabel}>Words Done</Text>
              </View>
            </View>
          </>
        )}

        {/* Global Rankings Leaderboard */}
        <View style={styles.leaderboardHeader}>
          <Ionicons name="trophy-outline" size={16} color="#2DC7FF" />
          <Text style={styles.leaderboardTitle}>Global Rankings</Text>
        </View>

        <View style={styles.leaderboardContainer}>
          {leaderboardLoading ? (
            <ActivityIndicator size="small" color="#2DC7FF" style={{ paddingVertical: 20 }} />
          ) : (
            leaderboard.map((item, index) => {
              const rank = index + 1;
              const isSelf = item.uid === user?.uid;
              
              // Custom rank border colors (Premium rank frames)
              let frameColor = '#2DC7FF'; // default Cyan
              let glowStyle = {};
              if (rank === 1) {
                frameColor = '#F59E0B'; // Gold
                glowStyle = { shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 6 };
              } else if (rank === 2) {
                frameColor = '#94A3B8'; // Silver
                glowStyle = { shadowColor: '#94A3B8', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.35, shadowRadius: 4 };
              } else if (rank === 3) {
                frameColor = '#B45309'; // Bronze
                glowStyle = { shadowColor: '#B45309', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.35, shadowRadius: 4 };
              }

              return (
                <View key={item.uid} style={[styles.leaderboardRow, isSelf && styles.leaderboardRowSelf]}>
                  {/* Rank Column */}
                  <View style={styles.rankCol}>
                    {rank === 1 ? (
                      <Ionicons name="trophy" size={16} color="#F59E0B" />
                    ) : rank === 2 ? (
                      <Ionicons name="medal" size={16} color="#94A3B8" />
                    ) : rank === 3 ? (
                      <Ionicons name="medal" size={16} color="#B45309" />
                    ) : (
                      <Text style={styles.rankNum}>{rank}</Text>
                    )}
                  </View>

                  {/* Avatar Column with Rank Frame */}
                  <View style={[styles.avatarFrame, { borderColor: frameColor }, glowStyle]}>
                    {item.photoURL ? (
                      <Image source={{ uri: item.photoURL }} style={styles.avatarImg} />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarPlaceholderText}>
                          {(item.displayName || 'U').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Name Column */}
                  <Text numberOfLines={1} style={[styles.userName, isSelf && styles.userNameSelf]}>
                    {item.displayName || 'SignBridge User'} {isSelf ? '(You)' : ''}
                  </Text>

                  {/* XP Column */}
                  <Text style={styles.userXP}>{item.totalXP} XP</Text>
                </View>
              );
            })
          )}
        </View>

        {currentUserRank > 0 && !leaderboardLoading && (
          <Text style={styles.rankBannerText}>
            You hold the rank of #{currentUserRank} on SignBridge!
          </Text>
        )}

        {/* Action buttons */}
        {passed ? (
          <TouchableOpacity style={styles.continueBtn} onPress={onContinue} activeOpacity={0.85}>
            <LinearGradient colors={['#2DC7FF', '#00A3E0']} style={styles.continueBtnGrad}>
              <Text style={styles.continueBtnText}>Continue Learning</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity style={styles.retakeBtn} onPress={onRetakeQuiz} activeOpacity={0.85}>
              <LinearGradient colors={['#FF8C42', '#FF6B00']} style={styles.continueBtnGrad}>
                <Ionicons name="refresh" size={20} color="#FFF" />
                <Text style={styles.continueBtnText}>Retake Quiz</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.skipBtn} onPress={onContinue} activeOpacity={0.7}>
              <Text style={styles.skipBtnText}>Skip for now</Text>
            </TouchableOpacity>
          </>
        )}
      </BlurView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width - SPACING.xl * 2,
    alignSelf: 'center',
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  card: {
    padding: SPACING.md,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
    overflow: 'hidden',
  },
  resultEmoji: {
    fontSize: 72,
    marginBottom: SPACING.md,
  },
  title: {
    ...TYPOGRAPHY.headlineLarge,
    color: COLORS.text,
    fontSize: 26,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: SPACING.md,
  },
  scoreCard: {
    width: '100%',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1.5,
  },
  scoreCardPass: {
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderColor: 'rgba(34,197,94,0.3)',
  },
  scoreCardFail: {
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderColor: 'rgba(239,68,68,0.25)',
  },
  scorePercent: {
    fontFamily: 'Poppins-Bold',
    fontSize: 48,
    lineHeight: 56,
  },
  scoreLabel: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 4,
  },
  scoreThreshold: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: SPACING.md,
  },
  stat: {
    alignItems: 'center',
    gap: 4,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statIconEmoji: {
    fontSize: 20,
  },
  statValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: COLORS.text,
  },
  statLabel: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  
  // Leaderboard styles
  leaderboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  leaderboardTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  leaderboardContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: BORDER_RADIUS.lg,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    marginBottom: SPACING.sm,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: 4,
    gap: 8,
  },
  leaderboardRowSelf: {
    backgroundColor: 'rgba(45, 199, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(45, 199, 255, 0.25)',
  },
  rankCol: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNum: {
    fontFamily: 'Inter',
    fontWeight: 'bold',
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  avatarFrame: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(45, 199, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    color: COLORS.primary,
  },
  userName: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 13,
    color: COLORS.text,
  },
  userNameSelf: {
    fontFamily: 'Poppins-Bold',
    color: COLORS.primary,
  },
  userXP: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: COLORS.text,
  },
  rankBannerText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: SPACING.md,
  },

  continueBtn: {
    width: '100%',
    borderRadius: BORDER_RADIUS.pill,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  retakeBtn: {
    width: '100%',
    borderRadius: BORDER_RADIUS.pill,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  continueBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  continueBtnText: {
    color: '#FFF',
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
  },
  skipBtn: {
    paddingVertical: SPACING.sm,
  },
  skipBtnText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: COLORS.textSecondary,
    textDecoration: 'underline',
  } as any,
});

export { PASS_THRESHOLD };
export default LessonComplete;
