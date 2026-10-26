export type Difficulty = 'easy' | 'medium' | 'hard' | 'genius';

export type Category = 
  | 'Science & Space'
  | 'Code & Technology'
  | 'Cinema & TV'
  | 'World History & Wonders'
  | 'Gaming & Anime'
  | 'Logic & Riddles'
  | 'Music & Arts'
  | 'Sports & Athletics'
  | 'Custom';

export type GameMode = 'classic' | 'blitz' | 'survival' | 'practice' | 'daily';

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  funFact?: string;
  hint?: string;
  codeSnippet?: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  category: Category;
  difficulty: Difficulty;
  timeLimitSeconds: number; // seconds per question (or total in blitz)
  questions: Question[];
  iconName: string;
  colorGradient: string; // Tailwind gradient classes
  isCustom?: boolean;
  author?: string;
  createdAt?: string;
}

export interface AnswerRecord {
  questionId: string;
  questionText: string;
  selectedOptionIndex: number | null; // null if timed out or skipped
  correctOptionIndex: number;
  isCorrect: boolean;
  timeSpentSeconds: number;
  explanation: string;
  funFact?: string;
}

export interface QuizResult {
  id: string;
  quizId: string;
  quizTitle: string;
  category: Category;
  mode: GameMode;
  totalQuestions: number;
  correctCount: number;
  score: number;
  xpEarned: number;
  accuracy: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
  maxStreak: number;
  completedAt: string;
  answers: AnswerRecord[];
  timeTakenSeconds: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  category: 'score' | 'streak' | 'creator' | 'milestone';
}

export interface UserProfile {
  name: string;
  avatar: string;
  level: number;
  xp: number;
  totalQuizzesPlayed: number;
  totalQuestionsAnswered: number;
  totalCorrect: number;
  longestStreak: number;
  dailyStreakDays: number;
  lastDailyChallengeDate?: string;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: string;
  score: number;
  accuracy: number;
  quizzesCompleted: number;
  isUser?: boolean;
}
