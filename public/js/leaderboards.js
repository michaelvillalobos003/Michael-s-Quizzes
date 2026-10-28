// Michael's Quizzes - Phase 4 Leaderboard Client Engine

(function () {
  'use strict';

  // Current User Header
  const storedUser = localStorage.getItem('quiz_user');
  let currentUser = storedUser ? JSON.parse(storedUser) : { id: 1, username: 'Michael', balance: 850 };
  const headerBalanceEl = document.getElementById('header-balance');
  if (headerBalanceEl) headerBalanceEl.textContent = `$${currentUser.balance || 0}`;

  // Tabs
  const tabBalanceBtn = document.getElementById('tab-balance-btn');
  const tabOverallBtn = document.getElementById('tab-overall-btn');
  const tabQuizBtn = document.getElementById('tab-quiz-btn');

  const tabBalanceContent = document.getElementById('tab-balance-content');
  const tabOverallContent = document.getElementById('tab-overall-content');
  const tabQuizContent = document.getElementById('tab-quiz-content');

  // Tab 1 Elements
  const balanceLoading = document.getElementById('balance-loading');
  const balanceTableContainer = document.getElementById('balance-table-container');
  const balanceTbody = document.getElementById('balance-tbody');

  // Tab 2 Elements
  const overallLoading = document.getElementById('overall-loading');
  const overallTableContainer = document.getElementById('overall-table-container');
  const overallTbody = document.getElementById('overall-tbody');

  // Tab 3 Elements
  const quizSelector = document.getElementById('quiz-selector');
  const quizBannerCategory = document.getElementById('quiz-banner-category');
  const quizBannerTitle = document.getElementById('quiz-banner-title');
  const playSelectedQuizBtn = document.getElementById('play-selected-quiz-btn');
  const quizLoading = document.getElementById('quiz-loading');
  const quizTableContainer = document.getElementById('quiz-table-container');
  const quizTbody = document.getElementById('quiz-tbody');
  const quizEmpty = document.getElementById('quiz-empty');

  let activeTab = 'balance';
  let quizzesList = [];

  // Tab Navigation Listeners
  tabBalanceBtn.addEventListener('click', () => switchTab('balance'));
  tabOverallBtn.addEventListener('click', () => switchTab('overall'));
  tabQuizBtn.addEventListener('click', () => switchTab('quiz'));

  function switchTab(tab) {
    activeTab = tab;

    [tabBalanceBtn, tabOverallBtn, tabQuizBtn].forEach(b => {
      b.classList.remove('active');
      b.classList.add('text-slate-400');
    });

    [tabBalanceContent, tabOverallContent, tabQuizContent].forEach(c => c.classList.add('hidden'));

    if (tab === 'balance') {
      tabBalanceBtn.classList.add('active');
      tabBalanceBtn.classList.remove('text-slate-400');
      tabBalanceContent.classList.remove('hidden');
      loadBalanceLeaderboard();
    } else if (tab === 'overall') {
      tabOverallBtn.classList.add('active');
      tabOverallBtn.classList.remove('text-slate-400');
      tabOverallContent.classList.remove('hidden');
      loadOverallLeaderboard();
    } else if (tab === 'quiz') {
      tabQuizBtn.classList.add('active');
      tabQuizBtn.classList.remove('text-slate-400');
      tabQuizContent.classList.remove('hidden');
      loadQuizSelectorAndLeaderboard();
    }
  }

  function getRankBadge(rank) {
    if (rank === 1) return '<span class="text-xl" title="1st Place">🥇</span>';
    if (rank === 2) return '<span class="text-xl" title="2nd Place">🥈</span>';
    if (rank === 3) return '<span class="text-xl" title="3rd Place">🥉</span>';
    return `<span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-slate-400 font-bold text-xs">${rank}</span>`;
  }

  // 1. Load Balance Leaderboard
  async function loadBalanceLeaderboard() {
    balanceLoading.classList.remove('hidden');
    balanceTableContainer.classList.add('hidden');
    balanceTbody.innerHTML = '';

    try {
      const res = await fetch('/api/leaderboards/balance');
      const data = await res.json();
      balanceLoading.classList.add('hidden');

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load balance leaderboard');
      }

      const rows = data.leaderboard || [];
      balanceTableContainer.classList.remove('hidden');

      rows.forEach(user => {
        const tr = document.createElement('tr');
        const isMe = user.user_id === currentUser.id;
        tr.className = `hover:bg-slate-800/40 transition-colors ${isMe ? 'bg-indigo-950/20 font-semibold' : ''}`;

        const roleBadge = user.role === 'teacher'
          ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-950 text-violet-300 border border-violet-800/60">Teacher</span>'
          : '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">Student</span>';

        tr.innerHTML = `
          <td class="py-3.5 px-4 text-center">${getRankBadge(user.rank)}</td>
          <td class="py-3.5 px-4">
            <div class="flex items-center gap-2">
              <span class="w-7 h-7 rounded-lg bg-indigo-600/30 text-indigo-300 text-xs font-bold flex items-center justify-center">
                ${escapeHtml((user.username || 'U').charAt(0).toUpperCase())}
              </span>
              <span class="text-slate-100">${escapeHtml(user.username)} ${isMe ? '<span class="text-[10px] text-indigo-400 ml-1">(You)</span>' : ''}</span>
            </div>
          </td>
          <td class="py-3.5 px-4 text-center">${roleBadge}</td>
          <td class="py-3.5 px-4 text-right">
            <span class="font-extrabold text-emerald-400 text-base">$${user.balance}</span>
          </td>
        `;

        balanceTbody.appendChild(tr);
      });
    } catch (err) {
      balanceLoading.classList.add('hidden');
      balanceTbody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-rose-300 text-xs">Error: ${escapeHtml(err.message)}</td></tr>`;
    }
  }

  // 2. Load Overall Completed Leaderboard
  async function loadOverallLeaderboard() {
    overallLoading.classList.remove('hidden');
    overallTableContainer.classList.add('hidden');
    overallTbody.innerHTML = '';

    try {
      const res = await fetch('/api/leaderboards/overall');
      const data = await res.json();
      overallLoading.classList.add('hidden');

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load overall leaderboard');
      }

      const rows = data.leaderboard || [];
      overallTableContainer.classList.remove('hidden');

      rows.forEach(user => {
        const tr = document.createElement('tr');
        const isMe = user.user_id === currentUser.id;
        tr.className = `hover:bg-slate-800/40 transition-colors ${isMe ? 'bg-indigo-950/20 font-semibold' : ''}`;

        tr.innerHTML = `
          <td class="py-3.5 px-4 text-center">${getRankBadge(user.rank)}</td>
          <td class="py-3.5 px-4">
            <div class="flex items-center gap-2">
              <span class="w-7 h-7 rounded-lg bg-indigo-600/30 text-indigo-300 text-xs font-bold flex items-center justify-center">
                ${escapeHtml((user.username || 'U').charAt(0).toUpperCase())}
              </span>
              <span class="text-slate-100">${escapeHtml(user.username)} ${isMe ? '<span class="text-[10px] text-indigo-400 ml-1">(You)</span>' : ''}</span>
            </div>
          </td>
          <td class="py-3.5 px-4 text-center font-bold text-white">
            ${user.total_completed_attempts} Quizzes
          </td>
          <td class="py-3.5 px-4 text-center">
            <span class="px-2 py-0.5 rounded-full text-xs font-bold ${
              user.average_percentage >= 80 ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-300'
            }">
              ${user.average_percentage}%
            </span>
          </td>
          <td class="py-3.5 px-4 text-right font-extrabold text-emerald-400">
            +$${user.total_cash_earned}
          </td>
        `;

        overallTbody.appendChild(tr);
      });
    } catch (err) {
      overallLoading.classList.add('hidden');
      overallTbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-rose-300 text-xs">Error: ${escapeHtml(err.message)}</td></tr>`;
    }
  }

  // 3. Load Per-Quiz Records Leaderboard
  async function loadQuizSelectorAndLeaderboard() {
    if (quizzesList.length === 0) {
      try {
        const [quizzesRes, dailyRes] = await Promise.all([
          fetch('/api/quizzes'),
          fetch('/api/quizzes/daily-challenge')
        ]);
        const qData = await quizzesRes.json();
        const dData = await dailyRes.json();

        quizzesList = [];
        if (dData.success && dData.quiz) {
          quizzesList.push(dData.quiz);
        }
        if (qData.success && Array.isArray(qData.quizzes)) {
          quizzesList.push(...qData.quizzes);
        }

        quizSelector.innerHTML = '';
        quizzesList.forEach(q => {
          const opt = document.createElement('option');
          opt.value = q.id;
          opt.textContent = `${q.is_daily_challenge ? '🔥 [Daily] ' : ''}${q.title}`;
          quizSelector.appendChild(opt);
        });

        quizSelector.addEventListener('change', () => {
          loadQuizLeaderboard(parseInt(quizSelector.value, 10));
        });
      } catch (err) {
        console.warn('Could not populate quiz dropdown:', err);
      }
    }

    const initialQuizId = quizzesList.length > 0 ? quizzesList[0].id : 1;
    loadQuizLeaderboard(initialQuizId);
  }

  async function loadQuizLeaderboard(quizId) {
    quizLoading.classList.remove('hidden');
    quizTableContainer.classList.add('hidden');
    quizEmpty.classList.add('hidden');
    quizTbody.innerHTML = '';

    const currentQuiz = quizzesList.find(q => q.id === quizId);
    if (currentQuiz) {
      quizBannerTitle.textContent = currentQuiz.title;
      quizBannerCategory.textContent = currentQuiz.category || 'Trivia';
      playSelectedQuizBtn.href = `/quiz-take.html?id=${currentQuiz.id}${currentQuiz.is_daily_challenge ? '&daily=true' : ''}`;
    }

    try {
      const res = await fetch(`/api/leaderboards/quiz/${quizId}`);
      const data = await res.json();
      quizLoading.classList.add('hidden');

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load quiz leaderboard');
      }

      const rows = data.leaderboard || [];

      if (rows.length === 0) {
        quizEmpty.classList.remove('hidden');
        return;
      }

      quizTableContainer.classList.remove('hidden');

      rows.forEach(user => {
        const tr = document.createElement('tr');
        const isMe = user.user_id === currentUser.id;
        tr.className = `hover:bg-slate-800/40 transition-colors ${isMe ? 'bg-indigo-950/20 font-semibold' : ''}`;

        tr.innerHTML = `
          <td class="py-3.5 px-4 text-center">${getRankBadge(user.rank)}</td>
          <td class="py-3.5 px-4">
            <div class="flex items-center gap-2">
              <span class="w-7 h-7 rounded-lg bg-indigo-600/30 text-indigo-300 text-xs font-bold flex items-center justify-center">
                ${escapeHtml((user.username || 'U').charAt(0).toUpperCase())}
              </span>
              <span class="text-slate-100">${escapeHtml(user.username)} ${isMe ? '<span class="text-[10px] text-indigo-400 ml-1">(You)</span>' : ''}</span>
            </div>
          </td>
          <td class="py-3.5 px-4 text-center font-bold text-white">
            ${user.best_score}/${user.total_questions || 10}
          </td>
          <td class="py-3.5 px-4 text-center">
            <span class="px-2.5 py-0.5 rounded-full text-xs font-bold ${
              user.best_percentage === 100 
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60' 
                : 'bg-indigo-950 text-indigo-300 border border-indigo-800/60'
            }">
              ${user.best_percentage}%
            </span>
          </td>
          <td class="py-3.5 px-4 text-right text-slate-300 font-semibold">
            ${user.attempt_count} ${user.attempt_count === 1 ? 'attempt' : 'attempts'}
          </td>
        `;

        quizTbody.appendChild(tr);
      });
    } catch (err) {
      quizLoading.classList.add('hidden');
      quizTbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-rose-300 text-xs">Error: ${escapeHtml(err.message)}</td></tr>`;
    }
  }

  function escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Load Balance Leaderboard Initially
  loadBalanceLeaderboard();
})();
