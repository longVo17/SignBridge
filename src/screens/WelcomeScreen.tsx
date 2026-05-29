import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { BlurView } from 'expo-blur';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../theme/theme';

const { width, height } = Dimensions.get('window');

// A reliable placeholder video, ASL or generic
const BACKGROUND_VIDEO_URL = 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4'; 
// You can replace this with a local asset like: require('../../assets/welcome-bg.mp4')

export default function WelcomeScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      {/* 1. Fullscreen Video Background */}
      <Video
        source={{ uri: BACKGROUND_VIDEO_URL }}
        style={StyleSheet.absoluteFillObject}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
        isMuted
      />

      {/* 2. Light Liquid Glass Overlay */}
      <BlurView 
        intensity={70} 
        tint="light" 
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Additional translucent white overlay to enforce light theme */}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(255, 255, 255, 0.4)' }]} />

      <View style={styles.contentContainer}>
        {/* Top Spacer */}
        <View style={styles.topSpacer} />

        {/* Logo and Title Section */}
        <View style={styles.centerSection}>
          <Animatable.View animation="fadeInDown" duration={1000} delay={300} style={styles.iconContainer}>
            <View style={styles.iconGlass}>
              <Ionicons name="hand-left-outline" size={64} color={COLORS.primary} />
            </View>
          </Animatable.View>

          <Animatable.Text 
            animation="fadeInUp" 
            duration={1000} 
            delay={500} 
            style={styles.title}
          >
            SIGN<Text style={styles.titleHighlight}>BRIDGE</Text>
          </Animatable.Text>

          <Animatable.Text 
            animation="fadeInUp" 
            duration={1000} 
            delay={700} 
            style={styles.subtitle}
          >
            Break the silence. Bridge the gap. Learn Sign Language with AI.
          </Animatable.Text>
        </View>

        {/* Bottom CTA Section */}
        <Animatable.View 
          animation="fadeInUp" 
          duration={1000} 
          delay={1000} 
          style={styles.bottomSection}
        >
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => navigation.replace('Login')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={24} color={COLORS.surface} />
          </TouchableOpacity>
        </Animatable.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background, // Fallback
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxl * 1.5,
  },
  topSpacer: {
    flex: 1,
  },
  centerSection: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSection: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '100%',
    paddingBottom: SPACING.xl,
  },
  iconContainer: {
    marginBottom: SPACING.lg,
    ...SHADOWS.glass,
  },
  iconGlass: {
    width: 120,
    height: 120,
    borderRadius: BORDER_RADIUS.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  title: {
    ...TYPOGRAPHY.displayLarge,
    color: '#1E293B', // Dark Slate as requested
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  titleHighlight: {
    color: COLORS.primary,
  },
  subtitle: {
    ...TYPOGRAPHY.bodyLarge,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.md,
    lineHeight: 28,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.glass,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
  },
  primaryButtonText: {
    ...TYPOGRAPHY.labelLarge,
    fontSize: 18,
    color: COLORS.surface,
    marginRight: SPACING.sm,
  },
});
