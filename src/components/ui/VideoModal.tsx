import React, { useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  Dimensions, Animated, TouchableWithoutFeedback, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Sign } from '../../types/data.types';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/theme';
import { getVideoAsset } from '../../utils/videoMap';
import VideoPlayerCard from './VideoPlayerCard';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ─── Props ───────────────────────────────────────────────────────────────────
interface VideoModalProps {
  sign: Sign | null;
  visible: boolean;
  onClose: () => void;
  /** called when user taps "Đã học xong" — used in learn context */
  onComplete?: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function VideoModal({ sign, visible, onClose, onComplete }: VideoModalProps) {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const handleShow = () => {
    Animated.spring(scaleAnim, {
      toValue: 1, tension: 100, friction: 8, useNativeDriver: true,
    }).start();
  };

  const handleClose = useCallback(() => {
    Animated.timing(scaleAnim, {
      toValue: 0.9, duration: 150, useNativeDriver: true,
    }).start(onClose);
  }, [onClose, scaleAnim]);

  if (!sign) return null;

  const localAsset = getVideoAsset(sign.id);
  const cloudUrl = sign.videoURL || undefined;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      onShow={handleShow}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>

              {/* ── Header ─────────────────────────────────────── */}
              <View style={styles.header}>
                <View style={styles.emojiWrap}>
                  <Ionicons name="school-outline" size={24} color="#2DC7FF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{sign.title}</Text>
                  <View style={styles.pills}>
                    <Pill label={sign.category} color={COLORS.primary} />
                    <Pill label={sign.difficulty} color={getDiffColor(sign.difficulty)} />
                  </View>
                </View>
                <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* ── Video player with speed + guide ─────────── */}
              <View style={styles.playerWrap}>
                <VideoPlayerCard
                  source={localAsset}
                  sourceUrl={cloudUrl}
                  height={SCREEN_W * 0.52}
                  guideText={sign.description}
                />
              </View>

              {/* ── Description ───────────────────────────────── */}
              <ScrollView
                style={styles.descWrap}
                contentContainerStyle={{ paddingBottom: 24 }}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.descLabel}>Description</Text>
                <Text style={styles.desc}>{sign.description}</Text>
              </ScrollView>

              {/* ── Complete button (nếu có context học) ──── */}
              {onComplete && (
                <TouchableOpacity
                  style={styles.completeBtn}
                  onPress={() => { handleClose(); onComplete?.(); }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.completeBtnText}>Đã học xong từ này</Text>
                </TouchableOpacity>
              )}

            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function Pill({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: color + '20', borderColor: color + '50' }]}>
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

function getDiffColor(d: string) {
  switch (d) {
    case 'Easy': return '#22C55E';
    case 'Medium': return '#F59E0B';
    case 'Hard': return '#EF4444';
    default: return COLORS.textSecondary;
  }
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.sm,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.lg,
    width: SCREEN_W - 32,
    maxHeight: SCREEN_H * 0.9,
    overflow: 'hidden',
    ...SHADOWS.glass,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  emojiWrap: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: COLORS.surfaceHighlight,
    justifyContent: 'center', alignItems: 'center',
  },
  emoji: { fontSize: 24 },
  title: { ...TYPOGRAPHY.headlineMedium, color: COLORS.text, fontSize: 20, lineHeight: 26 },
  pills: { flexDirection: 'row', gap: 6, marginTop: 4 },
  pill: {
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm, borderWidth: 1,
  },
  pillText: { ...TYPOGRAPHY.labelSmall, fontWeight: '600', fontSize: 10 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.surfaceHighlight,
    justifyContent: 'center', alignItems: 'center',
  },

  // Video player
  playerWrap: {
    padding: SPACING.sm,
    paddingBottom: 4,
    backgroundColor: '#0D1117',
  },

  // Description
  descWrap: {
    padding: SPACING.sm,
    maxHeight: 110,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  descLabel: { ...TYPOGRAPHY.labelLarge, color: COLORS.text, marginBottom: 6 },
  desc: { ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary, lineHeight: 20 },

  // Complete button
  completeBtn: {
    margin: SPACING.sm,
    marginTop: 4,
    backgroundColor: '#22C55E',
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  completeBtnText: {
    ...TYPOGRAPHY.labelLarge,
    color: '#FFF',
    fontSize: 15,
  },
});
