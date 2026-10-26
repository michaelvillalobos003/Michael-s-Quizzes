export type Difficulty = 'easy' | 'medium' | 'hard';

export type Category = 'Tech' | 'Geography' | 'Pop Culture' | 'Science' | 'Gaming' | 'Custom';

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  category: Category;
  difficulty: Difficulty;
  timeLimitSeconds: number; // 0 for untimed, or seconds per question
  questions: Question[];
  createdAt: string;
  isCustom?: boolean;
}

export interface UserAnswer {
  questionId: string;
  selectedOptionIndex: number | null; // null if timed out / skipped
  isCorrect: boolean;
  timeSpentSeconds: number;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  quizTitle: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  timeSpentTotal: number;
  answers: UserAnswer[];
  completedAt: string;
}
