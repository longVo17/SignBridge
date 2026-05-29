import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../theme/theme';

export default function PrivacyPolicyScreen({ navigation }: any) {
  return (
    <LinearGradient colors={['#E8F8FF', '#F0FBFF', '#FAFEFF']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Privacy Policy</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <BlurView intensity={85} tint="light" style={styles.policyCard}>
            <Text style={styles.lastUpdated}>Last Updated: May 2026</Text>

            <Text style={styles.sectionHeader}>1. Information We Collect</Text>
            <Text style={styles.paragraph}>
              We collect user information to deliver high-quality, personalized ASL learning services. This includes:
            </Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>• Account profile details (Display name, email, avatar image URLs, phone number).</Text>
              <Text style={styles.bulletItem}>• Detailed learning progress (XP, completed paths, streak days, quiz scores, flashcard master list).</Text>
              <Text style={styles.bulletItem}>• Push notification identifiers (Expo push tokens stored securely in Firestore) to trigger local alerts.</Text>
            </View>

            <Text style={styles.sectionHeader}>2. How We Use Information</Text>
            <Text style={styles.paragraph}>
              Your data is processed strictly to power application capabilities, including streaking multipliers, user global rank listings, notification broadcasts, and flashcard resuming features. We never sell, rent, or distribute your email or profile data to third-party ad networks.
            </Text>

            <Text style={styles.sectionHeader}>3. Data Storage & Security</Text>
            <Text style={styles.paragraph}>
              All user records are securely managed through Firebase Authentication and Firestore Database servers with strict security rules. You have full access and control over your profile and can request total deletion of your progress data at any time.
            </Text>

            <Text style={styles.sectionHeader}>4. Notifications & Local Scheduling</Text>
            <Text style={styles.paragraph}>
              Local notifications are scheduled directly on your operating system to send daily study reminders. You can opt out or disable push notifications at any time via your device settings panel.
            </Text>

            <Text style={styles.sectionHeader}>5. Changes to This Policy</Text>
            <Text style={styles.paragraph}>
              We may update our Privacy Policy to support new application capabilities. Continued use of SignBridge implies agreement to the active privacy terms.
            </Text>
            
            <Text style={styles.paragraph}>
              For any privacy inquiries or to delete your data, please contact engineering support at support@signbridge.app.
            </Text>
          </BlurView>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(45,199,255,0.08)',
  },
  backBtn: {
    padding: 6,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    marginRight: SPACING.sm,
  },
  title: {
    ...TYPOGRAPHY.headlineLarge,
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  policyCard: {
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.8)',
    padding: SPACING.lg,
    overflow: 'hidden',
    ...SHADOWS.soft,
  },
  lastUpdated: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    fontStyle: 'italic',
  },
  sectionHeader: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: 6,
    fontWeight: 'bold',
  },
  paragraph: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: SPACING.sm,
  },
  bulletList: {
    paddingLeft: SPACING.sm,
    marginBottom: SPACING.sm,
    gap: 4,
  },
  bulletItem: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
});
