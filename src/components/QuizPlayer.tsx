import React, { useState, useEffect, useCallback } from 'react';
import { Quiz, UserAnswer } from '../types/quiz';
import { 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  X,
  Volume2,
  VolumeX,
  Info
} from 'lucide-react';

interface QuizPlayerProps {
  quiz: Quiz;
  onComplete: (answers: UserAnswer[], totalTime: number) => void;
  onExit: () => void;
}

export const QuizPlayer: React.FC<QuizPlayerProps> = ({
  quiz,
  onComplete,
  onExit,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const currentQuestion = quiz.questions[currentIndex];
  const timeLimit = quiz.timeLimitSeconds > 0 ? quiz.timeLimitSeconds : 0;
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [totalTimeSpent, setTotalTimeSpent] = useState<number>(0);

  // Sound effects using Web Audio API (no external asset dependencies)
  const playSound = useCallback((type: 'correct' | 'wrong' | 'timeout' | 'click') => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'correct') {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === 'wrong' || type === 'timeout') {
        osc.frequency.setValueAtTime(260, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      }
    } catch {
      // AudioContext unavailable or blocked
    }
  }, [soundEnabled]);

  // Handle option selection
  const handleSelectOption = useCallback((index: number) => {
    if (isAnswerRevealed) return;
    
    setSelectedOption(index);
    setIsAnswerRevealed(true);
    
    const isCorrect = index === currentQuestion.correctIndex;
    playSound(isCorrect ? 'correct' : 'wrong');

    const spent = Math.max(1, Math.round((Date.now() - questionStartTime) / 1000));
    setTotalTimeSpent(prev => prev + spent);

    const answerRecord: UserAnswer = {
      questionId: currentQuestion.id,
      selectedOptionIndex: index,
      isCorrect,
      timeSpentSeconds: spent
    };

    setAnswers(prev => [...prev, answerRecord]);
  }, [currentQuestion, isAnswerRevealed, playSound, questionStartTime]);

  // Timer countdown
  useEffect(() => {
    if (timeLimit <= 0 || isAnswerRevealed) return;

    setTimeLeft(timeLimit);
    setQuestionStartTime(Date.now());

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Timed out!
          setSelectedOption(null);
          setIsAnswerRevealed(true);
          playSound('timeout');

          const spent = timeLimit;
          setTotalTimeSpent(t => t + spent);

          setAnswers(a => [
            ...a,
            {
              questionId: currentQuestion.id,
              selectedOptionIndex: null,
              isCorrect: false,
              timeSpentSeconds: spent
            }
          ]);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIndex, currentQuestion.id, isAnswerRevealed, playSound, timeLimit]);

  // Keyboard navigation (keys 1-4, a-d, Enter/Space for next)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['input', 'textarea'].includes((e.target as HTMLElement).tagName.toLowerCase())) return;

      if (!isAnswerRevealed) {
        if (['1', 'a', 'A'].includes(e.key) && currentQuestion.options[0]) handleSelectOption(0);
        else if (['2', 'b', 'B'].includes(e.key) && currentQuestion.options[1]) handleSelectOption(1);
        else if (['3', 'c', 'C'].includes(e.key) && currentQuestion.options[2]) handleSelectOption(2);
        else if (['4', 'd', 'D'].includes(e.key) && currentQuestion.options[3]) handleSelectOption(3);
      } else {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleNextQuestion();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const handleNextQuestion = () => {
    if (currentIndex + 1 < quiz.questions.length) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswerRevealed(false);
      setTimeLeft(timeLimit);
      setQuestionStartTime(Date.now());
    } else {
      // Completed!
      onComplete(answers, totalTimeSpent);
    }
  };

  const letters = ['A', 'B', 'C', 'D'];
  const progressPercent = ((currentIndex + 1) / quiz.questions.length) * 100;
  const isTimeCritical = timeLimit > 0 && timeLeft <= 5 && !isAnswerRevealed;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Bar with Quiz metadata, progress, and exit */}
      <div className="flex items-center justify-between text-sm text-slate-400 pb-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-200">{quiz.title}</span>
          <span>•</span>
          <span>Question {currentIndex + 1} of {quiz.questions.length}</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundEnabled(s => !s)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-indigo-400" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={() => {
              if (window.confirm('Quit this quiz? Your current progress will be lost.')) {
                onExit();
              }
            }}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
            title="Exit Quiz"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar & Countdown Timer */}
      <div className="space-y-2">
        <div className="w-full bg-slate-800/80 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {timeLimit > 0 && (
          <div className="flex items-center justify-between text-xs px-1">
            <span className="text-slate-400">Time per question</span>
            <div className={`flex items-center gap-1.5 font-bold tabular-nums ${
              isTimeCritical ? 'text-rose-400 animate-pulse' : 'text-indigo-300'
            }`}>
              <Clock className="w-3.5 h-3.5" />
              <span>{timeLeft}s remaining</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Question Card */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-40 h-40 bg-indigo-600/5 rounded-full blur-2xl pointer-events-none"></div>

        <div className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">
          Question #{currentIndex + 1}
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug mb-8">
          {currentQuestion.question}
        </h2>

        {/* Options */}
        <div className="space-y-3">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = selectedOption === idx;
            const isCorrect = currentQuestion.correctIndex === idx;

            let buttonStyle = 'bg-slate-800/60 border-slate-700/80 text-slate-200 hover:bg-slate-800 hover:border-indigo-500/50';

            if (isAnswerRevealed) {
              if (isCorrect) {
                buttonStyle = 'bg-emerald-950/70 border-emerald-500/80 text-emerald-200 ring-2 ring-emerald-500/40';
              } else if (isSelected && !isCorrect) {
                buttonStyle = 'bg-rose-950/70 border-rose-500/80 text-rose-200 ring-2 ring-rose-500/40';
              } else {
                buttonStyle = 'bg-slate-900/60 border-slate-800 text-slate-500 opacity-60';
              }
            }

            return (
              <button
                key={idx}
                disabled={isAnswerRevealed}
                onClick={() => handleSelectOption(idx)}
                className={`w-full p-4 rounded-xl border text-left font-medium transition-all duration-200 flex items-center justify-between group active:scale-[0.99] ${buttonStyle}`}
              >
                <div className="flex items-center gap-3.5">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
                    isAnswerRevealed && isCorrect
                      ? 'bg-emerald-500 text-slate-950'
                      : isAnswerRevealed && isSelected && !isCorrect
                      ? 'bg-rose-500 text-white'
                      : 'bg-slate-700/60 text-slate-300 group-hover:bg-indigo-600 group-hover:text-white'
                  }`}>
                    {letters[idx] || idx + 1}
                  </span>
                  <span className="text-sm sm:text-base leading-snug">{option}</span>
                </div>

                {isAnswerRevealed && (
                  <div>
                    {isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                    {isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-400 shrink-0" />}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Answer Explanation & Next Action */}
        {isAnswerRevealed && (
          <div className="mt-6 pt-6 border-t border-slate-800 space-y-4 animate-in fade-in duration-300">
            <div className={`p-4 rounded-xl border flex items-start gap-3 ${
              selectedOption === currentQuestion.correctIndex
                ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-200'
                : 'bg-amber-950/40 border-amber-800/50 text-amber-200'
            }`}>
              {selectedOption === currentQuestion.correctIndex ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : selectedOption === null ? (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div className="text-xs sm:text-sm">
                <span className="font-bold block mb-1">
                  {selectedOption === currentQuestion.correctIndex
                    ? 'Correct Answer!'
                    : selectedOption === null
                    ? 'Time Expired!'
                    : `Incorrect. The correct answer was "${currentQuestion.options[currentQuestion.correctIndex]}".`}
                </span>
                <p className="opacity-90 leading-relaxed text-slate-300">
                  {currentQuestion.explanation}
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleNextQuestion}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 active:scale-95"
              >
                <span>{currentIndex + 1 < quiz.questions.length ? 'Next Question' : 'View Final Score'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="text-center text-xs text-slate-500">
        Tip: Press numbers <span className="font-semibold text-slate-400">1 - 4</span> or letters <span className="font-semibold text-slate-400">A - D</span> on your keyboard to answer quickly!
      </div>
    </div>
  );
};
