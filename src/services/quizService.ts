import { Quiz, QuizAttempt } from '../types/quiz';
import { SAMPLE_QUIZZES } from '../data/sampleQuizzes';

const CUSTOM_QUIZZES_KEY = 'michaels_quizzes_custom';
const ATTEMPTS_KEY = 'michaels_quizzes_attempts';

export const quizService = {
  getAllQuizzes(): Quiz[] {
    try {
      const stored = localStorage.getItem(CUSTOM_QUIZZES_KEY);
      const customQuizzes: Quiz[] = stored ? JSON.parse(stored) : [];
      return [...SAMPLE_QUIZZES, ...customQuizzes];
    } catch (e) {
      console.warn('Failed to load custom quizzes from storage', e);
      return SAMPLE_QUIZZES;
    }
  },

  getQuizById(id: string): Quiz | undefined {
    const all = this.getAllQuizzes();
    return all.find(q => q.id === id);
  },

  saveCustomQuiz(quiz: Omit<Quiz, 'id' | 'createdAt' | 'isCustom'> & { id?: string }): Quiz {
    try {
      const stored = localStorage.getItem(CUSTOM_QUIZZES_KEY);
      const customQuizzes: Quiz[] = stored ? JSON.parse(stored) : [];

      if (quiz.id) {
        // Edit existing
        const index = customQuizzes.findIndex(q => q.id === quiz.id);
        if (index >= 0) {
          const updated: Quiz = {
            ...customQuizzes[index],
            ...quiz,
            isCustom: true
          };
          customQuizzes[index] = updated;
          localStorage.setItem(CUSTOM_QUIZZES_KEY, JSON.stringify(customQuizzes));
          return updated;
        }
      }

      // Create new
      const newQuiz: Quiz = {
        ...quiz,
        id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        createdAt: new Date().toISOString(),
        isCustom: true
      };

      customQuizzes.unshift(newQuiz);
      localStorage.setItem(CUSTOM_QUIZZES_KEY, JSON.stringify(customQuizzes));
      return newQuiz;
    } catch (e) {
      console.error('Failed to save quiz', e);
      throw e;
    }
  },

  deleteCustomQuiz(id: string): boolean {
    try {
      const stored = localStorage.getItem(CUSTOM_QUIZZES_KEY);
      if (!stored) return false;
      const customQuizzes: Quiz[] = JSON.parse(stored);
      const filtered = customQuizzes.filter(q => q.id !== id);
      localStorage.setItem(CUSTOM_QUIZZES_KEY, JSON.stringify(filtered));
      return true;
    } catch (e) {
      console.error('Failed to delete custom quiz', e);
      return false;
    }
  },

  getAttempts(): QuizAttempt[] {
    try {
      const stored = localStorage.getItem(ATTEMPTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.warn('Failed to load quiz attempts', e);
      return [];
    }
  },

  saveAttempt(attempt: Omit<QuizAttempt, 'id' | 'completedAt'>): QuizAttempt {
    try {
      const attempts = this.getAttempts();
      const newAttempt: QuizAttempt = {
        ...attempt,
        id: `attempt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        completedAt: new Date().toISOString()
      };
      attempts.unshift(newAttempt);
      localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts.slice(0, 100))); // keep latest 100
      return newAttempt;
    } catch (e) {
      console.error('Failed to save attempt', e);
      throw e;
    }
  },

  getQuizBestScore(quizId: string): number | null {
    const attempts = this.getAttempts().filter(a => a.quizId === quizId);
    if (attempts.length === 0) return null;
    return Math.max(...attempts.map(a => a.percentage));
  },

  clearHistory(): void {
    localStorage.removeItem(ATTEMPTS_KEY);
  },

  exportData(): string {
    const custom = localStorage.getItem(CUSTOM_QUIZZES_KEY) || '[]';
    const attempts = localStorage.getItem(ATTEMPTS_KEY) || '[]';
    return JSON.stringify({
      version: 1,
      customQuizzes: JSON.parse(custom),
      attempts: JSON.parse(attempts),
      exportedAt: new Date().toISOString()
    }, null, 2);
  },

  importData(jsonString: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed.customQuizzes)) {
        localStorage.setItem(CUSTOM_QUIZZES_KEY, JSON.stringify(parsed.customQuizzes));
      }
      if (Array.isArray(parsed.attempts)) {
        localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(parsed.attempts));
      }
      return { success: true, message: 'Data imported successfully!' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid JSON file';
      return { success: false, message: `Import error: ${msg}` };
    }
  }
};
