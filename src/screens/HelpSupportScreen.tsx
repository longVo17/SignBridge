import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Linking,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../theme/theme';

interface FAQItem {
  question: string;
  answer: string;
}

export default function HelpSupportScreen({ navigation }: any) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const FAQS: FAQItem[] = [
    {
      question: "How do I study a new unit?",
      answer: "Navigate to the Learn tab at the bottom. Choose an unlocked learning unit (like 'ASL Alphabet - Part 1') and tap 'Start Lesson'. You will watch video demonstrations for each word and then take a short quiz to test your understanding."
    },
    {
      question: "How does the streak system work?",
      answer: "Every day you complete a lesson or review flashcards, your study streak increases by 1 day. If you go a full calendar day without completing any study activity, your streak resets. Daily reminders are scheduled at 7:00 PM to help you stay on track!"
    },
    {
      question: "What are flashcards used for?",
      answer: "Flashcards allow you to review words you have learned. Swipe right on a card if you know the sign ('Mastered') or left if you need to practice more ('Still Learning'). Your progress is saved automatically so you can resume anytime from your profile page."
    },
    {
      question: "How is my XP calculated?",
      answer: "You earn XP (Experience Points) by completing lessons and mastering words. Each letter in the ASL Alphabet earns you +20 XP, and conversational vocabulary words earn +30 XP or +40 XP upon successful completion."
    }
  ];

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@signbridge.app')
      .catch(() => Alert.alert('Error', 'Could not open mail client. Please email us at support@signbridge.app'));
  };

  const toggleFaq = (index: number) => {
    setActiveFaq(prev => (prev === index ? null : index));
  };

  return (
    <LinearGradient colors={['#E8F8FF', '#F0FBFF', '#FAFEFF']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Help & Support</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Subtitle / Intro */}
          <Text style={styles.introText}>
            Welcome to the Support Center. Search below for common questions, or reach out directly to our engineering support team.
          </Text>

          {/* Contact channels */}
          <View style={styles.supportCardContainer}>
            <BlurView intensity={85} tint="light" style={styles.supportCard}>
              <View style={styles.supportIconBg}>
                <Ionicons name="chatbubbles-outline" size={28} color={COLORS.primary} />
              </View>
              <Text style={styles.cardTitle}>Need Technical Help?</Text>
              <Text style={styles.cardBody}>
                Our engineering team is available 24/7 to resolve bugs, account access issues, or feature inquiries.
              </Text>
              <TouchableOpacity onPress={handleContactSupport} style={styles.emailBtn} activeOpacity={0.8}>
                <LinearGradient colors={['#2DC7FF', '#00A3E0']} style={styles.emailBtnGrad}>
                  <Ionicons name="mail" size={16} color="#FFF" />
                  <Text style={styles.emailBtnText}>Email Engineering</Text>
                </LinearGradient>
              </TouchableOpacity>
            </BlurView>
          </View>

          {/* FAQs section */}
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          
          <View style={styles.faqList}>
            {FAQS.map((faq, idx) => {
              const active = activeFaq === idx;
              return (
                <BlurView key={idx} intensity={active ? 85 : 60} tint="light" style={styles.faqCard}>
                  <TouchableOpacity 
                    style={styles.faqHeader} 
                    onPress={() => toggleFaq(idx)} 
                    activeOpacity={0.7}
                  >
                    <Text style={styles.faqQuestion}>{faq.question}</Text>
                    <Ionicons 
                      name={active ? "chevron-up" : "chevron-down"} 
                      size={18} 
                      color={COLORS.primary} 
                    />
                  </TouchableOpacity>
                  
                  {active && (
                    <View style={styles.faqAnswerContainer}>
                      <Text style={styles.faqAnswer}>{faq.answer}</Text>
                    </View>
                  )}
                </BlurView>
              );
            })}
          </View>
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
  introText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  supportCardContainer: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    marginBottom: SPACING.xl,
    ...SHADOWS.soft,
  },
  supportCard: {
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  supportIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(45,199,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 6,
  },
  cardBody: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  emailBtn: {
    width: '100%',
    borderRadius: BORDER_RADIUS.pill,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  emailBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  emailBtnText: {
    color: '#FFF',
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
  },
  sectionTitle: {
    ...TYPOGRAPHY.headlineMedium,
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  faqList: {
    gap: 10,
  },
  faqCard: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.7)',
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  faqQuestion: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: COLORS.text,
    flex: 1,
    paddingRight: SPACING.sm,
  },
  faqAnswerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(45,199,255,0.06)',
    paddingTop: 10,
  },
  faqAnswer: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});
