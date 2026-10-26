import React, { useState } from 'react';
import { Quiz, Question, Category, Difficulty } from '../types/quiz';
import { 
  Plus, 
  Trash2, 
  Save, 
  X, 
  HelpCircle, 
  Clock, 
  AlertCircle
} from 'lucide-react';

interface QuizCreatorProps {
  initialQuiz?: Quiz | null;
  onSave: (quizData: Omit<Quiz, 'id' | 'createdAt' | 'isCustom'> & { id?: string }) => void;
  onCancel: () => void;
}

const CATEGORIES: Category[] = ['Tech', 'Geography', 'Science', 'Pop Culture', 'Gaming', 'Custom'];
const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

export const QuizCreator: React.FC<QuizCreatorProps> = ({
  initialQuiz,
  onSave,
  onCancel,
}) => {
  const [title, setTitle] = useState(initialQuiz?.title || '');
  const [description, setDescription] = useState(initialQuiz?.description || '');
  const [category, setCategory] = useState<Category>(initialQuiz?.category || 'Custom');
  const [difficulty, setDifficulty] = useState<Difficulty>(initialQuiz?.difficulty || 'medium');
  const [timeLimitSeconds, setTimeLimitSeconds] = useState<number>(initialQuiz?.timeLimitSeconds ?? 20);

  const [questions, setQuestions] = useState<Question[]>(
    initialQuiz?.questions || [
      {
        id: `q-${Date.now()}-1`,
        question: '',
        options: ['', '', '', ''],
        correctIndex: 0,
        explanation: ''
      }
    ]
  );

  const [error, setError] = useState<string | null>(null);

  const handleAddQuestion = () => {
    setQuestions(prev => [
      ...prev,
      {
        id: `q-${Date.now()}-${prev.length + 1}`,
        question: '',
        options: ['', '', '', ''],
        correctIndex: 0,
        explanation: ''
      }
    ]);
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length <= 1) {
      setError('A quiz must have at least one question.');
      return;
    }
    setQuestions(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleQuestionTextChange = (index: number, text: string) => {
    setQuestions(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], question: text };
      return copy;
    });
  };

  const handleOptionChange = (qIndex: number, optIndex: number, text: string) => {
    setQuestions(prev => {
      const copy = [...prev];
      const opts = [...copy[qIndex].options];
      opts[optIndex] = text;
      copy[qIndex] = { ...copy[qIndex], options: opts };
      return copy;
    });
  };

  const handleCorrectIndexChange = (qIndex: number, optIndex: number) => {
    setQuestions(prev => {
      const copy = [...prev];
      copy[qIndex] = { ...copy[qIndex], correctIndex: optIndex };
      return copy;
    });
  };

  const handleExplanationChange = (index: number, text: string) => {
    setQuestions(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], explanation: text };
      return copy;
    });
  };

  const handleValidateAndSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Please provide a quiz title.');
      return;
    }

    if (questions.length === 0) {
      setError('Please add at least one question.');
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        setError(`Question #${i + 1} has an empty question statement.`);
        return;
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].trim()) {
          setError(`Question #${i + 1} option ${j + 1} is empty.`);
          return;
        }
      }
    }

    onSave({
      id: initialQuiz?.id,
      title: title.trim(),
      description: description.trim() || 'Created with Michael’s Quiz Creator',
      category,
      difficulty,
      timeLimitSeconds,
      questions
    });
  };

  return (
    <form onSubmit={handleValidateAndSave} className="max-w-4xl mx-auto space-y-8 pb-16 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {initialQuiz ? 'Edit Custom Quiz' : 'Create Custom Quiz'}
          </h1>
          <p className="text-slate-400 text-sm">
            Design multiple-choice trivia with custom timers and answer explanations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors flex items-center gap-1.5"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>

          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>Save Quiz</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Quiz Details Config */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-200">Quiz Overview</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Quiz Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Master of Linux Commands & Shell Scripting"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Description</label>
            <textarea
              rows={2}
              placeholder="Brief summary of what players will be tested on..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 capitalize"
            >
              {DIFFICULTIES.map(d => (
                <option key={d} value={d} className="capitalize">{d}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Time Limit Per Question</span>
            </label>
            <select
              value={timeLimitSeconds}
              onChange={(e) => setTimeLimitSeconds(Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value={0}>Untimed (Casual Mode)</option>
              <option value={10}>10 Seconds (Speedrun)</option>
              <option value={15}>15 Seconds</option>
              <option value={20}>20 Seconds (Standard)</option>
              <option value={30}>30 Seconds</option>
              <option value={45}>45 Seconds</option>
              <option value={60}>60 Seconds</option>
            </select>
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-400" />
            <span>Questions ({questions.length})</span>
          </h2>

          <button
            type="button"
            onClick={handleAddQuestion}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Question</span>
          </button>
        </div>

        {questions.map((q, qIdx) => (
          <div key={q.id} className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Question #{qIdx + 1}
              </span>

              {questions.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveQuestion(qIdx)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                  title="Remove this question"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="space-y-1.5">
              <input
                type="text"
                required
                placeholder="Enter question prompt..."
                value={q.question}
                onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* 4 Choices */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400">
                Answer Options (select radio button for the correct answer):
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {q.options.map((opt, optIdx) => (
                  <div
                    key={optIdx}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
                      q.correctIndex === optIdx
                        ? 'bg-emerald-950/30 border-emerald-500/50'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`correct-${q.id}`}
                      checked={q.correctIndex === optIdx}
                      onChange={() => handleCorrectIndexChange(qIdx, optIdx)}
                      className="w-4 h-4 text-emerald-500 focus:ring-emerald-400 focus:ring-offset-slate-900 ml-1 cursor-pointer"
                    />
                    <input
                      type="text"
                      required
                      placeholder={`Option ${optIdx + 1}`}
                      value={opt}
                      onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                      className="flex-1 bg-transparent border-0 text-sm text-white placeholder-slate-500 focus:outline-none"
                    />
                    {q.correctIndex === optIdx && (
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mr-1">
                        Correct
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Explanation */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-semibold text-slate-400">
                Explanation (shown to player after answering):
              </label>
              <input
                type="text"
                placeholder="e.g. This was discovered in 1928 by Alexander Fleming..."
                value={q.explanation}
                onChange={(e) => handleExplanationChange(qIdx, e.target.value)}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={handleAddQuestion}
          className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-800 hover:border-indigo-500/50 bg-slate-900/40 hover:bg-slate-900 text-slate-400 hover:text-indigo-300 text-sm font-semibold transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Another Question</span>
        </button>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>Save Quiz</span>
        </button>
      </div>
    </form>
  );
};
