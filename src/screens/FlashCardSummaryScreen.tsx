import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../theme/theme';

const { width: SCREEN_W } = Dimensions.get('window');

interface SignSummary {
  id: string;
  title: string;
}

interface RouteParams {
  pathId: string;
  pathTitle: string;
  masteredSigns: SignSummary[];
  unmasteredSigns: SignSummary[];
  totalCount: number;
}

export default function FlashCardSummaryScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {
    pathId,
    pathTitle = 'Lesson',
    masteredSigns = [],
    unmasteredSigns = [],
    totalCount = 0,
  } = (route.params as RouteParams) || {};

  const percentage = totalCount > 0 ? Math.round((masteredSigns.length / totalCount) * 100) : 0;
  const isPerfect = percentage === 100;

  // Circular chart segments
  const showRight = percentage >= 25;
  const showBottom = percentage >= 50;
  const showLeft = percentage >= 75;

  const renderSignItem = ({ item, index }: { item: SignSummary; index: number }) => null;

  return (
    <LinearGradient colors={['#E8F8FF', '#F0FBFF', '#FAFEFF']} style={styles.container}>
      <View style={styles.blobTL} />
      <View style={styles.blobBR} />

      <SafeAreaView style={{ flex: 1 }}>
        <FlatList
          data={[]}
          renderItem={renderSignItem}
          keyExtractor={() => 'dummy'}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          ListHeaderComponent={
            <>
              {/* Header */}
              <Animatable.View animation="fadeInDown" duration={600} style={styles.header}>
                {isPerfect ? (
                  <Ionicons name="trophy" size={36} color="#F59E0B" style={{ marginBottom: 8 }} />
                ) : (
                  <Ionicons name="sparkles" size={32} color="#2DC7FF" style={{ marginBottom: 8 }} />
                )}
                <Text style={styles.title}>
                  {isPerfect ? 'Perfect Review!' : 'Review Complete!'}
                </Text>
                <Text style={styles.subtitle}>{pathTitle}</Text>
              </Animatable.View>

              {/* Circular chart */}
              <Animatable.View animation="zoomIn" duration={800} style={styles.chartWrapper}>
                <BlurView intensity={70} tint="light" style={styles.glassCard}>
                  <View
                    style={[
                      styles.circle,
                      {
                        borderColor: 'rgba(45,199,255,0.12)',
                        borderTopColor: '#2DC7FF',
                        borderRightColor: showRight ? '#2DC7FF' : 'rgba(45,199,255,0.12)',
                        borderBottomColor: showBottom ? '#2DC7FF' : 'rgba(45,199,255,0.12)',
                        borderLeftColor: showLeft ? '#2DC7FF' : 'rgba(45,199,255,0.12)',
                      },
                    ]}
                  >
                    <View style={styles.innerCircle}>
                      <Text style={styles.percentageText}>{percentage}%</Text>
                      <Text style={styles.labelText}>Mastered</Text>
                    </View>
                  </View>
                </BlurView>
              </Animatable.View>

              {/* Stats Row */}
              <Animatable.View animation="fadeInUp" duration={700} delay={200} style={styles.statsContainer}>
                <View style={styles.statBox}>
                  <Ionicons name="checkmark-circle-outline" size={24} color="#22C55E" />
                  <Text style={styles.statVal}>{masteredSigns.length}</Text>
                  <Text style={styles.statLbl}>Mastered</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Ionicons name="repeat-outline" size={24} color="#F59E0B" />
                  <Text style={styles.statVal}>{unmasteredSigns.length}</Text>
                  <Text style={styles.statLbl}>Still Learning</Text>
                </View>
              </Animatable.View>

              {/* Mastered List */}
              {masteredSigns.length > 0 && (
                <Animatable.View animation="fadeInUp" duration={700} delay={350}>
                  <Text style={styles.sectionTitle}>
                    <Ionicons name="checkmark-circle" size={16} color="#22C55E" /> Mastered Words
                  </Text>
                  <View style={styles.wordListCard}>
                    {masteredSigns.map((sign, i) => (
                      <View
                        key={sign.id}
                        style={[styles.wordItem, i < masteredSigns.length - 1 && styles.wordItemBorder]}
                      >
                        <View style={[styles.wordDot, { backgroundColor: '#22C55E' }]} />
                        <Text style={styles.wordText}>{sign.title}</Text>
                        <Ionicons name="checkmark" size={16} color="#22C55E" />
                      </View>
                    ))}
                  </View>
                </Animatable.View>
              )}

              {/* Unmastered List */}
              {unmasteredSigns.length > 0 && (
                <Animatable.View animation="fadeInUp" duration={700} delay={450}>
                  <Text style={styles.sectionTitle}>
                    <Ionicons name="repeat" size={16} color="#F59E0B" /> Still Learning
                  </Text>
                  <View style={styles.wordListCard}>
                    {unmasteredSigns.map((sign, i) => (
                      <View
                        key={sign.id}
                        style={[styles.wordItem, i < unmasteredSigns.length - 1 && styles.wordItemBorder]}
                      >
                        <View style={[styles.wordDot, { backgroundColor: '#F59E0B' }]} />
                        <Text style={styles.wordText}>{sign.title}</Text>
                        <Ionicons name="refresh" size={16} color="#F59E0B" />
                      </View>
                    ))}
                  </View>
                </Animatable.View>
              )}
            </>
          }
          ListFooterComponent={
            <Animatable.View animation="fadeInUp" duration={700} delay={550} style={styles.btnWrapper}>
              {/* Continue with Unmastered */}
              {unmasteredSigns.length > 0 && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.continueButton}
                  onPress={() =>
                    navigation.replace('FlashCardReview', {
                      pathId,
                      pathTitle,
                      resumeUnmastered: true,
                    })
                  }
                >
                  <LinearGradient
                    colors={['#F59E0B', '#D97706']}
                    style={styles.continueBtnGrad}
                  >
                    <Ionicons name="play-forward" size={18} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={styles.btnText}>
                      Continue with {unmasteredSigns.length} Unmastered
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              {/* Back to Path */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.primaryButton}
                onPress={() => navigation.navigate('MainApp', { screen: 'Learn' })}
              >
                <Text style={styles.btnTextPrimary}>Back to Learning Path</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            </Animatable.View>
          }
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  blobTL: {
    position: 'absolute', top: -100, left: -80,
    width: 250, height: 250, borderRadius: 125,
    backgroundColor: 'rgba(45,199,255,0.12)',
  },
  blobBR: {
    position: 'absolute', bottom: -60, right: -60,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(45,199,255,0.08)',
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xxl,
  },

  // Header
  header: { alignItems: 'center', marginBottom: SPACING.md },
  title: { ...TYPOGRAPHY.headlineLarge, color: COLORS.text, fontSize: 26 },
  subtitle: { ...TYPOGRAPHY.bodyMedium, color: COLORS.textSecondary, marginTop: 4 },

  // Chart
  chartWrapper: { alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.lg },
  glassCard: {
    padding: SPACING.lg, borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.8)',
    ...SHADOWS.glass, overflow: 'hidden',
  },
  circle: {
    width: 160, height: 160, borderRadius: 80,
    borderWidth: 12, justifyContent: 'center', alignItems: 'center',
  },
  innerCircle: {
    width: 134, height: 134, borderRadius: 67,
    backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center',
  },
  percentageText: {
    ...TYPOGRAPHY.headlineLarge, color: COLORS.primary,
    fontSize: 36, fontWeight: 'bold',
  },
  labelText: {
    ...TYPOGRAPHY.labelSmall, color: COLORS.textSecondary, fontSize: 11, marginTop: 2,
  },

  // Stats
  statsContainer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.65)', borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.75)',
    paddingVertical: SPACING.md, marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statVal: { ...TYPOGRAPHY.headlineMedium, color: COLORS.text, fontSize: 20, marginTop: 6 },
  statLbl: { ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary, fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, height: 40, backgroundColor: 'rgba(200,220,235,0.6)' },

  // Section titles
  sectionTitle: {
    ...TYPOGRAPHY.labelLarge, color: COLORS.text, fontSize: 14,
    marginBottom: 8, marginTop: 4,
  },

  // Word lists
  wordListCard: {
    backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.85)',
    overflow: 'hidden', marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  wordItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: SPACING.md,
  },
  wordItemBorder: {
    borderBottomWidth: 1, borderBottomColor: 'rgba(200,220,235,0.3)',
  },
  wordDot: {
    width: 8, height: 8, borderRadius: 4, marginRight: 12,
  },
  wordText: {
    ...TYPOGRAPHY.bodyMedium, color: COLORS.text, flex: 1, fontSize: 15,
  },

  // Buttons
  btnWrapper: { marginTop: SPACING.sm, gap: 12, marginBottom: SPACING.md },
  continueButton: {
    borderRadius: BORDER_RADIUS.pill, overflow: 'hidden', ...SHADOWS.glass,
  },
  continueBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, borderRadius: BORDER_RADIUS.pill,
  },
  primaryButton: {
    backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.pill,
    paddingVertical: 16, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    ...SHADOWS.glass,
  },
  btnText: { ...TYPOGRAPHY.labelLarge, color: '#FFF', fontSize: 15 },
  btnTextPrimary: { ...TYPOGRAPHY.labelLarge, color: '#FFFFFF', fontSize: 15 },
});
