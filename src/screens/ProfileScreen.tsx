import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useAuthStore } from '../store/authStore';
import { useProgress } from '../hooks/useProgress';
import { signOut, updateUserProfile, getUserProfile } from '../services/auth.service';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../theme/theme';
import { flashcardService } from '../services/flashcard.service';
import { learningService } from '../services/learning.service';
import { FlashCardProgress, LearningPath } from '../types/data.types';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';

const translateTitle = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes('bảng chữ cái') || t.includes('alphabet')) return 'ASL Alphabet';
  if (t.includes('chào hỏi') || t.includes('greeting')) return 'Greetings & Meetings';
  if (t.includes('giao tiếp') || t.includes('essential')) return 'Essential Communication';
  if (t.includes('màu sắc') || t.includes('color')) return 'ASL Colors';
  if (t.includes('chữ số') || t.includes('number')) return 'ASL Numbers';
  return title;
};

const ACHIEVEMENTS_DATA = [
  { id: '1', iconName: 'trophy' as const, label: 'First Sign', condition: (p: any) => p?.completedLessons?.length > 0 },
  { id: '2', iconName: 'flame' as const, label: '5-Day Streak', condition: (p: any) => p?.streakDays >= 5 },
  { id: '3', iconName: 'star' as const, label: 'Quick Learner', condition: (p: any) => p?.totalXP >= 100 },
  { id: '4', iconName: 'ribbon' as const, label: 'Fluent', condition: (p: any) => p?.completedPaths?.length >= 5 },
];

type IconName = keyof typeof Ionicons.glyphMap;
const SETTINGS: { icon: IconName; label: string; color?: string; action: string }[] = [
  { icon: 'notifications-outline', label: 'Notifications', action: 'Notifications' },
  { icon: 'help-circle-outline', label: 'Help & Support', action: 'HelpSupport' },
  { icon: 'shield-outline', label: 'Privacy Policy', action: 'PrivacyPolicy' },
  { icon: 'log-out-outline', label: 'Log Out', color: COLORS.error, action: 'logout' },
];

export default function ProfileScreen({ navigation }: any) {
  const { user, setUser } = useAuthStore();
  const { progress } = useProgress();

  // Firestore profile state to load email, phone number, etc.
  const [profileData, setProfileData] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Custom Edit Profile Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editName, setEditName] = useState(user?.displayName || '');
  const [editPhoto, setEditPhoto] = useState(user?.photoURL || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [editPhone, setEditPhone] = useState('');
  const [saving, setSaving] = useState(false);

  // In-progress flashcards and learning paths
  const [activeFlashcards, setActiveFlashcards] = useState<{ progress: FlashCardProgress; path: LearningPath }[]>([]);
  const [allPaths, setAllPaths] = useState<LearningPath[]>([]);

  // Load Firestore profile & progress data on mount / user change
  useEffect(() => {
    if (!user?.uid) return;
    const loadProfileAndProgress = async () => {
      setLoadingProfile(true);
      try {
        const data = await getUserProfile(user.uid);
        if (data) {
          setProfileData(data);
          setEditName(data.displayName || user.displayName || '');
          setEditPhoto(data.photoURL || user.photoURL || '');
          setEditEmail(data.email || user.email || '');
          setEditPhone(data.phoneNumber || '');
        }

        // Fetch learning paths
        const pathsList = await learningService.getLearningPaths();
        setAllPaths(pathsList);

        // Fetch all flashcard progress
        const fcProgressList = await flashcardService.getAllProgress(user.uid);
        
        // Filter in-progress flashcards (unmastered signs > 0 and rate < 100)
        const inProgressFC = fcProgressList
          .filter((fp) => fp.unmasteredSignIds.length > 0 && fp.completionRate < 100)
          .map((fp) => {
            const path = pathsList.find((p) => p.id === fp.pathId);
            return { progress: fp, path };
          })
          .filter((item) => item.path !== undefined) as { progress: FlashCardProgress; path: LearningPath }[];
        
        setActiveFlashcards(inProgressFC);
      } catch (err) {
        console.error("Failed to load profile/progress data:", err);
      } finally {
        setLoadingProfile(false);
      }
    };
    loadProfileAndProgress();
  }, [user?.uid]);

  // Compute the current active lesson/upcoming path dynamically
  const activeLesson = React.useMemo(() => {
    if (!progress || allPaths.length === 0) return null;
    
    // Find the first path that is not completed
    const uncompletedPath = allPaths.find(
      (path) => !progress.completedPaths?.includes(path.id)
    );
    
    if (!uncompletedPath) return null;

    // A path is locked if it's index > 0 and the previous path is not completed
    const index = allPaths.findIndex((p) => p.id === uncompletedPath.id);
    const isLocked = index > 0 && !progress.completedPaths?.includes(allPaths[index - 1].id);
    
    if (isLocked) return null;

    const completedInPath = (progress.completedLessons || []).filter(
      (lid) => lid.startsWith(uncompletedPath.id + '_')
    ).length;

    return {
      path: uncompletedPath,
      completedCount: completedInPath,
      totalCount: uncompletedPath.lessonCount,
      percentage: uncompletedPath.lessonCount > 0 
        ? Math.round((completedInPath / uncompletedPath.lessonCount) * 100)
        : 0
    };
  }, [progress, allPaths]);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const displayName = profileData?.displayName || user?.displayName || user?.email?.split('@')[0] || 'ASL Explorer';
  const email = profileData?.email || user?.email || 'No email associated';
  const phoneNumber = profileData?.phoneNumber || '';

  const achievements = ACHIEVEMENTS_DATA.map(ach => ({
    ...ach,
    earned: ach.condition(progress)
  }));

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Display name cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      await updateUserProfile(editName.trim(), editPhoto.trim(), editEmail.trim(), editPhone.trim());
      
      const updatedUser = {
        ...user,
        uid: user?.uid || '',
        displayName: editName.trim(),
        photoURL: editPhoto.trim(),
        email: editEmail.trim(),
        phoneNumber: editPhone.trim(),
      };
      
      setUser(updatedUser);
      setProfileData(updatedUser);
      setModalVisible(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (err) {
      console.error('Failed to update profile:', err);
      Alert.alert('Error', 'Could not save profile details. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Format path ids into readable quiz names
  const getQuizName = (key: string) => {
    const k = key.toLowerCase();
    if (k.includes('alphabet') || k.includes('chu_cai')) return 'Alphabet Quiz';
    if (k.includes('greeting') || k.includes('chao')) return 'Greetings Quiz';
    if (k.includes('essential') || k.includes('giao_tiep')) return 'Essential Quiz';
    if (k.includes('number') || k.includes('chu_so')) return 'Numbers Quiz';
    if (k.includes('color') || k.includes('mau')) return 'Colors Quiz';
    return key.charAt(0).toUpperCase() + key.slice(1) + ' Quiz';
  };

  // Compile real-time Quiz analytics
  const quizScores = progress?.quizScores || {};
  const quizEntries = Object.entries(quizScores).map(([key, value]) => ({
    name: getQuizName(key),
    score: value,
  }));

  const hasQuizzes = quizEntries.length > 0;
  const avgScore = hasQuizzes 
    ? Math.round(quizEntries.reduce((sum, item) => sum + item.score, 0) / quizEntries.length)
    : 0;

  // Mock quiz entries for premium visual demo if they haven't taken any quizzes yet
  const mockQuizEntries = [
    { name: 'Alphabet Quiz', score: 85 },
    { name: 'Greetings Quiz', score: 90 },
    { name: 'Numbers Quiz', score: 75 },
    { name: 'Colors Quiz', score: 95 }
  ];

  const activeQuizData = hasQuizzes ? quizEntries : mockQuizEntries;

  return (
    <LinearGradient colors={['#E8F8FF', '#F0FBFF', '#FAFEFF']} style={styles.container}>
      <View style={styles.blobTop} />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Profile Header section */}
          <Animatable.View animation="fadeInDown" delay={50} style={styles.profileHeader}>
            <LinearGradient
              colors={['#2DC7FF', '#00A3E0']}
              style={styles.avatarRing}
            >
              <Image
                source={{ uri: profileData?.photoURL || user?.photoURL || DEFAULT_AVATAR }}
                style={styles.avatarImage}
              />
            </LinearGradient>
            <Text style={styles.profileName}>{displayName}</Text>
            
            <View style={styles.contactDetails}>
              <View style={styles.contactRow}>
                <Ionicons name="mail-outline" size={14} color={COLORS.textSecondary} style={{ marginRight: 6 }} />
                <Text style={styles.profileEmail}>{email}</Text>
              </View>
              {phoneNumber ? (
                <View style={styles.contactRow}>
                  <Ionicons name="call-outline" size={14} color={COLORS.textSecondary} style={{ marginRight: 6 }} />
                  <Text style={styles.profilePhone}>{phoneNumber}</Text>
                </View>
              ) : null}
            </View>

            <TouchableOpacity
              style={styles.editProfileBtn}
              onPress={() => {
                setEditName(displayName);
                setEditPhoto(profileData?.photoURL || user?.photoURL || '');
                setEditEmail(email);
                setEditPhone(phoneNumber);
                setModalVisible(true);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.editProfileText}>Edit Profile</Text>
            </TouchableOpacity>
          </Animatable.View>

          {/* Real-time statistics section with vector icons */}
          <Animatable.View animation="fadeInUp" delay={150} style={styles.statsWrapper}>
            <BlurView intensity={85} tint="light" style={styles.statsCard}>
              {[
                { label: 'Lessons', value: (progress?.completedLessons?.length || 0).toString(), iconName: 'book-outline' as const, color: '#2DC7FF' },
                { label: 'Day Streak', value: (progress?.streakDays || 0).toString(), iconName: 'flame-outline' as const, color: '#F97316' },
                { label: 'XP', value: (progress?.totalXP || 0).toString(), iconName: 'sparkles-outline' as const, color: '#EAB308' },
              ].map((stat, idx, arr) => (
                <View key={stat.label} style={[styles.statBox, idx < arr.length - 1 && styles.statBorderRight]}>
                  <Ionicons name={stat.iconName} size={22} color={stat.color} style={{ marginBottom: 6 }} />
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </BlurView>
          </Animatable.View>

          {/* Achievements list */}
          <Animatable.View animation="fadeInUp" delay={200}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.md }}>
              {achievements.map((ach, index) => (
                <Animatable.View key={ach.id} animation="zoomIn" delay={250 + index * 80}>
                  <View style={[styles.achievementCard, !ach.earned && styles.achievementLocked]}>
                    <BlurView intensity={80} tint="light" style={styles.achievementBlur}>
                      <View style={[styles.achievementIconBg, { backgroundColor: ach.earned ? 'rgba(45,199,255,0.12)' : 'rgba(100,100,100,0.06)' }]}>
                        <Ionicons
                          name={ach.iconName}
                          size={28}
                          color={ach.earned ? COLORS.primary : COLORS.textSecondary}
                        />
                      </View>
                      <Text style={[styles.achievementLabel, !ach.earned && { color: COLORS.textSecondary }]}>
                        {ach.label}
                      </Text>
                    </BlurView>
                  </View>
                </Animatable.View>
              ))}
            </ScrollView>
          </Animatable.View>

          {/* Resume Study Section (Active Lessons & Flashcards) */}
          {(activeLesson || activeFlashcards.length > 0) && (
            <Animatable.View animation="fadeInUp" delay={220} style={styles.resumeSection}>
              <Text style={styles.sectionTitle}>Resume Study</Text>
              
              <View style={styles.resumeGrid}>
                {/* Active Lesson Card */}
                {activeLesson && (
                  <TouchableOpacity
                    style={styles.resumeCard}
                    activeOpacity={0.8}
                    onPress={() =>
                      navigation.navigate('Lesson', {
                        pathId: activeLesson.path.id,
                        pathTitle: translateTitle(activeLesson.path.title),
                      })
                    }
                  >
                    <BlurView intensity={85} tint="light" style={styles.resumeCardBlur}>
                      <View style={styles.resumeCardHeader}>
                        <View style={[styles.resumeIconBg, { backgroundColor: 'rgba(45,199,255,0.12)' }]}>
                          <Ionicons name="book" size={20} color={COLORS.primary} />
                        </View>
                        <View style={styles.resumeBadge}>
                          <Text style={styles.resumeBadgeText}>Active Lesson</Text>
                        </View>
                      </View>
                      
                      <Text style={styles.resumePathTitle} numberOfLines={1}>
                        {translateTitle(activeLesson.path.title)}
                      </Text>
                      
                      <View style={styles.resumeProgressRow}>
                        <View style={styles.resumeBarBg}>
                          <View style={[styles.resumeBarFill, { width: `${activeLesson.percentage}%` }]} />
                        </View>
                        <Text style={styles.resumeProgressText}>
                          {activeLesson.completedCount}/{activeLesson.totalCount}
                        </Text>
                      </View>
                      
                      <View style={styles.resumeActionRow}>
                        <Text style={styles.resumeActionText}>Continue Lesson</Text>
                        <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
                      </View>
                    </BlurView>
                  </TouchableOpacity>
                )}

                {/* Active Flashcard Cards */}
                {activeFlashcards.map(({ progress: fp, path }) => (
                  <TouchableOpacity
                    key={fp.pathId}
                    style={styles.resumeCard}
                    activeOpacity={0.8}
                    onPress={() =>
                      navigation.navigate('FlashCardReview', {
                        pathId: fp.pathId,
                        pathTitle: translateTitle(path.title),
                        resumeUnmastered: true,
                      })
                    }
                  >
                    <BlurView intensity={85} tint="light" style={styles.resumeCardBlur}>
                      <View style={styles.resumeCardHeader}>
                        <View style={[styles.resumeIconBg, { backgroundColor: 'rgba(245,158,11,0.12)' }]}>
                          <Ionicons name="layers" size={20} color="#F59E0B" />
                        </View>
                        <View style={[styles.resumeBadge, { backgroundColor: 'rgba(245,158,11,0.12)' }]}>
                          <Text style={[styles.resumeBadgeText, { color: '#D97706' }]}>Flashcard</Text>
                        </View>
                      </View>
                      
                      <Text style={styles.resumePathTitle} numberOfLines={1}>
                        {translateTitle(path.title)}
                      </Text>
                      
                      <View style={styles.resumeProgressRow}>
                        <View style={[styles.resumeBarBg, { backgroundColor: 'rgba(245,158,11,0.1)' }]}>
                          <View
                            style={[
                              styles.resumeBarFill,
                              { width: `${fp.completionRate}%`, backgroundColor: '#F59E0B' },
                            ]}
                          />
                        </View>
                        <Text style={styles.resumeProgressText}>{fp.completionRate}%</Text>
                      </View>
                      
                      <View style={styles.resumeActionRow}>
                        <Text style={[styles.resumeActionText, { color: '#D97706' }]}>Resume Review</Text>
                        <Ionicons name="arrow-forward" size={14} color="#D97706" />
                      </View>
                    </BlurView>
                  </TouchableOpacity>
                ))}
              </View>
            </Animatable.View>
          )}

          {/* New Premium Quiz Performance & Analytics Dashboard */}
          <Animatable.View animation="fadeInUp" delay={250} style={styles.analyticsSection}>
            <Text style={styles.sectionTitle}>Quiz Performance</Text>
            <BlurView intensity={85} tint="light" style={styles.analyticsCard}>
              <View style={styles.chartHeader}>
                <View>
                  <Text style={styles.chartTitle}>Quiz Score Progression</Text>
                  <Text style={styles.chartSubTitle}>
                    {hasQuizzes ? 'Real-time performance metrics' : 'Demo data - Complete a quiz to unlock!'}
                  </Text>
                </View>
                <View style={[styles.avgScoreBadge, { backgroundColor: hasQuizzes ? 'rgba(34,197,94,0.12)' : 'rgba(255,150,0,0.1)' }]}>
                  <Ionicons name="analytics" size={14} color={hasQuizzes ? '#16A34A' : '#F97316'} style={{ marginRight: 4 }} />
                  <Text style={[styles.avgScoreText, { color: hasQuizzes ? '#16A34A' : '#F97316' }]}>
                    {avgScore}% Avg
                  </Text>
                </View>
              </View>

              {/* Native Graphical Lollipop Bar Chart */}
              <View style={[styles.lollipopChart, !hasQuizzes && { opacity: 0.55 }]}>
                {activeQuizData.map((item, idx) => {
                  // Calculate heights and offsets
                  const barHeight = `${item.score}%`;
                  return (
                    <View key={idx} style={styles.lollipopColumn}>
                      {/* Interactive score badge floating at peak */}
                      <View style={[styles.lollipopTooltip, { bottom: barHeight, transform: [{ translateY: -14 }] } as any]}>
                        <Text style={styles.lollipopTooltipText}>{item.score}%</Text>
                      </View>
                      
                      {/* Vertical Lollipop Line */}
                      <View style={styles.lollipopLineBg}>
                        <View style={[styles.lollipopLineActive, { height: barHeight } as any]} />
                      </View>
                      
                      {/* Glowing Lollipop Dot */}
                      <View style={[styles.lollipopDot, { bottom: barHeight } as any]} />

                      {/* X-Axis Label */}
                      <Text style={styles.lollipopLabel} numberOfLines={1}>
                        Q{idx + 1}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* Quiz History List Table */}
              <View style={styles.quizHistoryContainer}>
                <Text style={styles.historySectionTitle}>Quiz History</Text>
                {hasQuizzes ? (
                  quizEntries.map((item, idx) => {
                    const passed = item.score >= 70;
                    return (
                      <View key={idx} style={styles.historyRow}>
                        <View style={[styles.historyStatusIcon, { backgroundColor: passed ? 'rgba(34,197,94,0.12)' : 'rgba(239, 68, 68, 0.08)' }]}>
                          <Ionicons 
                            name={passed ? "checkmark-circle" : "alert-circle"} 
                            size={18} 
                            color={passed ? "#16A34A" : "#EF4444"} 
                          />
                        </View>
                        <View style={styles.historyInfo}>
                          <Text style={styles.historyName}>{item.name}</Text>
                          <Text style={styles.historyStatusText}>{passed ? 'Passed ✓' : 'Study More'}</Text>
                        </View>
                        <Text style={[styles.historyScoreText, { color: passed ? '#16A34A' : '#EF4444' }]}>
                          {item.score}%
                        </Text>
                      </View>
                    );
                  })
                ) : (
                  <View style={styles.emptyHistoryState}>
                    <Ionicons name="file-tray-outline" size={32} color={COLORS.textSecondary} style={{ marginBottom: 6 }} />
                    <Text style={styles.emptyHistoryText}>No quiz scores logged yet</Text>
                  </View>
                )}
              </View>
            </BlurView>
          </Animatable.View>

          {/* Settings */}
          <Animatable.View animation="fadeInUp" delay={300}>
            <Text style={styles.sectionTitle}>Settings</Text>
            <BlurView intensity={85} tint="light" style={styles.settingsCard}>
              {SETTINGS.map((item, index) => (
                <View key={item.label}>
                  <TouchableOpacity
                    style={styles.settingItem}
                    onPress={() => {
                      if (item.action === 'logout') {
                        handleLogout();
                      } else {
                        navigation.navigate(item.action);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.settingIconBg, item.color === COLORS.error && styles.settingIconError]}>
                      <Ionicons
                        name={item.icon}
                        size={20}
                        color={item.color || COLORS.primary}
                      />
                    </View>
                    <Text style={[styles.settingLabel, item.color && { color: item.color }]}>
                      {item.label}
                    </Text>
                    <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} style={{ marginLeft: 'auto' }} />
                  </TouchableOpacity>
                  {index < SETTINGS.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </BlurView>
          </Animatable.View>

          <Text style={styles.versionText}>SignBridge v1.0.0</Text>
        </ScrollView>
      </SafeAreaView>

      {/* Elegant glassmorphic profile modal popup overlay supporting Email and Phone */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={90} tint="light" style={styles.modalBlurContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
              {/* Profile Image URL Preview */}
              <View style={styles.modalAvatarContainer}>
                <LinearGradient colors={['#2DC7FF', '#00A3E0']} style={styles.modalAvatarRing}>
                  <Image
                    source={{ uri: editPhoto || DEFAULT_AVATAR }}
                    style={styles.modalAvatarImage}
                  />
                </LinearGradient>
                <Text style={styles.avatarPreviewText}>Avatar Preview</Text>
              </View>

              {/* Display Name Input */}
              <Text style={styles.inputLabel}>Display Name</Text>
              <View style={styles.modalInputWrapper}>
                <Ionicons name="person-outline" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter display name"
                  placeholderTextColor={COLORS.textSecondary}
                  value={editName}
                  onChangeText={setEditName}
                  autoCorrect={false}
                />
              </View>

              {/* Email Address Input */}
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={styles.modalInputWrapper}>
                <Ionicons name="mail-outline" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter email address"
                  placeholderTextColor={COLORS.textSecondary}
                  value={editEmail}
                  onChangeText={setEditEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                />
              </View>

              {/* Phone Number Input */}
              <Text style={styles.inputLabel}>Phone Number</Text>
              <View style={styles.modalInputWrapper}>
                <Ionicons name="call-outline" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Add phone number"
                  placeholderTextColor={COLORS.textSecondary}
                  value={editPhone}
                  onChangeText={setEditPhone}
                  keyboardType="phone-pad"
                  autoCorrect={false}
                />
              </View>

              {/* Display Avatar Link Input */}
              <Text style={styles.inputLabel}>Avatar Image URL</Text>
              <View style={styles.modalInputWrapper}>
                <Ionicons name="image-outline" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Paste profile photo URL"
                  placeholderTextColor={COLORS.textSecondary}
                  value={editPhoto}
                  onChangeText={setEditPhoto}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <Text style={styles.inputHint}>Tip: You can use any image link (PNG or JPG) from the web to display a custom avatar!</Text>

              {/* Save & Cancel CTAs */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.modalSaveBtn}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                <LinearGradient
                  colors={saving ? ['#A8D5E8', '#A8D5E8'] : ['#2DC7FF', '#00A3E0']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.saveBtnGradient}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.modalSaveText}>Save Changes</Text>
                      <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" style={{ marginLeft: 6 }} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </BlurView>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  blobTop: {
    position: 'absolute',
    top: -80,
    left: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(45,199,255,0.12)',
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  // Profile Header
  profileHeader: {
    alignItems: 'center',
    paddingTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.glass,
  },
  avatarImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#E8F8FF',
  },
  profileName: {
    ...TYPOGRAPHY.headlineMedium,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  contactDetails: {
    alignItems: 'center',
    marginTop: 4,
    marginBottom: SPACING.md,
    gap: 2,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileEmail: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
  },
  profilePhone: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
  },
  editProfileBtn: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.pill,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(45,199,255,0.08)',
  },
  editProfileText: {
    ...TYPOGRAPHY.labelLarge,
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: 'bold',
  },
  // Stats
  statsWrapper: {
    marginBottom: SPACING.lg,
  },
  statsCard: {
    flexDirection: 'row',
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.75)',
    ...SHADOWS.soft,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  statBorderRight: {
    borderRightWidth: 1,
    borderRightColor: 'rgba(200,220,235,0.6)',
  },
  statValue: {
    ...TYPOGRAPHY.headlineMedium,
    color: COLORS.text,
    fontSize: 22,
    fontWeight: 'bold',
  },
  statLabel: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  sectionTitle: {
    ...TYPOGRAPHY.headlineMedium,
    color: COLORS.text,
    marginBottom: SPACING.md,
    fontWeight: 'bold',
  },
  // Achievements
  achievementCard: {
    width: 96,
    marginRight: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.soft,
  },
  achievementLocked: {
    opacity: 0.55,
  },
  achievementBlur: {
    padding: SPACING.sm,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.75)',
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  achievementIconBg: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  achievementLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },

  // Premium Quiz Analytics & Lollipop Chart Styles
  analyticsSection: {
    marginBottom: SPACING.xl,
  },
  analyticsCard: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.75)',
    padding: SPACING.md,
    ...SHADOWS.soft,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  chartTitle: {
    ...TYPOGRAPHY.labelLarge,
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 15,
  },
  chartSubTitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  avgScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.pill,
  },
  avgScoreText: {
    fontSize: 11,
    fontWeight: 'bold',
  },

  // Lollipop Bar Chart Container
  lollipopChart: {
    height: 170,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingBottom: 24,
    paddingTop: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(200, 220, 235, 0.4)',
    marginHorizontal: 4,
  },
  lollipopColumn: {
    alignItems: 'center',
    width: 44,
    height: '100%',
    position: 'relative',
    justifyContent: 'flex-end',
  },
  lollipopLineBg: {
    position: 'absolute',
    width: 4,
    height: '100%',
    backgroundColor: 'rgba(45,199,255,0.1)',
    borderRadius: 2,
    bottom: 0,
    alignSelf: 'center',
  },
  lollipopLineActive: {
    width: '100%',
    backgroundColor: 'rgba(45,199,255,0.4)',
    borderRadius: 2,
    position: 'absolute',
    bottom: 0,
  },
  lollipopDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2DC7FF',
    alignSelf: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    ...SHADOWS.glass,
    shadowColor: '#2DC7FF',
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  lollipopTooltip: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(45,199,255,0.3)',
    ...SHADOWS.sm,
  },
  lollipopTooltipText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  lollipopLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    position: 'absolute',
    bottom: -18,
  },

  // History List styles
  quizHistoryContainer: {
    marginTop: SPACING.md,
  },
  historySectionTitle: {
    ...TYPOGRAPHY.labelSmall,
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 12,
    marginBottom: SPACING.sm,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(200, 220, 235, 0.3)',
  },
  historyStatusIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  historyInfo: {
    flex: 1,
  },
  historyName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  historyStatusText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  historyScoreText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyHistoryState: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  emptyHistoryText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },

  // Settings
  settingsCard: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.75)',
    ...SHADOWS.soft,
    marginBottom: SPACING.lg,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  settingIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(45,199,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  settingIconError: {
    backgroundColor: 'rgba(186,26,26,0.08)',
  },
  settingLabel: {
    ...TYPOGRAPHY.bodyLarge,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(200,220,235,0.6)',
    marginHorizontal: SPACING.md,
  },
  versionText: {
    textAlign: 'center',
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
    fontSize: 12,
    opacity: 0.6,
    marginTop: SPACING.sm,
  },

  // Modal Glassmorphic styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalBlurContainer: {
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
    maxHeight: '85%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    ...TYPOGRAPHY.headlineMedium,
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 22,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalScrollContent: {
    paddingBottom: SPACING.xl,
  },
  modalAvatarContainer: {
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  modalAvatarRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    ...SHADOWS.glass,
  },
  modalAvatarImage: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#E8F8FF',
  },
  avatarPreviewText: {
    ...TYPOGRAPHY.labelSmall,
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  inputLabel: {
    ...TYPOGRAPHY.labelLarge,
    color: COLORS.text,
    fontWeight: 'bold',
    marginTop: SPACING.md,
    marginBottom: 6,
    fontSize: 13,
  },
  modalInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.pill,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
  },
  modalInput: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
    flex: 1,
  },
  inputHint: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  modalSaveBtn: {
    marginTop: SPACING.xl,
    borderRadius: BORDER_RADIUS.pill,
    overflow: 'hidden',
    ...SHADOWS.glass,
  },
  saveBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    minHeight: 52,
  },
  modalSaveText: {
    ...TYPOGRAPHY.labelLarge,
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  
  // Resume Study styles
  resumeSection: {
    marginBottom: SPACING.lg,
  },
  resumeGrid: {
    gap: 12,
  },
  resumeCard: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.75)',
    ...SHADOWS.soft,
  },
  resumeCardBlur: {
    padding: SPACING.md,
    overflow: 'hidden',
  },
  resumeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  resumeIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resumeBadge: {
    backgroundColor: 'rgba(45,199,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.pill,
  },
  resumeBadgeText: {
    ...TYPOGRAPHY.labelSmall,
    color: COLORS.primary,
    fontSize: 10,
  },
  resumePathTitle: {
    ...TYPOGRAPHY.labelLarge,
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  resumeProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  resumeBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(45,199,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  resumeBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  resumeProgressText: {
    ...TYPOGRAPHY.labelSmall,
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  resumeActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  resumeActionText: {
    ...TYPOGRAPHY.labelLarge,
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
});
