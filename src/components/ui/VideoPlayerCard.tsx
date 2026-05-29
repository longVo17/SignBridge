import React, { useRef, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Animated, Dimensions,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../theme/theme';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Speed option type ──────────────────────────────────────────────────────
export type PlaybackSpeed = 0.5 | 0.75 | 1.0 | 1.5;
const SPEED_OPTIONS: PlaybackSpeed[] = [0.5, 0.75, 1.0, 1.5];
const SPEED_LABELS: Record<PlaybackSpeed, string> = {
  0.5: '0.5×',
  0.75: '0.75×',
  1.0: '1×',
  1.5: '1.5×',
};

// ─── Props ──────────────────────────────────────────────────────────────────
interface VideoPlayerCardProps {
  /** video source via require() */
  source: any;
  /** video from URL (Cloudinary) */
  sourceUrl?: string;
  /** height of the player area */
  height?: number;
  /** whether guide overlay button should show */
  guideText?: string;
  /** compact mode: hide speed label text, only show icons */
  compact?: boolean;
  /** auto play on mount */
  autoPlay?: boolean;
}

// ─── Component ──────────────────────────────────────────────────────────────
export default function VideoPlayerCard({
  source,
  sourceUrl,
  height,
  guideText,
  compact = false,
  autoPlay = false,
}: VideoPlayerCardProps) {
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1.0);
  const [showGuide, setShowGuide] = useState(false);
  const guideAnim = useRef(new Animated.Value(0)).current;

  const playerH = height ?? SCREEN_W * (9 / 16);

  const isLoaded = status?.isLoaded ?? false;
  const isPlaying = isLoaded && (status as any)?.isPlaying;
  const isBuffering = isLoaded && (status as any)?.isBuffering;

  const videoSource = sourceUrl
    ? { uri: sourceUrl }
    : source ?? null;

  const hasVideo = videoSource !== null;

  // ── Playback toggle ───────────────────────────────────────────────
  const togglePlay = useCallback(async () => {
    if (!videoRef.current || !isLoaded) return;
    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
  }, [isLoaded, isPlaying]);

  // ── Replay ───────────────────────────────────────────────────────
  const replay = useCallback(async () => {
    if (!videoRef.current) return;
    await videoRef.current.replayAsync();
  }, []);

  // ── Speed change ─────────────────────────────────────────────────
  const changeSpeed = useCallback(async (newSpeed: PlaybackSpeed) => {
    setSpeed(newSpeed);
    if (videoRef.current && isLoaded) {
      await videoRef.current.setRateAsync(newSpeed, true);
    }
  }, [isLoaded]);

  // ── Guide overlay toggle ──────────────────────────────────────────
  const toggleGuide = useCallback(() => {
    if (showGuide) {
      Animated.timing(guideAnim, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => setShowGuide(false));
    } else {
      setShowGuide(true);
      Animated.timing(guideAnim, { toValue: 1, duration: 280, useNativeDriver: true }).start();
    }
  }, [showGuide, guideAnim]);

  return (
    <View style={styles.root}>
      {/* ── Video area ─────────────────────────────────────────── */}
      <View style={[styles.videoWrap, { height: playerH }]}>
        {hasVideo ? (
          <>
            <Video
              ref={videoRef}
              source={videoSource}
              style={styles.video}
              resizeMode={ResizeMode.COVER}
              isLooping
              shouldPlay={autoPlay}
              useNativeControls={false}
              onPlaybackStatusUpdate={(s) => setStatus(s)}
            />

            {/* Buffering spinner */}
            {isBuffering && (
              <View style={styles.bufferLayer}>
                <ActivityIndicator size="large" color="#FFF" />
              </View>
            )}

            {/* Tap-to-play overlay */}
            {!isPlaying && !isBuffering && (
              <TouchableOpacity style={styles.tapLayer} onPress={togglePlay} activeOpacity={1}>
                <View style={styles.playCircle}>
                  <Ionicons name="play" size={30} color={COLORS.primary} />
                </View>
              </TouchableOpacity>
            )}

            {/* Top-right guide button (only when guideText is present) */}
            {guideText ? (
              <TouchableOpacity style={styles.guideBtn} onPress={toggleGuide}>
                <Ionicons name={showGuide ? 'close-circle' : 'information-circle'} size={28} color="#FFF" />
              </TouchableOpacity>
            ) : null}

            {/* Guide overlay */}
            {showGuide && (
              <Animated.View
                style={[
                  styles.guideOverlay,
                  { opacity: guideAnim, transform: [{ scale: guideAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }] },
                ]}
              >
                <LinearGradient
                  colors={['rgba(0,0,0,0.75)', 'rgba(0,0,0,0.92)']}
                  style={styles.guideContent}
                >
                  <Ionicons name="hand-left-outline" size={32} color={COLORS.primary} style={{ marginBottom: 10 }} />
                  <Text style={styles.guideTitle}>📖 Hướng dẫn động tác</Text>
                  <Text style={styles.guideBody}>{guideText}</Text>
                  <TouchableOpacity style={styles.guideClose} onPress={toggleGuide}>
                    <Text style={styles.guideCloseText}>Đã hiểu ✓</Text>
                  </TouchableOpacity>
                </LinearGradient>
              </Animated.View>
            )}
          </>
        ) : (
          <View style={styles.noVideo}>
            <Ionicons name="videocam-off-outline" size={40} color="rgba(255,255,255,0.4)" />
            <Text style={styles.noVideoText}>Chưa có video</Text>
          </View>
        )}
      </View>

      {/* ── Controls bar ───────────────────────────────────────── */}
      {compact ? (
        <View style={styles.compactControls}>
          <TouchableOpacity
            style={styles.compactBtn}
            onPress={togglePlay}
            disabled={!hasVideo || !isLoaded}
            activeOpacity={0.8}
          >
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={16} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.compactBtn} onPress={replay} disabled={!hasVideo}>
            <Ionicons name="refresh" size={16} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.controls}>
          {/* Play / Pause */}
          <TouchableOpacity
            style={styles.playBtn}
            onPress={togglePlay}
            disabled={!hasVideo || !isLoaded}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={isPlaying ? ['#FF6B6B', '#E85D5D'] : ['#2DC7FF', '#00A3E0']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.playBtnGrad}
            >
              <Ionicons name={isPlaying ? 'pause' : 'play'} size={18} color="#FFF" />
              <Text style={styles.playBtnText}>{isPlaying ? 'Dừng' : 'Phát'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Replay */}
          <TouchableOpacity style={styles.iconBtn} onPress={replay} disabled={!hasVideo}>
            <Ionicons name="refresh" size={20} color={COLORS.text} />
          </TouchableOpacity>

          {/* Speed selector */}
          <View style={styles.speedGroup}>
            {SPEED_OPTIONS.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.speedChip, speed === s && styles.speedChipActive]}
                onPress={() => changeSpeed(s)}
              >
                <Text style={[styles.speedText, speed === s && styles.speedTextActive]}>
                  {SPEED_LABELS[s]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { width: '100%' },

  // Compact controls (for flashcard mode)
  compactControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 6,
    marginTop: 4,
  },
  compactBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(45,199,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(45,199,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Video
  videoWrap: {
    width: '100%',
    backgroundColor: '#0D1117',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: BORDER_RADIUS.md,
  },
  video: { width: '100%', height: '100%' },
  bufferLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  tapLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  playCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 4,
  },

  // Guide button
  guideBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
  },

  // Guide overlay
  guideOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  guideContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
    gap: 8,
  },
  guideTitle: {
    ...TYPOGRAPHY.labelLarge,
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
  },
  guideBody: {
    ...TYPOGRAPHY.bodyMedium,
    color: 'rgba(255,255,255,0.88)',
    lineHeight: 24,
    textAlign: 'center',
    fontSize: 15,
  },
  guideClose: {
    marginTop: 12,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.pill,
  },
  guideCloseText: {
    ...TYPOGRAPHY.labelLarge,
    color: '#FFF',
  },

  // No video
  noVideo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  noVideoText: {
    ...TYPOGRAPHY.bodySmall,
    color: 'rgba(255,255,255,0.45)',
  },

  // Controls bar
  controls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
    gap: 8,
    marginTop: 6,
  },
  playBtn: {
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    minWidth: 80,
  },
  playBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 6,
  },
  playBtnText: {
    ...TYPOGRAPHY.labelMedium,
    color: '#FFF',
    fontSize: 13,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  speedGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  speedChip: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  speedChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  speedText: {
    ...TYPOGRAPHY.labelSmall,
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  speedTextActive: {
    color: '#FFF',
  },
});
