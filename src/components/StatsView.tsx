import React from 'react';
import { QuizAttempt } from '../types/quiz';
import { 
  BarChart3, 
  Trophy, 
  Clock, 
  CheckCircle2, 
  Trash2, 
  RotateCcw, 
  Calendar,
  Sparkles
} from 'lucide-react';

interface StatsViewProps {
  attempts: QuizAttempt[];
  onRetakeQuiz: (quizId: string) => void;
  onClearHistory: () => void;
  onBrowseQuizzes: () => void;
}

export const StatsView: React.FC<StatsViewProps> = ({
  attempts,
  onRetakeQuiz,
  onClearHistory,
  onBrowseQuizzes,
}) => {
  const totalAttempts = attempts.length;
  const avgAccuracy = totalAttempts > 0 
    ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / totalAttempts) 
    : 0;
  const highestScore = totalAttempts > 0 
    ? Math.max(...attempts.map(a => a.percentage)) 
    : 0;
  const totalTimeSeconds = attempts.reduce((sum, a) => sum + a.timeSpentTotal, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 animate-in fade-in duration-200">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-indigo-400" />
            <span>Performance & History</span>
          </h1>
          <p className="text-slate-400 text-sm">
            Insights on your quiz completions, knowledge strengths, and past runs.
          </p>
        </div>

        {totalAttempts > 0 && (
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to clear your quiz history?')) {
                onClearHistory();
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 text-xs font-semibold transition-all flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Total Quizzes</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">{totalAttempts}</div>
          <div className="text-[11px] text-slate-500 mt-1">Completed runs</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Avg. Accuracy</span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">{avgAccuracy}%</div>
          <div className="text-[11px] text-slate-500 mt-1">Across all quizzes</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Top Score</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">{highestScore}%</div>
          <div className="text-[11px] text-slate-500 mt-1">Personal best</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Time Spent</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400">
            {Math.round(totalTimeSeconds / 60)}m {totalTimeSeconds % 60}s
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Total active play</div>
        </div>
      </div>

      {/* Attempt History List */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
        <h2 className="text-base font-bold text-white">Recent Attempts</h2>

        {totalAttempts === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            <p className="mb-4">You have not taken any quizzes yet!</p>
            <button
              onClick={onBrowseQuizzes}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all"
            >
              Browse Quizzes
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {attempts.map(attempt => {
              const formattedDate = new Date(attempt.completedAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={attempt.id}
                  className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                >
                  <div>
                    <h3 className="font-semibold text-sm text-white">{attempt.quizTitle}</h3>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {formattedDate}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {attempt.timeSpentTotal}s
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className={`text-base font-bold ${
                        attempt.percentage >= 80 ? 'text-emerald-400' :
                        attempt.percentage >= 60 ? 'text-amber-400' : 'text-slate-300'
                      }`}>
                        {attempt.percentage}%
                      </span>
                      <div className="text-[11px] text-slate-500 font-medium">
                        {attempt.score} of {attempt.totalQuestions}
                      </div>
                    </div>

                    <button
                      onClick={() => onRetakeQuiz(attempt.quizId)}
                      title="Retake Quiz"
                      className="p-2 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
