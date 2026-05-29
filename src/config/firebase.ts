import { initializeApp } from 'firebase/app';
import { initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { getReactNativePersistence } = require('firebase/auth') as any;

const firebaseConfig = {
  apiKey: 'AIzaSyBh5WzJk-nk_FX3fBe5jMeMCGLkLBaAG6M',
  authDomain: 'signbridge-c0b9c.firebaseapp.com',
  databaseURL: 'https://signbridge-c0b9c-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'signbridge-c0b9c',
  storageBucket: 'signbridge-c0b9c.firebasestorage.app',
  messagingSenderId: '438957272127',
  appId: '1:438957272127:web:d88641dc3ea73a837bdc8a',
};

const app = initializeApp(firebaseConfig);

// Auth với AsyncStorage persistence — user vẫn đăng nhập sau khi restart app
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);

export default app;