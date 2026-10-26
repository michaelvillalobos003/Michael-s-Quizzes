import React from 'react';
import { Sparkles, PlusCircle, BarChart3, HelpCircle, Download } from 'lucide-react';

interface HeaderProps {
  currentView: 'list' | 'create' | 'stats';
  onNavigate: (view: 'list' | 'create' | 'stats') => void;
  onOpenExportImport: () => void;
  totalAttempts: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  onOpenExportImport,
  totalAttempts,
}) => {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-slate-950/80 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div 
          onClick={() => onNavigate('list')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-400 group-hover:rotate-12 transition-transform duration-300" />
            </div>
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
              Michael's Quizzes
            </span>
            <div className="text-[11px] font-medium text-indigo-400/80 -mt-0.5 flex items-center gap-1.5">
              <span>Interactive Knowledge Hub</span>
              <span className="inline-block w-1 h-1 rounded-full bg-emerald-400"></span>
              <span className="text-slate-400">{totalAttempts} played</span>
            </div>
          </div>
        </div>

        <nav className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => onNavigate('list')}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 ${
              currentView === 'list'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Quizzes</span>
          </button>

          <button
            onClick={() => onNavigate('stats')}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 ${
              currentView === 'stats'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Stats</span>
          </button>

          <button
            onClick={() => onNavigate('create')}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 ${
              currentView === 'create'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400/30'
                : 'bg-indigo-950/60 text-indigo-300 border border-indigo-700/50 hover:bg-indigo-900/40 hover:text-white'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create</span>
          </button>

          <button
            onClick={onOpenExportImport}
            title="Backup & Restore Quizzes"
            aria-label="Backup and Restore"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>
        </nav>
      </div>
    </header>
  );
};
