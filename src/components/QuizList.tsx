import React, { useState } from 'react';
import { Quiz, Category, Difficulty } from '../types/quiz';
import { quizService } from '../services/quizService';
import { 
  Play, 
  Clock, 
  Award, 
  Search, 
  Code, 
  Globe2, 
  Film, 
  Atom, 
  Gamepad2, 
  PenTool, 
  Sparkles,
  Trash2,
  Edit3,
  HelpCircle
} from 'lucide-react';

interface QuizListProps {
  quizzes: Quiz[];
  onStartQuiz: (quiz: Quiz) => void;
  onEditQuiz: (quiz: Quiz) => void;
  onDeleteQuiz: (quizId: string) => void;
  onCreateNew: () => void;
}

const CATEGORIES: Category[] = ['Tech', 'Geography', 'Science', 'Pop Culture', 'Gaming', 'Custom'];
const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

export const QuizList: React.FC<QuizListProps> = ({
  quizzes,
  onStartQuiz,
  onEditQuiz,
  onDeleteQuiz,
  onCreateNew,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesCategory = selectedCategory === 'All' || 
      (selectedCategory === 'Custom' ? quiz.isCustom : quiz.category === selectedCategory);
    
    const matchesDifficulty = selectedDifficulty === 'All' || quiz.difficulty === selectedDifficulty;
    
    const matchesSearch = 
      quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quiz.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesDifficulty && matchesSearch;
  });

  const getCategoryIcon = (category: Category) => {
    switch (category) {
      case 'Tech': return <Code className="w-4 h-4 text-cyan-400" />;
      case 'Geography': return <Globe2 className="w-4 h-4 text-emerald-400" />;
      case 'Science': return <Atom className="w-4 h-4 text-purple-400" />;
      case 'Pop Culture': return <Film className="w-4 h-4 text-amber-400" />;
      case 'Gaming': return <Gamepad2 className="w-4 h-4 text-rose-400" />;
      default: return <PenTool className="w-4 h-4 text-indigo-400" />;
    }
  };

  const getDifficultyBadge = (difficulty: Difficulty) => {
    switch (difficulty) {
      case 'easy':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/70 text-emerald-400 border border-emerald-800/40">Easy</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-950/70 text-amber-400 border border-amber-800/40">Medium</span>;
      case 'hard':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-950/70 text-rose-400 border border-rose-800/40">Hard</span>;
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 border border-indigo-900/40 p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-12 w-48 h-48 bg-violet-500/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Curated Knowledge & Custom Challenges
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mb-3">
            Challenge Your Mind with Michael's Quizzes
          </h1>
          <p className="text-slate-300 text-base leading-relaxed mb-6">
            Test yourself across engineering, world trivia, cinema, astrophysics, and custom questions. 
            Track high scores, beat the timer, or build your own quiz challenge in seconds!
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="/quiz-take.html?daily=true"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 hover:translate-y-[-1px]"
            >
              <span>🔥 Play Daily Challenge ($50/Q)</span>
            </a>
            <a
              href="/quiz-take.html?id=1"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 hover:translate-y-[-1px]"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Take Kid/Teen Quizzes</span>
            </a>
            <button
              onClick={() => {
                if (quizzes.length > 0) {
                  const random = quizzes[Math.floor(Math.random() * quizzes.length)];
                  onStartQuiz(random);
                }
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 font-semibold text-sm transition-all flex items-center gap-2"
            >
              Surprise Me
            </button>
            <button
              onClick={onCreateNew}
              className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 font-semibold text-sm transition-all flex items-center gap-2"
            >
              <PenTool className="w-4 h-4" />
              Build Quiz
            </button>
          </div>
        </div>
      </section>

      {/* Filters and Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search quizzes by title or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Difficulty:</span>
            {['All', ...DIFFICULTIES].map(diff => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                  selectedDifficulty === diff
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800/80'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

        {/* Categories Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              selectedCategory === 'All'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            All Categories ({quizzes.length})
          </button>
          {CATEGORIES.map(category => {
            const count = quizzes.filter(q => category === 'Custom' ? q.isCustom : q.category === category).length;
            const isSelected = selectedCategory === category;
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {getCategoryIcon(category)}
                <span>{category}</span>
                <span className="text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quiz Cards Grid */}
      {filteredQuizzes.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/60">
          <p className="text-slate-400 text-sm mb-4">No quizzes match your current filter or search criteria.</p>
          <button
            onClick={() => { setSelectedCategory('All'); setSelectedDifficulty('All'); setSearchQuery(''); }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-500 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredQuizzes.map(quiz => {
            const bestScore = quizService.getQuizBestScore(quiz.id);
            const estTime = Math.ceil((quiz.questions.length * (quiz.timeLimitSeconds || 20)) / 60);

            return (
              <div
                key={quiz.id}
                className="group relative flex flex-col justify-between rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-indigo-600/50 p-6 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-950/40 hover:-translate-y-1"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="p-2 rounded-lg bg-slate-800 border border-slate-700/50">
                        {getCategoryIcon(quiz.category)}
                      </span>
                      <span className="text-xs font-medium text-slate-400">{quiz.category}</span>
                      {quiz.isCustom && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-950 text-indigo-400 border border-indigo-800/60 font-semibold">
                          Custom
                        </span>
                      )}
                    </div>
                    {getDifficultyBadge(quiz.difficulty)}
                  </div>

                  <h3 className="font-bold text-lg text-white group-hover:text-indigo-300 transition-colors line-clamp-1 mb-2">
                    {quiz.title}
                  </h3>
                  
                  <p className="text-slate-400 text-sm line-clamp-2 mb-4 leading-relaxed">
                    {quiz.description}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between py-2 border-t border-slate-800/80 text-xs text-slate-400 mb-4">
                    <span className="flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                      {quiz.questions.length} questions
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      ~{estTime} min
                    </span>
                    {bestScore !== null ? (
                      <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                        <Award className="w-3.5 h-3.5" />
                        Best: {bestScore}%
                      </span>
                    ) : (
                      <span className="text-slate-500">Unplayed</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onStartQuiz(quiz)}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 active:scale-95"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      Play Now
                    </button>

                    {quiz.isCustom && (
                      <>
                        <button
                          onClick={() => onEditQuiz(quiz)}
                          title="Edit Quiz"
                          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete quiz "${quiz.title}"?`)) {
                              onDeleteQuiz(quiz.id);
                            }
                          }}
                          title="Delete Quiz"
                          className="p-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
