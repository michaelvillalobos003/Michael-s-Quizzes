import { useState, useEffect } from 'react';
import { Quiz, QuizAttempt, UserAnswer } from './types/quiz';
import { quizService } from './services/quizService';
import { Header } from './components/Header';
import { QuizList } from './components/QuizList';
import { QuizPlayer } from './components/QuizPlayer';
import { QuizResult } from './components/QuizResult';
import { QuizCreator } from './components/QuizCreator';
import { StatsView } from './components/StatsView';
import { ExportImportModal } from './components/ExportImportModal';

type AppView = 'list' | 'play' | 'result' | 'create' | 'stats';

export function App() {
  const [view, setView] = useState<AppView>('list');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [activeAttempt, setActiveAttempt] = useState<QuizAttempt | null>(null);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [isExportImportOpen, setIsExportImportOpen] = useState(false);

  // Load quizzes and attempts on mount
  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setQuizzes(quizService.getAllQuizzes());
    setAttempts(quizService.getAttempts());
  };

  const handleStartQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setActiveAttempt(null);
    setView('play');
  };

  const handleCompleteQuiz = (answers: UserAnswer[], totalTime: number) => {
    if (!activeQuiz) return;

    const correctCount = answers.filter(a => a.isCorrect).length;
    const totalQ = activeQuiz.questions.length;
    const percentage = totalQ > 0 ? Math.round((correctCount / totalQ) * 100) : 0;

    const savedAttempt = quizService.saveAttempt({
      quizId: activeQuiz.id,
      quizTitle: activeQuiz.title,
      score: correctCount,
      totalQuestions: totalQ,
      percentage,
      timeSpentTotal: totalTime,
      answers
    });

    setActiveAttempt(savedAttempt);
    setAttempts(quizService.getAttempts());
    setView('result');
  };

  const handleSaveQuiz = (quizData: Omit<Quiz, 'id' | 'createdAt' | 'isCustom'> & { id?: string }) => {
    quizService.saveCustomQuiz(quizData);
    refreshData();
    setEditingQuiz(null);
    setView('list');
  };

  const handleDeleteQuiz = (quizId: string) => {
    quizService.deleteCustomQuiz(quizId);
    refreshData();
  };

  const handleEditQuiz = (quiz: Quiz) => {
    setEditingQuiz(quiz);
    setView('create');
  };

  const handleRetakeQuiz = (quizId: string) => {
    const q = quizService.getQuizById(quizId);
    if (q) {
      handleStartQuiz(q);
    }
  };

  const handleClearHistory = () => {
    quizService.clearHistory();
    setAttempts([]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      <Header
        currentView={view === 'play' || view === 'result' ? 'list' : view}
        onNavigate={(newView) => {
          if (newView === 'create') setEditingQuiz(null);
          setView(newView);
        }}
        onOpenExportImport={() => setIsExportImportOpen(true)}
        totalAttempts={attempts.length}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        {view === 'list' && (
          <QuizList
            quizzes={quizzes}
            onStartQuiz={handleStartQuiz}
            onEditQuiz={handleEditQuiz}
            onDeleteQuiz={handleDeleteQuiz}
            onCreateNew={() => {
              setEditingQuiz(null);
              setView('create');
            }}
          />
        )}

        {view === 'play' && activeQuiz && (
          <QuizPlayer
            quiz={activeQuiz}
            onComplete={handleCompleteQuiz}
            onExit={() => setView('list')}
          />
        )}

        {view === 'result' && activeQuiz && activeAttempt && (
          <QuizResult
            quiz={activeQuiz}
            attempt={activeAttempt}
            onRetake={() => handleStartQuiz(activeQuiz)}
            onBrowseQuizzes={() => setView('list')}
          />
        )}

        {view === 'create' && (
          <QuizCreator
            initialQuiz={editingQuiz}
            onSave={handleSaveQuiz}
            onCancel={() => {
              setEditingQuiz(null);
              setView('list');
            }}
          />
        )}

        {view === 'stats' && (
          <StatsView
            attempts={attempts}
            onRetakeQuiz={handleRetakeQuiz}
            onClearHistory={handleClearHistory}
            onBrowseQuizzes={() => setView('list')}
          />
        )}
      </main>

      <ExportImportModal
        isOpen={isExportImportOpen}
        onClose={() => setIsExportImportOpen(false)}
        onDataChanged={refreshData}
      />

      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>Michael's Quizzes • Designed for curious minds & trivia lovers</p>
      </footer>
    </div>
  );
}

export default App;
