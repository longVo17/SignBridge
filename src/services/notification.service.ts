import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const notificationService = {
  // Request permissions and get push token
  registerForPushNotifications: async (uid: string): Promise<string | null> => {
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync() as any;
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync() as any;
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Permission to receive push notifications was denied');
        return null;
      }

      let projectId = undefined;
      try {
        const Constants = require('expo-constants').default;
        projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
      } catch (e) {
        // Fallback silently in bare environments
      }

      const token = (await Notifications.getExpoPushTokenAsync({
        projectId: projectId || "8e36e3d2-d4f1-4db5-b827-0ea876ab3910"
      })).data;
      
      // Update push token in user's profile
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, { pushToken: token }).catch(err => {
        console.warn("Failed to save pushToken to Firestore:", err);
      });

      // Platform-specific configuration for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF2353B2',
        });
      }

      return token;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  },

  // Schedule a local recurring daily reminder at 7:00 PM
  scheduleDailyReminder: async (): Promise<void> => {
    try {
      const { status } = await Notifications.getPermissionsAsync() as any;
      if (status !== 'granted') return;

      // Cancel any existing daily reminder first
      await Notifications.cancelAllScheduledNotificationsAsync();

      // Schedule new daily reminder
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "SignBridge Study Reminder 🌟",
          body: "Keep your daily streak alive! Open SignBridge to practice ASL now.",
          sound: true,
        },
        trigger: {
          type: 'calendar',
          hour: 19, // 7 PM
          minute: 0,
          repeats: true,
        } as any,
      });

      console.log('Successfully scheduled daily study reminder at 19:00');
    } catch (error) {
      console.error('Error scheduling daily reminder:', error);
    }
  },

  // Schedule a dynamic daily streak reminder before 8:00 PM
  scheduleStreakReminder: async (lastPracticeDate?: string): Promise<void> => {
    try {
      const { status } = await Notifications.getPermissionsAsync() as any;
      if (status !== 'granted') return;

      // 1. Cancel any existing streak reminder notification first to avoid duplicates
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const streakReminder = scheduled.find(n => n.content.title?.includes("Streak"));
      if (streakReminder) {
        await Notifications.cancelScheduledNotificationAsync(streakReminder.identifier);
      }

      // 2. Check if the user already studied today
      const today = new Date().toISOString().split('T')[0];
      if (lastPracticeDate) {
        const lastPractice = new Date(lastPracticeDate).toISOString().split('T')[0];
        if (lastPractice === today) {
          console.log('User already studied today! Scheduling streak reminder for tomorrow at 20:00.');
          
          // Schedule for tomorrow at 20:00 (8 PM)
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "SignBridge Streak Reminder! 🔥",
              body: "Don't let your learning streak slip! Keep practicing ASL words today.",
              sound: true,
            },
            trigger: {
              type: 'calendar',
              hour: 20,
              minute: 0,
              repeats: true,
            } as any,
          });
          return;
        }
      }

      // If they haven't studied today, schedule a reminder for 8:00 PM today
      const now = new Date();
      const currentHour = now.getHours();
      
      // If it's already past 8:00 PM today, schedule for tomorrow 8:00 PM
      if (currentHour >= 20) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "SignBridge Streak Reminder! 🔥",
            body: "Don't let your learning streak slip! Keep practicing ASL words today.",
            sound: true,
          },
          trigger: {
            type: 'calendar',
            hour: 20,
            minute: 0,
            repeats: true,
          } as any,
        });
      } else {
        // Schedule for 8:00 PM today (20:00)
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "SignBridge Streak Danger! ⚠️",
            body: "You haven't completed any lessons today! Open SignBridge now to keep your streak alive.",
            sound: true,
          },
          trigger: {
            type: 'calendar',
            hour: 20,
            minute: 0,
            repeats: false, // only for today, tomorrow it will be rescheduled based on their activity
          } as any,
        });
        console.log('User has NOT studied today. Scheduled streak danger reminder for 20:00 today.');
      }
    } catch (error) {
      console.error('Error scheduling streak reminder:', error);
    }
  },


  // Trigger a test notification immediately
  sendImmediateTestNotification: async (): Promise<void> => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Welcome to SignBridge! 🎉",
          body: "Push notifications are fully enabled on your device.",
          sound: true,
        },
        trigger: null, // deliver immediately
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  }
};
