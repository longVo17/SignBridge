import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useAuthStore } from '../store/authStore';
import { useProgress } from '../hooks/useProgress';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../theme/theme';
import { learningService } from '../services/learning.service';

const { width } = Dimensions.get('window');
const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';

const QUICK_ACTIONS = [
  { id: '1', icon: 'videocam' as const, label: 'AI Practice', color: '#2DC7FF', bg: 'rgba(45,199,255,0.12)', screen: 'Practice' },
  { id: '2', icon: 'book' as const, label: 'Dictionary', color: '#00B4F5', bg: 'rgba(0,180,245,0.12)', screen: 'Dictionary' },
  { id: '3', icon: 'map' as const, label: 'Learning Path', color: '#0EA5E9', bg: 'rgba(14,165,233,0.12)', screen: 'Learn' },
  { id: '4', icon: 'language' as const, label: 'Translation', color: '#38BDF8', bg: 'rgba(56,189,248,0.12)', screen: 'Translation' },
];

const DAILY_SIGNS = [
  { id: '1', iconName: 'hand-left-outline' as const, word: 'Hello', category: 'Greetings' },
  { id: '2', iconName: 'heart-outline' as const, word: 'Thank You', category: 'Polite' },
  { id: '3', iconName: 'happy-outline' as const, word: 'Peace', category: 'Basics' },
];

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const { progress } = useProgress();
  const [paths, setPaths] = useState<any[]>([]);

  // Fetch learning paths to calculate completed ones for review
  useEffect(() => {
    (async () => {
      try {
        const fetchedPaths = await learningService.getLearningPaths();
        setPaths(fetchedPaths);
      } catch (err) {
        console.error("Failed to load paths in HomeScreen:", err);
      }
    })();
  }, []);

  const streak = progress?.streakDays || 0;
  const xp = progress?.totalXP || 0;
  // A simple level calculation: every 100 XP is a level.
  const level = Math.floor(xp / 100) + 1;
  const xpToNextLevel = 100 - (xp % 100);
  const progressPercent = (xp % 100);

  // Filter paths completed by the user
  const completedPaths = paths.filter(p => progress?.completedPaths?.includes(p.id));

  const translateTitle = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('bảng chữ cái') || t.includes('alphabet')) return 'ASL Alphabet';
    if (t.includes('chào hỏi') || t.includes('greeting')) return 'Greetings & Meetings';
    if (t.includes('giao tiếp') || t.includes('essential')) return 'Essential Comm';
    if (t.includes('màu sắc') || t.includes('color')) return 'ASL Colors';
    if (t.includes('chữ số') || t.includes('number')) return 'ASL Numbers';
    return title;
  };

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'ASL Explorer';

  return (
    <LinearGradient
      colors={['#E8F8FF', '#F0FBFF', '#FAFEFF']}
      style={styles.container}
    >
      {/* Decorative blobs */}
      <View style={styles.blobTop} />
      <View style={styles.blobRight} />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animatable.View animation="fadeInDown" delay={50} style={styles.header}>
            <View style={{ flex: 1, marginRight: SPACING.md }}>
              <Text style={styles.greeting}>Good morning,</Text>
              <Text 
                style={styles.userName}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {displayName}
              </Text>
            </View>

            {/* Bell Icon Notification Trigger */}
            <TouchableOpacity
              style={styles.bellButton}
              onPress={() => navigation.navigate('Notifications')}
              activeOpacity={0.7}
            >
              <BlurView intensity={75} tint="light" style={styles.bellBlur}>
                <Ionicons name="notifications-outline" size={20} color={COLORS.primary} />
              </BlurView>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.profileAvatar}
              onPress={() => navigation.navigate('Profile')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#2DC7FF', '#00A3E0']}
                style={styles.avatarGradientRing}
              >
                <Image
                  source={{ uri: user?.photoURL || DEFAULT_AVATAR }}
                  style={styles.homeAvatarImage}
                />
              </LinearGradient>
            </TouchableOpacity>
          </Animatable.View>

          {/* Completed Lessons Section (Review finished units side-by-side above progress card) */}
          {completedPaths.length > 0 && (
            <Animatable.View animation="fadeInDown" delay={100} style={styles.reviewSection}>
              <Text style={styles.reviewTitle}>Review Completed Units</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reviewScroll}>
                {completedPaths.map(path => (
                  <TouchableOpacity
                    key={path.id}
                    style={styles.reviewBadge}
                    onPress={() => navigation.navigate('Learn')}
                    activeOpacity={0.85}
                  >
                    <BlurView intensity={80} tint="light" style={styles.reviewBlur}>
                      <Ionicons name="repeat" size={14} color={COLORS.primary} style={{ marginRight: 6 }} />
                      <Text style={styles.reviewBadgeText}>{translateTitle(path.title)}</Text>
                    </BlurView>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Animatable.View>
          )}

          {/* Progress Card */}
          <Animatable.View animation="fadeInUp" delay={150}>
            <BlurView intensity={85} tint="light" style={styles.progressCard}>
              <View style={styles.progressCardInner}>
                <View style={styles.progressTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.progressTitle}>Level {level}</Text>
                    <Text style={styles.progressSubtitle}>{xp} Total XP — {xpToNextLevel} to next lvl</Text>
                  </View>
                  <View style={styles.streakBadge}>
                    <Ionicons name="flame" size={16} color="#F97316" style={{ marginRight: 4 }} />
                    <Text style={styles.streakText}>{streak} days</Text>
                  </View>
                </View>
                <View style={styles.progressBarBg}>
                  <LinearGradient
                    colors={['#2DC7FF', '#00A3E0']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.progressBarFill, { width: `${progressPercent}%` }]}
                  />
                </View>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('Learn')}
                >
                  <LinearGradient
                    colors={['#2DC7FF', '#00A3E0']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.continueButton}
                  >
                    <Text style={styles.continueButtonText}>Continue Learning</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </BlurView>
          </Animatable.View>

          {/* Quick Actions */}
          <Animatable.View animation="fadeInUp" delay={250}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              {QUICK_ACTIONS.map((action, index) => (
                <Animatable.View
                  key={action.id}
                  animation="zoomIn"
                  delay={300 + index * 80}
                  style={styles.actionCardWrapper}
                >
                  <TouchableOpacity
                    style={styles.actionCard}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate(action.screen)}
                  >
                    <BlurView intensity={70} tint="light" style={styles.actionBlur}>
                      <View style={[styles.actionIconCircle, { backgroundColor: action.bg }]}>
                        <Ionicons name={action.icon} size={26} color={action.color} />
                      </View>
                      <Text style={styles.actionLabel}>{action.label}</Text>
                    </BlurView>
                  </TouchableOpacity>
                </Animatable.View>
              ))}
            </View>
          </Animatable.View>

          {/* Daily Signs */}
          <Animatable.View animation="fadeInUp" delay={500}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Daily Signs</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Dictionary')}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {DAILY_SIGNS.map((sign, index) => (
                <Animatable.View key={sign.id} animation="fadeInRight" delay={550 + index * 100}>
                  <TouchableOpacity 
                    style={styles.signCard} 
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate('Dictionary')}
                  >
                    <BlurView intensity={80} tint="light" style={styles.signBlur}>
                      <Ionicons name={sign.iconName} size={40} color="#2DC7FF" style={{ marginBottom: SPACING.sm }} />
                      <Text style={styles.signWord}>{sign.word}</Text>
                      <View style={styles.signCategoryBadge}>
                        <Text style={styles.signCategoryText}>{sign.category}</Text>
                      </View>
                    </BlurView>
                  </TouchableOpacity>
                </Animatable.View>
              ))}
            </ScrollView>
          </Animatable.View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  blobTop: {
    position: 'absolute',
    top: -100,
    left: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(45,199,255,0.12)',
  },
  blobRight: {
    position: 'absolute',
    top: 200,
    right: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(45,199,255,0.08)',
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  greeting: {
    ...TYPOGRAPHY.bodyLarge,
    color: COLORS.textSecondary,
    fontSize: 15,
  },
  userName: {
    ...TYPOGRAPHY.headlineLarge,
    color: COLORS.text,
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileAvatar: {
    borderRadius: 24,
    overflow: 'hidden',
    ...SHADOWS.glass,
  },
  avatarGradientRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeAvatarImage: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E8F8FF',
  },

  // Completed Lessons section above main progress card
  reviewSection: {
    marginBottom: SPACING.md,
    width: '100%',
  },
  reviewTitle: {
    ...TYPOGRAPHY.labelSmall,
    color: COLORS.textSecondary,
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 12,
  },
  reviewScroll: {
    flexDirection: 'row',
  },
  reviewBadge: {
    borderRadius: BORDER_RADIUS.pill,
    overflow: 'hidden',
    marginRight: 10,
    ...SHADOWS.soft,
  },
  reviewBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.85)',
  },
  reviewBadgeText: {
    ...TYPOGRAPHY.labelSmall,
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 11,
  },

  // Progress Card
  progressCard: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    marginBottom: SPACING.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.75)',
    ...SHADOWS.glass,
  },
  progressCardInner: {
    padding: SPACING.lg,
  },
  progressTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  progressTitle: {
    ...TYPOGRAPHY.headlineMedium,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  progressSubtitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,150,0,0.12)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.pill,
  },
  streakText: {
    ...TYPOGRAPHY.labelLarge,
    color: '#F97316',
    fontSize: 13,
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 10,
    backgroundColor: 'rgba(45,199,255,0.15)',
    borderRadius: BORDER_RADIUS.pill,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.pill,
  },
  continueButton: {
    borderRadius: BORDER_RADIUS.pill,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    ...SHADOWS.glass,
  },
  continueButtonText: {
    ...TYPOGRAPHY.labelLarge,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  // Section
  sectionTitle: {
    ...TYPOGRAPHY.headlineMedium,
    color: COLORS.text,
    marginBottom: SPACING.md,
    fontWeight: 'bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  seeAll: {
    ...TYPOGRAPHY.labelLarge,
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: 'bold',
  },
  // Quick Actions Grid
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -SPACING.xs / 2,
    marginBottom: SPACING.sm,
  },
  actionCardWrapper: {
    width: '50%',
    padding: SPACING.xs / 2,
    marginBottom: SPACING.sm,
  },
  actionCard: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.soft,
  },
  actionBlur: {
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.7)',
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  actionIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  actionLabel: {
    ...TYPOGRAPHY.labelLarge,
    color: COLORS.text,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  // Daily Signs
  signCard: {
    width: 130,
    marginRight: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.soft,
  },
  signBlur: {
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.7)',
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  signWord: {
    ...TYPOGRAPHY.labelLarge,
    color: COLORS.text,
    marginBottom: 6,
    fontWeight: 'bold',
  },
  signCategoryBadge: {
    backgroundColor: 'rgba(45,199,255,0.12)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.pill,
  },
  signCategoryText: {
    ...TYPOGRAPHY.labelLarge,
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: 'bold',
  },
  bellButton: {
    borderRadius: 20,
    marginRight: 10,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    ...SHADOWS.soft,
  },
  bellBlur: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
