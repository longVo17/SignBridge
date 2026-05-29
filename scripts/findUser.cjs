const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

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

async function findUsers() {
  console.log('🔍 Querying users collection...');
  try {
    const colRef = collection(db, 'users');
    const snap = await getDocs(colRef);
    if (snap.empty) {
      console.log('No users found in database.');
      return;
    }
    
    snap.forEach(doc => {
      const data = doc.data();
      console.log(`- UID: ${doc.id} | Name: ${data.displayName || 'No Name'} | Email: ${data.email || 'No Email'} | XP: ${data.totalXP || 0}`);
    });
  } catch (error) {
    console.error('Error finding users:', error.message);
  }
}

findUsers();
