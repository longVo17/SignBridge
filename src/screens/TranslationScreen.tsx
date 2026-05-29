import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../theme/theme';

const { width, height } = Dimensions.get('window');

export const TranslationScreen = () => {
  const [facing, setFacing] = useState<CameraType>('front');
  const [permission, requestPermission] = useCameraPermissions();
  const [isTranslating, setIsTranslating] = useState(true);
  const [savedCount, setSavedCount] = useState(0);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <LinearGradient colors={['#E8F8FF', '#F0FBFF', '#FAFEFF']} style={styles.container}>
        <SafeAreaView style={styles.permissionSafe}>
          <BlurView intensity={85} tint="light" style={styles.permissionCard}>
            <Ionicons name="videocam-outline" size={56} color="#2DC7FF" style={{ marginBottom: SPACING.md }} />
            <Text style={styles.permissionTitle}>Camera Access Needed</Text>
            <Text style={styles.permissionMsg}>
              SignBridge needs camera access to translate your sign language in real time.
            </Text>
            <TouchableOpacity activeOpacity={0.85} onPress={requestPermission}>
              <LinearGradient colors={['#2DC7FF', '#00A3E0']} style={styles.grantButton}>
                <Text style={styles.grantButtonText}>Grant Permission</Text>
              </LinearGradient>
            </TouchableOpacity>
          </BlurView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  function toggleFacing() {
    setFacing(c => (c === 'back' ? 'front' : 'back'));
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing}>
        <SafeAreaView style={styles.overlay}>

          {/* Top Controls */}
          <Animatable.View animation="fadeInDown" delay={200} style={styles.topControls}>
            {/* Screen Title Pill */}
            <BlurView intensity={75} tint="light" style={styles.titlePill}>
              <Text style={styles.titlePillText}>Live Translation</Text>
            </BlurView>

            {/* Control Buttons */}
            <View style={styles.topButtonGroup}>
              <TouchableOpacity style={styles.topBtn} onPress={toggleFacing}>
                <Ionicons name="camera-reverse" size={22} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.topBtn}>
                <Ionicons name="flash-off" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </Animatable.View>

          {/* AI Frame Indicator */}
          <View style={styles.frameCenter}>
            <View style={styles.frameBox}>
              <View style={[styles.fc, styles.fcTL]} />
              <View style={[styles.fc, styles.fcTR]} />
              <View style={[styles.fc, styles.fcBL]} />
              <View style={[styles.fc, styles.fcBR]} />
            </View>
            {isTranslating && (
              <Animatable.View animation="pulse" iterationCount="infinite" style={styles.scanLine} />
            )}
          </View>

          {/* Translation Panel (Bottom) */}
          <Animatable.View animation="fadeInUpBig" duration={700} delay={200} style={styles.panelContainer}>
            <BlurView intensity={85} tint="light" style={styles.panel}>
              {/* Status row */}
              <View style={styles.panelHeader}>
                <View style={styles.statusRow}>
                  <Animatable.View
                    animation={isTranslating ? 'pulse' : undefined}
                    iterationCount="infinite"
                    style={[styles.statusDot, { backgroundColor: isTranslating ? '#22C55E' : COLORS.textSecondary }]}
                  />
                  <Text style={styles.statusText}>{isTranslating ? 'Translating...' : 'Paused'}</Text>
                </View>
                <TouchableOpacity onPress={() => setIsTranslating(!isTranslating)}>
                  <Ionicons
                    name={isTranslating ? 'pause-circle' : 'play-circle'}
                    size={32}
                    color={COLORS.primary}
                  />
                </TouchableOpacity>
              </View>

              {/* Result */}
              <View style={styles.resultBox}>
                <Text style={styles.resultText}>Hello, how are you?</Text>
                <Text style={styles.resultHint}>Make a sign to see the translation here.</Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionChip} activeOpacity={0.8}>
                  <LinearGradient colors={['#2DC7FF', '#00A3E0']} style={styles.actionChipGradient}>
                    <Ionicons name="volume-high" size={16} color="#FFFFFF" />
                    <Text style={styles.actionChipText}>Speak</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionChip} activeOpacity={0.8}>
                  <LinearGradient colors={['#2DC7FF', '#00A3E0']} style={styles.actionChipGradient}>
                    <Ionicons name="copy" size={16} color="#FFFFFF" />
                    <Text style={styles.actionChipText}>Copy</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionChip}
                  activeOpacity={0.8}
                  onPress={() => setSavedCount(c => c + 1)}
                >
                  <LinearGradient colors={['#2DC7FF', '#00A3E0']} style={styles.actionChipGradient}>
                    <Ionicons name="bookmark" size={16} color="#FFFFFF" />
                    <Text style={styles.actionChipText}>Save {savedCount > 0 ? `(${savedCount})` : ''}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </BlurView>
          </Animatable.View>

        </SafeAreaView>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.text,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  // Permission screen
  permissionSafe: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  permissionCard: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.75)',
    ...SHADOWS.soft,
  },
  permissionEmoji: {
    fontSize: 56,
    marginBottom: SPACING.md,
  },
  permissionTitle: {
    ...TYPOGRAPHY.headlineMedium,
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  permissionMsg: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  grantButton: {
    paddingVertical: 14,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.pill,
    ...SHADOWS.glass,
  },
  grantButtonText: {
    ...TYPOGRAPHY.labelLarge,
    color: '#FFFFFF',
    fontSize: 16,
  },
  // Top controls
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  titlePill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.pill,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  titlePillText: {
    ...TYPOGRAPHY.labelLarge,
    color: '#FFFFFF',
    fontSize: 13,
  },
  topButtonGroup: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  topBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  // AI Frame
  frameCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  frameBox: {
    width: 200,
    height: 240,
  },
  fc: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#2DC7FF',
  },
  fcTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 6 },
  fcTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 6 },
  fcBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 6 },
  fcBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 6 },
  scanLine: {
    position: 'absolute',
    width: 200,
    height: 2,
    backgroundColor: 'rgba(45,199,255,0.7)',
    borderRadius: 1,
  },
  // Panel
  panelContainer: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  panel: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
    ...SHADOWS.glass,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(45,199,255,0.1)',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    ...TYPOGRAPHY.labelLarge,
    color: COLORS.text,
    fontSize: 13,
  },
  resultBox: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    minHeight: 80,
  },
  resultText: {
    ...TYPOGRAPHY.headlineMedium,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  resultHint: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  actionChip: {
    borderRadius: BORDER_RADIUS.pill,
    overflow: 'hidden',
    ...SHADOWS.glass,
  },
  actionChipGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.pill,
    gap: 6,
  },
  actionChipText: {
    ...TYPOGRAPHY.labelLarge,
    color: '#FFFFFF',
    fontSize: 13,
  },
});
