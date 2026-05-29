// ─────────────────────────────────────────────────────────────────────────────
// SIGNBRIDGE — Firestore Seed Script (Full — v2)
// Run: node scripts/seed.cjs
//
// Includes:
//   - 30 original signs (Greetings, Basics, Daily, Family, Numbers, Colors)
//   - 26 alphabet signs (A-Z) with ASL finger-spelling descriptions
//   - 6 learning paths + 1 Alphabet path
// ─────────────────────────────────────────────────────────────────────────────

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, writeBatch, collection, getDocs, deleteDoc } = require('firebase/firestore');

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

// ── 30 ký hiệu ASL gốc ────────────────────────────────────────────────────────
const SIGNS = [
  // Greetings
  { id: 'hello',      title: 'Hello',      category: 'Greetings', difficulty: 'Easy',   emoji: '👋', videoId: 'lj_LKBQJ1Pk', description: 'Open hand, wave side to side from forehead.' },
  { id: 'goodbye',    title: 'Goodbye',    category: 'Greetings', difficulty: 'Easy',   emoji: '🤚', videoId: 'DkODLAiC7IY', description: 'Wave hand back and forth.' },
  { id: 'please',     title: 'Please',     category: 'Greetings', difficulty: 'Easy',   emoji: '🙏', videoId: 'U3Ld9POAYQ0', description: 'Flat hand on chest, circular motion.' },
  { id: 'thankyou',   title: 'Thank You',  category: 'Greetings', difficulty: 'Easy',   emoji: '🤲', videoId: 'R7a8CCpLVi4', description: 'Fingers touch chin, move forward.' },
  { id: 'sorry',      title: 'Sorry',      category: 'Greetings', difficulty: 'Easy',   emoji: '😔', videoId: 'LVkHaqMpkVE', description: 'Fist on chest, circular motion.' },
  { id: 'yes',        title: 'Yes',        category: 'Greetings', difficulty: 'Easy',   emoji: '✅', videoId: 'xpNaHC8XGd8', description: 'Fist nods up and down like a head nodding.' },
  { id: 'no',         title: 'No',         category: 'Greetings', difficulty: 'Easy',   emoji: '❌', videoId: 'H3PO7RL4bZY', description: 'Index and middle finger snap closed against thumb.' },
  // Basics
  { id: 'help',       title: 'Help',       category: 'Basics',    difficulty: 'Easy',   emoji: '🆘', videoId: 'pLHDaKjknLs', description: 'Thumb up hand lifts flat hand.' },
  { id: 'want',       title: 'Want',       category: 'Basics',    difficulty: 'Easy',   emoji: '🙋', videoId: 'BHTMjHkx0sE', description: 'Claw hands pull toward body.' },
  { id: 'need',       title: 'Need',       category: 'Basics',    difficulty: 'Medium', emoji: '📌', videoId: 'seLqgbZ-Zso', description: 'Bent index finger bends down repeatedly.' },
  { id: 'understand', title: 'Understand', category: 'Basics',    difficulty: 'Medium', emoji: '💡', videoId: 'AlGqFAGWVo0', description: 'Index flicks up from forehead.' },
  { id: 'like',       title: 'Like',       category: 'Basics',    difficulty: 'Easy',   emoji: '👍', videoId: '7vfz7rBQ3fQ', description: 'Middle finger and thumb pinch from chest outward.' },
  // Daily
  { id: 'eat',        title: 'Eat',        category: 'Daily',     difficulty: 'Easy',   emoji: '🍽️', videoId: 'QoqhkWvKMbk', description: 'Flat fingers tap mouth repeatedly.' },
  { id: 'drink',      title: 'Drink',      category: 'Daily',     difficulty: 'Easy',   emoji: '🥤', videoId: 'v-Bpb4UcFiA', description: 'C-shaped hand tilts toward mouth.' },
  { id: 'sleep',      title: 'Sleep',      category: 'Daily',     difficulty: 'Easy',   emoji: '😴', videoId: 'h7IiMjWlVGo', description: 'Hand drops from forehead and fingers close.' },
  { id: 'work',       title: 'Work',       category: 'Daily',     difficulty: 'Medium', emoji: '💼', videoId: '6rN8S_KHPSU', description: 'Fists tap together at wrists.' },
  { id: 'school',     title: 'School',     category: 'Daily',     difficulty: 'Easy',   emoji: '🏫', videoId: 'Q7Fg21dUq30', description: 'Flat hands clap twice.' },
  { id: 'home',       title: 'Home',       category: 'Daily',     difficulty: 'Easy',   emoji: '🏠', videoId: 'GUZhFjkiWvE', description: 'Fingers together tap cheek then side of cheek.' },
  // Family
  { id: 'mother',     title: 'Mother',     category: 'Family',    difficulty: 'Easy',   emoji: '👩', videoId: 'SuCqIVPiKQs', description: 'Open hand, thumb touches chin.' },
  { id: 'father',     title: 'Father',     category: 'Family',    difficulty: 'Easy',   emoji: '👨', videoId: 'GPzl3ZDi9EI', description: 'Open hand, thumb touches forehead.' },
  { id: 'baby',       title: 'Baby',       category: 'Family',    difficulty: 'Easy',   emoji: '👶', videoId: 'v7LGQ2tWbW8', description: 'Arms cradle and rock like holding a baby.' },
  { id: 'friend',     title: 'Friend',     category: 'Family',    difficulty: 'Easy',   emoji: '🤝', videoId: 'YgZ5JN5JQCQ', description: 'Index fingers hook together and swap positions.' },
  // Numbers
  { id: 'one',        title: 'One',        category: 'Numbers',   difficulty: 'Easy',   emoji: '1️⃣', videoId: 'MDtCCJ_-M_I', description: 'Index finger points up.' },
  { id: 'two',        title: 'Two',        category: 'Numbers',   difficulty: 'Easy',   emoji: '2️⃣', videoId: 'MDtCCJ_-M_I', description: 'Index and middle fingers up (V shape).' },
  { id: 'three',      title: 'Three',      category: 'Numbers',   difficulty: 'Easy',   emoji: '3️⃣', videoId: 'MDtCCJ_-M_I', description: 'Index, middle, and thumb up.' },
  { id: 'five',       title: 'Five',       category: 'Numbers',   difficulty: 'Easy',   emoji: '5️⃣', videoId: 'MDtCCJ_-M_I', description: 'Open hand, all five fingers spread.' },
  { id: 'ten',        title: 'Ten',        category: 'Numbers',   difficulty: 'Easy',   emoji: '🔟', videoId: 'MDtCCJ_-M_I', description: 'Thumb up, shake wrist side to side.' },
  // Colors
  { id: 'blue',       title: 'Blue',       category: 'Colors',    difficulty: 'Easy',   emoji: '🔵', videoId: 'BoLqK5d9VqY', description: 'B-handshape twists at wrist.' },
  { id: 'red',        title: 'Red',        category: 'Colors',    difficulty: 'Easy',   emoji: '🔴', videoId: 'BoLqK5d9VqY', description: 'Index finger brushes down lips.' },
  { id: 'green',      title: 'Green',      category: 'Colors',    difficulty: 'Easy',   emoji: '🟢', videoId: 'BoLqK5d9VqY', description: 'G-handshape twists at wrist.' },
];

// ── 26 Bảng chữ cái ASL ───────────────────────────────────────────────────────
const ALPHABET_SIGNS = [
  { id: 'asl_a', title: 'A', category: 'Alphabet', difficulty: 'Easy', emoji: '🅰️', videoURL: '', description: 'Fist with thumb resting on the side of the index finger.' },
  { id: 'asl_b', title: 'B', category: 'Alphabet', difficulty: 'Easy', emoji: '🅱️', videoURL: '', description: 'Four fingers up and together, thumb folded across palm.' },
  { id: 'asl_c', title: 'C', category: 'Alphabet', difficulty: 'Easy', emoji: '©️', videoURL: '', description: 'Curved hand forming a C shape, fingers and thumb facing sideways.' },
  { id: 'asl_d', title: 'D', category: 'Alphabet', difficulty: 'Easy', emoji: '🔤', videoURL: '', description: 'Index finger up, other fingers curved, touch thumb to form a D shape.' },
  { id: 'asl_e', title: 'E', category: 'Alphabet', difficulty: 'Easy', emoji: '📧', videoURL: '', description: 'Fingers bent and curved down, touching thumb in an E shape.' },
  { id: 'asl_f', title: 'F', category: 'Alphabet', difficulty: 'Easy', emoji: '🔤', videoURL: '', description: 'Index finger and thumb touch (OK sign), other 3 fingers up.' },
  { id: 'asl_g', title: 'G', category: 'Alphabet', difficulty: 'Easy', emoji: '🔤', videoURL: '', description: 'Index finger and thumb point horizontally with other fingers closed.' },
  { id: 'asl_h', title: 'H', category: 'Alphabet', difficulty: 'Easy', emoji: '🔤', videoURL: '', description: 'Index and middle finger extended together, pointing sideways.' },
  { id: 'asl_i', title: 'I', category: 'Alphabet', difficulty: 'Easy', emoji: 'ℹ️', videoURL: '', description: 'Pinky finger extended up, other fingers closed in a fist.' },
  { id: 'asl_j', title: 'J', category: 'Alphabet', difficulty: 'Medium', emoji: '🔤', videoURL: '', description: 'Pinky up (like I), then draw a J shape in the air.' },
  { id: 'asl_k', title: 'K', category: 'Alphabet', difficulty: 'Medium', emoji: '🔤', videoURL: '', description: 'Index and middle fingers up in a V, thumb between them.' },
  { id: 'asl_l', title: 'L', category: 'Alphabet', difficulty: 'Easy', emoji: '🔤', videoURL: '', description: 'Index finger up, thumb out to side forming an L shape.' },
  { id: 'asl_m', title: 'M', category: 'Alphabet', difficulty: 'Medium', emoji: 'Ⓜ️', videoURL: '', description: 'Three fingers folded over thumb.' },
  { id: 'asl_n', title: 'N', category: 'Alphabet', difficulty: 'Medium', emoji: '🔤', videoURL: '', description: 'Two fingers folded over thumb.' },
  { id: 'asl_o', title: 'O', category: 'Alphabet', difficulty: 'Easy', emoji: '⭕', videoURL: '', description: 'All fingers and thumb curve around to form an O shape.' },
  { id: 'asl_p', title: 'P', category: 'Alphabet', difficulty: 'Medium', emoji: '🅿️', videoURL: '', description: 'Like K handshape but pointing downward.' },
  { id: 'asl_q', title: 'Q', category: 'Alphabet', difficulty: 'Medium', emoji: '🔤', videoURL: '', description: 'Like G handshape but pointing downward.' },
  { id: 'asl_r', title: 'R', category: 'Alphabet', difficulty: 'Easy', emoji: '®️', videoURL: '', description: 'Index and middle fingers extended and crossed.' },
  { id: 'asl_s', title: 'S', category: 'Alphabet', difficulty: 'Easy', emoji: '🔤', videoURL: '', description: 'Fist with thumb over fingers.' },
  { id: 'asl_t', title: 'T', category: 'Alphabet', difficulty: 'Easy', emoji: '🔤', videoURL: '', description: 'Fist with thumb between index and middle fingers.' },
  { id: 'asl_u', title: 'U', category: 'Alphabet', difficulty: 'Easy', emoji: '🔤', videoURL: '', description: 'Index and middle fingers up together, pointing up.' },
  { id: 'asl_v', title: 'V', category: 'Alphabet', difficulty: 'Easy', emoji: '✌️', videoURL: '', description: 'Index and middle fingers spread apart forming a V (peace sign).' },
  { id: 'asl_w', title: 'W', category: 'Alphabet', difficulty: 'Easy', emoji: '🔤', videoURL: '', description: 'Three fingers (index, middle, ring) spread apart forming a W.' },
  { id: 'asl_x', title: 'X', category: 'Alphabet', difficulty: 'Easy', emoji: '❌', videoURL: '', description: 'Index finger bent like a hook.' },
  { id: 'asl_y', title: 'Y', category: 'Alphabet', difficulty: 'Easy', emoji: '🤙', videoURL: '', description: 'Pinky and thumb extended out (hang-loose/shaka).' },
  { id: 'asl_z', title: 'Z', category: 'Alphabet', difficulty: 'Medium', emoji: '💤', videoURL: '', description: 'Index finger traces a Z shape in the air.' },
];

const ALL_SIGNS = [...SIGNS, ...ALPHABET_SIGNS];

// ── Learning Paths ─────────────────────────────────────────────────────────────
const LEARNING_PATHS = [
  { id: 'intro',       title: 'Introduction to ASL',        description: 'Understand the power of sign language and how it connects communities', icon: '✨', order: 1, totalXP: 60,  lessonCount: 2  },
  { id: 'alphabet_1',  title: 'ASL Alphabet - Part 1',      description: 'Learn ASL letters A to M',      icon: '🔤', order: 2, totalXP: 260, lessonCount: 13 },
  { id: 'alphabet_2',  title: 'ASL Alphabet - Part 2',      description: 'Learn ASL letters N to Z',      icon: '🔤', order: 3, totalXP: 260, lessonCount: 13 },
  { id: 'greetings', title: 'Chào hỏi & Gặp gỡ',     description: 'Học cách chào xã giao cơ bản',          icon: '👋', order: 4, totalXP: 210, lessonCount: 7  },
  { id: 'basics',    title: 'Giao tiếp thiết yếu',   description: 'Học cách bày tỏ nhu cầu cốt lõi',        icon: '💡', order: 5, totalXP: 150, lessonCount: 5  },
  { id: 'daily',     title: 'Cuộc sống hàng ngày',  description: 'Các hoạt động và địa điểm mỗi ngày',    icon: '🌅', order: 6, totalXP: 180, lessonCount: 6  },
  { id: 'family',    title: 'Gia đình & Bạn bè',   description: 'Từ vựng về những người thân thương',    icon: '👨‍👩‍👧', order: 7, totalXP: 120, lessonCount: 4  },
  { id: 'numbers',   title: 'Số đếm cơ bản',       description: 'Học đếm các chữ số thông dụng',        icon: '🔢', order: 8, totalXP: 150, lessonCount: 5  },
  { id: 'colors',    title: 'Màu sắc cơ bản',       description: 'Nhận diện màu sắc qua ký hiệu',        icon: '🎨', order: 9, totalXP: 90,  lessonCount: 3  },
];

// ── Lesson mapping ─────────────────────────────────────────────────────────────
const PATH_LESSONS = {
  intro:     ['hello', 'understand'],
  alphabet_1:  ALPHABET_SIGNS.slice(0, 13).map(s => s.id),
  alphabet_2:  ALPHABET_SIGNS.slice(13).map(s => s.id),
  greetings: ['hello', 'goodbye', 'please', 'thankyou', 'sorry', 'yes', 'no'],
  basics:    ['help', 'want', 'need', 'understand', 'like'],
  daily:     ['eat', 'drink', 'sleep', 'work', 'school', 'home'],
  family:    ['mother', 'father', 'baby', 'friend'],
  numbers:   ['one', 'two', 'three', 'five', 'ten'],
  colors:    ['blue', 'red', 'green'],
};

// ── Seed ────────────────────────────────────────────────────────────────────────
async function seedAll() {
  const now = Date.now();
  console.log('🌱 Starting Firestore full seed v2...\n');

  // 0. Clean up obsolete paths (e.g. old unified 'alphabet' path)
  console.log('🧹 Checking for obsolete learning paths to delete...');
  try {
    const pathsCol = collection(db, 'learningPaths');
    const pathsSnap = await getDocs(pathsCol);
    const activePathIds = LEARNING_PATHS.map(p => p.id);
    
    for (const pathDoc of pathsSnap.docs) {
      if (!activePathIds.includes(pathDoc.id)) {
        console.log(`🧹 Deleting obsolete path: ${pathDoc.id}...`);
        
        // Delete all lessons inside lessons subcollection first
        const lessonsCol = collection(db, 'learningPaths', pathDoc.id, 'lessons');
        const lessonsSnap = await getDocs(lessonsCol);
        for (const lessonDoc of lessonsSnap.docs) {
          await deleteDoc(doc(db, 'learningPaths', pathDoc.id, 'lessons', lessonDoc.id));
        }
        
        // Delete the path document itself
        await deleteDoc(doc(db, 'learningPaths', pathDoc.id));
        console.log(`  ✓ Cleaned up obsolete path: ${pathDoc.id}`);
      }
    }
  } catch (err) {
    console.warn('Warning during obsolete paths cleanup:', err.message);
  }

  // 1. All signs (original 30 + 26 alphabet)
  const batch1 = writeBatch(db);
  for (const sign of ALL_SIGNS) {
    const ref = doc(db, 'dictionary', sign.id);
    const videoURL = sign.videoId ? `https://www.youtube.com/watch?v=${sign.videoId}` : (sign.videoURL || '');
    const thumbnailURL = sign.videoId ? `https://img.youtube.com/vi/${sign.videoId}/hqdefault.jpg` : '';
    
    batch1.set(ref, {
      id:          sign.id,
      title:       sign.title,
      category:    sign.category,
      difficulty:  sign.difficulty,
      emoji:       sign.emoji,
      videoURL:    videoURL,
      thumbnailURL: thumbnailURL,
      description: sign.description,
      keywords:    [sign.title.toLowerCase(), sign.category.toLowerCase()],
      createdAt:   now,
    });
  }
  await batch1.commit();
  console.log(`✅ ${ALL_SIGNS.length} signs seeded → dictionary/`);

  // 2. Learning Paths
  const batch2 = writeBatch(db);
  for (const path of LEARNING_PATHS) {
    const ref = doc(db, 'learningPaths', path.id);
    batch2.set(ref, { ...path, createdAt: now });
  }
  await batch2.commit();
  console.log(`✅ ${LEARNING_PATHS.length} paths seeded → learningPaths/`);

  // 3. Lessons (subcollection)
  for (const [pathId, signIds] of Object.entries(PATH_LESSONS)) {
    const batch = writeBatch(db);
    signIds.forEach((signId, i) => {
      const lessonId = `${pathId}_${i + 1}`;
      const sign = ALL_SIGNS.find(s => s.id === signId);
      const ref = doc(db, 'learningPaths', pathId, 'lessons', lessonId);
      let lessonTitle = sign ? sign.title : signId;
      if (pathId === 'intro') {
        if (i === 0) lessonTitle = 'Why Learn Sign Language?';
        if (i === 1) lessonTitle = 'The Power of Gestures';
      }

      batch.set(ref, {
        id:       lessonId,
        pathId,
        title:    lessonTitle,
        signId,
        order:    i + 1,
        xpReward: pathId.startsWith('alphabet') ? 20 : 30,
        type:     'video',
        createdAt: now,
      });
    });
    await batch.commit();
    console.log(`  ✓ Lessons seeded for path: ${pathId} (${signIds.length} lessons)`);
  }

  console.log('\n🎉 Done! All data seeded. Run: npx expo start --android');
  process.exit(0);
}

seedAll().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
