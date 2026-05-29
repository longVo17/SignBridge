import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../theme/theme';

const { width } = Dimensions.get('window');

export default function LessonSummaryScreen({ route, navigation }: any) {
  const { masteredCount, totalCount, pathTitle = 'Lesson' } = route.params || { masteredCount: 0, totalCount: 7 };

  const percentage = totalCount > 0 ? Math.round((masteredCount / totalCount) * 100) : 0;

  const showRight = percentage >= 25;
  const showBottom = percentage >= 50;
  const showLeft = percentage >= 75;

  return (
    <LinearGradient colors={['#E8F8FF', '#F0FBFF', '#FAFEFF']} style={styles.container}>
      <View style={styles.blobTL} />
      <View style={styles.blobBR} />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.content}>
          
          {/* Header */}
          <Animatable.View animation="fadeInDown" duration={600} style={styles.header}>
            <Ionicons name="sparkles" size={32} color="#2DC7FF" style={{ marginBottom: 12 }} />
            <Text style={styles.title}>Review Complete!</Text>
            <Text style={styles.subtitle}>{pathTitle}</Text>
          </Animatable.View>

          {/* Calculated Segment Circular Chart (Pure Native calculated border-radius paths) */}
          <Animatable.View animation="zoomIn" duration={800} style={styles.chartWrapper}>
            <BlurView intensity={70} tint="light" style={styles.glassCard}>
              <View style={[
                styles.circle,
                {
                  borderColor: 'rgba(45,199,255,0.12)',
                  borderTopColor: '#2DC7FF',
                  borderRightColor: showRight ? '#2DC7FF' : 'rgba(45,199,255,0.12)',
                  borderBottomColor: showBottom ? '#2DC7FF' : 'rgba(45,199,255,0.12)',
                  borderLeftColor: showLeft ? '#2DC7FF' : 'rgba(45,199,255,0.12)',
                }
              ]}>
                <View style={styles.innerCircle}>
                  <Text style={styles.percentageText}>{percentage}%</Text>
                  <Text style={styles.labelText}>Mastered</Text>
                </View>
              </View>
            </BlurView>
          </Animatable.View>

          {/* Stats Description */}
          <Animatable.View animation="fadeInUp" duration={700} delay={300} style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Ionicons name="checkmark-circle-outline" size={24} color="#22C55E" />
              <Text style={styles.statVal}>{masteredCount}</Text>
              <Text style={styles.statLbl}>Mastered</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Ionicons name="repeat-outline" size={24} color="#F59E0B" />
              <Text style={styles.statVal}>{totalCount - masteredCount}</Text>
              <Text style={styles.statLbl}>Still Learning</Text>
            </View>
          </Animatable.View>

          {/* Bottom Button */}
          <Animatable.View animation="fadeInUp" duration={700} delay={500} style={styles.btnWrapper}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.primaryButton}
              onPress={() => navigation.navigate('MainApp', { screen: 'Learn' })}
            >
              <Text style={styles.btnText}>Back to Path</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </Animatable.View>

        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxl,
  },
  header: {
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  title: {
    ...TYPOGRAPHY.headlineLarge,
    color: COLORS.text,
    fontSize: 28,
  },
  subtitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.xl,
  },
  glassCard: {
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.8)',
    ...SHADOWS.glass,
    overflow: 'hidden',
  },
  circle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    width: 154,
    height: 154,
    borderRadius: 77,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageText: {
    ...TYPOGRAPHY.headlineLarge,
    color: COLORS.primary,
    fontSize: 38,
    fontWeight: 'bold',
  },
  labelText: {
    ...TYPOGRAPHY.labelSmall,
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.75)',
    paddingVertical: SPACING.md,
    ...SHADOWS.sm,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    ...TYPOGRAPHY.headlineMedium,
    color: COLORS.text,
    fontSize: 20,
    marginTop: 6,
  },
  statLbl: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(200,220,235,0.6)',
  },
  btnWrapper: {
    marginBottom: SPACING.md,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.pill,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.glass,
  },
  btnText: {
    ...TYPOGRAPHY.labelLarge,
    color: '#FFFFFF',
    fontSize: 16,
  },
});
