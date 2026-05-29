// ─────────────────────────────────────────────────────────────────────────────
// SIGNBRIDGE — Safe User Progress Reset Script
// Run: node scripts/resetProgress.cjs <USER_UID>
//
// This script safely resets a user's study path progress, quiz scores, and
// flashcard review records to 0% without deleting their user account document
// or causing any synchronization errors in the leaderboard.
// ─────────────────────────────────────────────────────────────────────────────

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  doc, 
  deleteDoc, 
  updateDoc, 
  collection, 
  getDocs 
} = require('firebase/firestore');

const firebaseConfig = {
  apiKey: 'AIzaSyBh5WzJk-nk_FX3fBe5jMeMCGLkLBaAG6M',
  authDomain: 'signbridge-c0b9c.firebaseapp.com',
  projectId: 'signbridge-c0b9c',
  storageBucket: 'signbridge-c0b9c.firebasestorage.app',
  messagingSenderId: '438957272127',
  appId: '1:438957272127:web:d88641dc3ea73a837bdc8a',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Get user UID from command line arguments
const userUID = process.argv[2];

if (!userUID) {
  console.log('\n❌ Error: Please provide a User UID.');
  console.log('Usage: node scripts/resetProgress.cjs <USER_UID>\n');
  process.exit(1);
}

async function resetUserProgress(uid) {
  console.log(`\n🔄 Starting safe progress reset for user: ${uid}...\n`);

  try {
    // 1. Delete /userProgress/{uid} document
    // This resets lesson progression, path progression, streak days, and quiz history.
    // The mobile application will automatically recreate this document on the next load.
    const progressDocRef = doc(db, 'userProgress', uid);
    await deleteDoc(progressDocRef);
    console.log('✅ Deleted learning path & lesson progress document (userProgress).');

    // 2. Delete all documents inside /flashcardProgress/{uid}/paths/*
    // Deletes active flashcards review history and completion percentage.
    const flashcardColRef = collection(db, 'flashcardProgress', uid, 'paths');
    const flashcardSnap = await getDocs(flashcardColRef);
    
    if (!flashcardSnap.empty) {
      let count = 0;
      for (const flashcardDoc of flashcardSnap.docs) {
        await deleteDoc(doc(db, 'flashcardProgress', uid, 'paths', flashcardDoc.id));
        count++;
      }
      console.log(`✅ Deleted all ${count} flashcard progression path documents.`);
    } else {
      console.log('ℹ️ No flashcard progress history to clean up.');
    }

    // 3. Safely reset totalXP and active status inside /users/{uid} document
    // This updates the dynamic Leaderboard rank without deleting the user's core auth account
    // (e.g. displayName, photoURL, email, phoneNumber).
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, {
      totalXP: 0,
      lastActiveDate: ""
    });
    console.log('✅ Safely reset totalXP to 0 in users collection (for Leaderboard sync).');

    console.log(`\n🎉 Success! Progress has been cleanly reset to 0% for user ${uid}.`);
    console.log('The user can open the app and their progression will be fresh with no errors.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Reset failed due to an error:', error.message);
    process.exit(1);
  }
}

resetUserProgress(userUID);
