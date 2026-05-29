import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Video, ResizeMode } from 'expo-av';
import { Sign } from '../../types/data.types';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, TYPOGRAPHY } from '../../theme/theme';
import { getVideoAsset } from '../../utils/videoMap';

const { width } = Dimensions.get('window');

interface QuizQuestion {
  sign: Sign;           // The correct answer
  options: Sign[];      // 4 options including correct one (shuffled)
}

interface QuizCardProps {
  question: QuizQuestion;
  questionIndex: number;
  totalQuestions: number;
  onAnswer: (isCorrect: boolean) => void;
}

type AnswerState = 'unanswered' | 'correct' | 'wrong';

const QuizCard: React.FC<QuizCardProps> = ({
  question, questionIndex, totalQuestions, onAnswer,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>('unanswered');
  const [videoLoaded, setVideoLoaded] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setSelectedId(null);
    setAnswerState('unanswered');
    setVideoLoaded(false);
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, [question.sign.id]);

  const handleSelect = (sign: Sign) => {
    if (answerState !== 'unanswered') return;

    const isCorrect = sign.id === question.sign.id;
    setSelectedId(sign.id);
    setAnswerState(isCorrect ? 'correct' : 'wrong');

    if (!isCorrect) {
      // Shake animation for wrong answer
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
    }

    // Auto-advance after a short delay
    setTimeout(() => {
      fadeAnim.setValue(0);
      onAnswer(isCorrect);
    }, 1500);
  };

  const getOptionStyle = (sign: Sign) => {
    if (selectedId === null) return styles.optionDefault;
    if (sign.id === question.sign.id) return styles.optionCorrect;
    if (sign.id === selectedId) return styles.optionWrong;
    return styles.optionDimmed;
  };

  const getOptionTextStyle = (sign: Sign): any => {
    if (selectedId === null) return styles.optionText;
    if (sign.id === question.sign.id) return [styles.optionText, { color: '#16A34A', fontWeight: 'bold' }];
    if (sign.id === selectedId) return [styles.optionText, { color: '#DC2626', fontWeight: 'bold' }];
    return [styles.optionText, { opacity: 0.5 }];
  };

  // Resolve video source
  const localAsset = getVideoAsset(question.sign.id);
  const cloudUrl = question.sign.videoURL || undefined;
  const videoSource = cloudUrl ? { uri: cloudUrl } : localAsset;

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fadeAnim, transform: [{ translateX: shakeAnim }] },
      ]}
    >
      {/* Question Header */}
      <View style={styles.questionHeader}>
        <Text style={styles.questionCounter}>Question {questionIndex + 1} / {totalQuestions}</Text>
        <Text style={styles.questionType}>Quiz</Text>
      </View>

      {/* Looping Gesture Video Card */}
      <View style={styles.videoCard}>
        {videoSource ? (
          <>
            <Video
              source={videoSource}
              style={styles.video}
              resizeMode={ResizeMode.COVER}
              isLooping
              shouldPlay
              useNativeControls={false}
              onLoad={() => setVideoLoaded(true)}
            />
            {!videoLoaded && (
              <View style={styles.loaderWrap}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            )}
          </>
        ) : (
          <View style={styles.noVideo}>
            <Ionicons name="videocam-off-outline" size={40} color="rgba(0,0,0,0.3)" />
            <Text style={styles.noVideoText}>Không có video động tác</Text>
          </View>
        )}
      </View>

      <Text style={styles.promptText}>Chọn từ chính xác cho động tác trên:</Text>

      {/* Answer Options stacked vertically for optimal mobile touch targets (Fitts' Law) */}
      <View style={styles.optionsContainer}>
        {question.options.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[styles.optionBtn, getOptionStyle(option)]}
            onPress={() => handleSelect(option)}
            activeOpacity={0.85}
            disabled={answerState !== 'unanswered'}
          >
            <Text style={getOptionTextStyle(option)}>{option.title}</Text>
            
            {selectedId !== null && option.id === question.sign.id && (
              <Ionicons name="checkmark-circle" size={22} color="#16A34A" style={styles.optionIcon} />
            )}
            {selectedId === option.id && option.id !== question.sign.id && (
              <Ionicons name="close-circle" size={22} color="#DC2626" style={styles.optionIcon} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Premium feedback bar */}
      {answerState !== 'unanswered' && (
        <Animated.View style={[
          styles.feedback,
          answerState === 'correct' ? styles.feedbackCorrect : styles.feedbackWrong,
        ]}>
          <Ionicons 
            name={answerState === 'correct' ? 'checkmark-circle-outline' : 'close-circle-outline'} 
            size={22} 
            color={answerState === 'correct' ? '#16A34A' : '#DC2626'} 
          />
          <Text style={[styles.feedbackText, { color: answerState === 'correct' ? '#16A34A' : '#DC2626' }]}>
            {answerState === 'correct' ? 'Chính xác! Làm tốt lắm!' : `Sai rồi! Ký hiệu đúng là "${question.sign.title}"`}
          </Text>
        </Animated.View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width - SPACING.xl * 2,
    alignSelf: 'center',
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  questionCounter: {
    ...TYPOGRAPHY.labelMedium,
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  questionType: {
    ...TYPOGRAPHY.labelMedium,
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: 'bold',
  },
  videoCard: {
    width: '100%',
    height: width * 0.58,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
    backgroundColor: '#0D1117',
    marginBottom: SPACING.md,
    ...SHADOWS.glass,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loaderWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0D1117',
  },
  noVideo: {
    alignItems: 'center',
    gap: 8,
  },
  noVideoText: {
    ...TYPOGRAPHY.bodySmall,
    color: 'rgba(255,255,255,0.4)',
  },
  promptText: {
    ...TYPOGRAPHY.labelLarge,
    color: COLORS.text,
    fontSize: 15,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  optionsContainer: {
    width: '100%',
    gap: SPACING.sm,
  },
  optionBtn: {
    width: '100%',
    borderRadius: BORDER_RADIUS.pill,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    borderWidth: 2,
    position: 'relative',
    ...SHADOWS.sm,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderColor: 'rgba(255,255,255,0.9)',
  },
  optionDefault: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderColor: 'rgba(255,255,255,0.9)',
  },
  optionCorrect: {
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderColor: '#22C55E',
  },
  optionWrong: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderColor: '#EF4444',
  },
  optionDimmed: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderColor: 'rgba(230,230,230,0.5)',
    opacity: 0.7,
  },
  optionText: {
    fontFamily: 'Inter',
    fontSize: 15,
    color: COLORS.text,
    textAlign: 'center',
    fontWeight: '600',
  },
  optionIcon: {
    position: 'absolute',
    right: 20,
  },
  feedback: {
    marginTop: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
  },
  feedbackCorrect: {
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderColor: 'rgba(34,197,94,0.25)',
  },
  feedbackWrong: {
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderColor: 'rgba(239,68,68,0.2)',
  },
  feedbackText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
});

export { QuizQuestion };
export default QuizCard;
