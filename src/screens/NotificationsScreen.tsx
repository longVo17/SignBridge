import React, { useState } from 'react';
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
import { notificationService } from '../services/notification.service';

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

export default function NotificationsScreen({ navigation }: any) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      title: 'Welcome to SignBridge! 🎉',
      body: 'Start your journey to master American Sign Language. Complete your first lesson in ASL Alphabet Part 1 to earn 260 XP!',
      time: 'Just now',
      read: false,
      icon: 'sparkles',
      color: '#2DC7FF',
    },
    {
      id: '2',
      title: 'Practice Reminder 🌟',
      body: 'Keep your study streak active! Spend just 2 minutes today practicing letters or taking a quick quiz.',
      time: '2 hours ago',
      read: false,
      icon: 'flame',
      color: '#F97316',
    },
    {
      id: '3',
      title: 'Flashcard Resumption Hub',
      body: 'Your flashcard session progress has been saved. You can always resume right from where you left off via your profile!',
      time: 'Yesterday',
      read: true,
      icon: 'layers',
      color: '#F59E0B',
    },
  ]);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <LinearGradient colors={['#E8F8FF', '#F0FBFF', '#FAFEFF']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Notifications</Text>
          {notifications.some(n => !n.read) && (
            <TouchableOpacity onPress={markAllRead} style={styles.readAllBtn}>
              <Text style={styles.readAllText}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Dynamic local push notification test trigger */}
          <BlurView intensity={85} tint="light" style={styles.testBtnCard}>
            <View style={styles.testBtnInfo}>
              <Text style={styles.testBtnTitle}>Test Notifications</Text>
              <Text style={styles.testBtnDesc}>Trigger an immediate local push notification on this device.</Text>
            </View>
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => {
                notificationService.sendImmediateTestNotification();
              }}
              style={styles.triggerBtn}
            >
              <LinearGradient
                colors={['#2DC7FF', '#00A3E0']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.triggerGradient}
              >
                <Ionicons name="paper-plane" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.triggerText}>Trigger</Text>
              </LinearGradient>
            </TouchableOpacity>
          </BlurView>

          {notifications.length > 0 ? (
            notifications.map((item) => (
              <BlurView
                key={item.id}
                intensity={item.read ? 60 : 85}
                tint="light"
                style={[styles.notiCard, !item.read && styles.notiCardUnread]}
              >
                <View style={[styles.iconContainer, { backgroundColor: `${item.color}15` }]}>
                  <Ionicons name={item.icon} size={20} color={item.color} />
                </View>
                
                <View style={styles.contentWrap}>
                  <View style={styles.row}>
                    <Text style={[styles.notiTitle, !item.read && styles.textBold]}>
                      {item.title}
                    </Text>
                    {!item.read && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.notiBody}>{item.body}</Text>
                  <Text style={styles.notiTime}>{item.time}</Text>
                </View>

                <TouchableOpacity 
                  onPress={() => deleteNotification(item.id)} 
                  style={styles.deleteBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={16} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </BlurView>
            ))
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconBg}>
                <Ionicons name="notifications-off-outline" size={48} color={COLORS.textSecondary} />
              </View>
              <Text style={styles.emptyText}>You are all caught up!</Text>
              <Text style={styles.emptySubText}>We will notify you here when there are new milestones or daily updates.</Text>
            </View>
          )}
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
    flex: 1,
  },
  readAllBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  readAllText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  scrollContent: {
    padding: SPACING.md,
    gap: 12,
  },
  notiCard: {
    flexDirection: 'row',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.7)',
    overflow: 'hidden',
    ...SHADOWS.soft,
  },
  notiCardUnread: {
    borderColor: 'rgba(45,199,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentWrap: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    paddingRight: 10,
  },
  notiTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  textBold: {
    fontWeight: 'bold',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: 6,
  },
  notiBody: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 6,
  },
  notiTime: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: COLORS.textSecondary,
    opacity: 0.8,
  },
  deleteBtn: {
    padding: 4,
    alignSelf: 'flex-start',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 120,
    paddingHorizontal: SPACING.xl,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(45,199,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  emptyText: {
    ...TYPOGRAPHY.headlineLarge,
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  emptySubText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  testBtnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(45,199,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginBottom: 8,
    overflow: 'hidden',
    ...SHADOWS.soft,
  },
  testBtnInfo: {
    flex: 1,
    marginRight: 12,
  },
  testBtnTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  testBtnDesc: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  triggerBtn: {
    borderRadius: BORDER_RADIUS.pill,
    overflow: 'hidden',
    ...SHADOWS.glass,
  },
  triggerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  triggerText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
