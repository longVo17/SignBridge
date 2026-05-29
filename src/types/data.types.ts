// Sign dictionary entry
export interface Sign {
  id: string;
  title: string;          // "Hello", "Thank You"
  category: string;       // "Greetings", "Numbers", "Family"
  difficulty: 'Easy' | 'Medium' | 'Hard';
  emoji: string;          // Quick visual identifier e.g. "👋"
  videoURL: string;       // Cloudinary CDN URL (mp4), empty string nếu chưa có
  thumbnailURL?: string;  // Cloudinary thumbnail (optional)
  description: string;
  keywords: string[];     // For search
  createdAt: number;
}


// Learning path
export interface LearningPath {
  id: string;
  title: string;
  description: string;
  icon: string;           // Emoji icon
  order: number;
  totalXP: number;
  lessonCount: number;
}

// Individual lesson inside a path
export interface Lesson {
  id: string;
  pathId: string;
  title: string;
  signId: string;         // References Sign.id
  order: number;
  xpReward: number;
  type: 'video' | 'practice' | 'quiz';
}

// User progress tracking
export interface UserProgress {
  uid: string;
  completedLessons: string[];           // lesson IDs
  completedPaths: string[];             // path IDs
  totalXP: number;
  streakDays: number;
  lastPracticeDate: string;
  lessonXP: Record<string, number>;     // { "basics_1": 30 } — XP per lesson
  quizScores: Record<string, number>;   // { "basics_1": 85 } — quiz score % per lesson
}

// Practice session result
export interface PracticeResult {
  id: string;
  uid: string;
  signId: string;
  signTitle: string;
  score: number;          // 0-100
  timestamp: number;
}

// Flashcard review progress (persisted per user per path)
export interface FlashCardProgress {
  pathId: string;
  masteredSignIds: string[];     // Sign IDs the user has mastered
  unmasteredSignIds: string[];   // Sign IDs still learning
  lastReviewDate: string;        // ISO timestamp
  totalReviews: number;          // Total review sessions completed
  completionRate: number;        // 0-100 percentage
}
