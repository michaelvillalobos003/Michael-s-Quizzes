import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Quiz, QuizAttempt } from '../types/quiz';
import { 
  Trophy, 
  RotateCcw, 
  ListOrdered, 
  Share2, 
  Check, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface QuizResultProps {
  quiz: Quiz;
  attempt: QuizAttempt;
  onRetake: () => void;
  onBrowseQuizzes: () => void;
}

export const QuizResult: React.FC<QuizResultProps> = ({
  quiz,
  attempt,
  onRetake,
  onBrowseQuizzes,
}) => {
  const [copied, setCopied] = useState(false);
  const [showReview, setShowReview] = useState(true);

  // Trigger confetti on high score
  useEffect(() => {
    if (attempt.percentage >= 70) {
      const duration = 2.5 * 1000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: ['#6366f1', '#a855f7', '#38bdf8', '#34d399', '#f59e0b']
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: ['#6366f1', '#a855f7', '#38bdf8', '#34d399', '#f59e0b']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [attempt.percentage]);

  const handleShare = () => {
    const summary = `🏆 Michael's Quizzes: ${quiz.title}\nScore: ${attempt.score}/${attempt.totalQuestions} (${attempt.percentage}%)\n⏱️ Time: ${attempt.timeSpentTotal}s\nCan you beat my score?`;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getVerdict = (pct: number) => {
    if (pct === 100) return { title: 'Flawless Victory!', subtitle: 'You answered every single question correctly. Mastermind status!', color: 'text-emerald-400' };
    if (pct >= 80) return { title: 'Outstanding Performance!', subtitle: 'Incredible trivia mastery and quick thinking!', color: 'text-indigo-400' };
    if (pct >= 60) return { title: 'Solid Effort!', subtitle: 'Good job! A quick review of the tricky ones and you will ace it.', color: 'text-amber-400' };
    return { title: 'Keep Practicing!', subtitle: 'Every quiz is a chance to learn new fascinating facts. Try again!', color: 'text-slate-300' };
  };

  const verdict = getVerdict(attempt.percentage);

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16 animate-in fade-in duration-300">
      {/* Top Banner Card */}
      <div className="rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-8 sm:p-10 text-center shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 mb-5 shadow-inner">
          <Trophy className="w-10 h-10" />
        </div>

        <h1 className={`text-3xl sm:text-4xl font-extrabold tracking-tight mb-2 ${verdict.color}`}>
          {verdict.title}
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-md mx-auto mb-8">
          {verdict.subtitle}
        </p>

        {/* Big Score Stats Grid */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-lg mx-auto mb-8">
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
            <div className="text-2xl sm:text-3xl font-extrabold text-white">{attempt.percentage}%</div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-1">Accuracy</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
              {attempt.score}/{attempt.totalQuestions}
            </div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-1">Score</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
            <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400 flex items-center justify-center gap-1">
              <Clock className="w-5 h-5" />
              <span>{attempt.timeSpentTotal}s</span>
            </div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-1">Time Spent</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onRetake}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retake Quiz</span>
          </button>

          <button
            onClick={onBrowseQuizzes}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm transition-all flex items-center gap-2"
          >
            <ListOrdered className="w-4 h-4" />
            <span>Other Quizzes</span>
          </button>

          <button
            onClick={handleShare}
            className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-semibold text-sm transition-all flex items-center gap-2"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Share Score'}</span>
          </button>
        </div>
      </div>

      {/* Question by Question Review Accordion */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-8">
        <div 
          onClick={() => setShowReview(s => !s)}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Question Breakdown & Explanations</h2>
          </div>
          <button className="text-slate-400 hover:text-white p-1">
            {showReview ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {showReview && (
          <div className="mt-6 space-y-4">
            {quiz.questions.map((q, idx) => {
              const userAnswer = attempt.answers.find(a => a.questionId === q.id);
              const isCorrect = userAnswer?.isCorrect;
              const timedOut = userAnswer?.selectedOptionIndex === null;

              return (
                <div
                  key={q.id}
                  className={`p-5 rounded-xl border text-sm transition-all ${
                    isCorrect
                      ? 'bg-slate-950/60 border-emerald-900/40'
                      : 'bg-slate-950/60 border-rose-900/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span className="font-semibold text-white leading-snug">
                      {idx + 1}. {q.question}
                    </span>
                    <span className="shrink-0 mt-0.5">
                      {isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-400" />
                      )}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs my-3">
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block mb-0.5">Your Choice:</span>
                      <span className={isCorrect ? 'text-emerald-300 font-semibold' : 'text-rose-300 font-semibold'}>
                        {timedOut
                          ? '⏳ Timed Out / Skipped'
                          : userAnswer?.selectedOptionIndex !== undefined && userAnswer?.selectedOptionIndex !== null
                          ? q.options[userAnswer.selectedOptionIndex]
                          : 'No answer'}
                      </span>
                    </div>

                    {!isCorrect && (
                      <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-900/50">
                        <span className="text-slate-400 block mb-0.5">Correct Answer:</span>
                        <span className="text-emerald-300 font-semibold">
                          {q.options[q.correctIndex]}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-slate-400 bg-slate-900/40 p-3 rounded-lg border border-slate-800/80 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <span>{q.explanation}</span>
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
