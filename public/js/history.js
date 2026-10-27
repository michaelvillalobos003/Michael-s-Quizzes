// Michael's Quizzes - Phase 3 History & Snapshot Review Engine

(function () {
  'use strict';

  // 1. Check Authentication (Guest Redirect)
  const storedUser = localStorage.getItem('quiz_user');
  let currentUser = null;

  if (storedUser) {
    try {
      currentUser = JSON.parse(storedUser);
    } catch (e) {
      currentUser = null;
    }
  }

  // Redirect guests to login
  if (!currentUser) {
    window.location.href = `/login.html?redirect=${encodeURIComponent(window.location.href)}`;
    return;
  }

  // DOM Elements
  const headerBalanceEl = document.getElementById('header-balance');
  const headerUsernameEl = document.getElementById('header-username');
  const headerAvatarEl = document.getElementById('header-avatar');

  const tabHistoryBtn = document.getElementById('tab-history-btn');
  const tabCreatedBtn = document.getElementById('tab-created-btn');
  const tabHistoryContent = document.getElementById('tab-history-content');
  const tabCreatedContent = document.getElementById('tab-created-content');

  const historyLoading = document.getElementById('history-loading');
  const historyEmpty = document.getElementById('history-empty');
  const historyList = document.getElementById('history-list');
  const historyCountBadge = document.getElementById('history-count-badge');

  const createdLoading = document.getElementById('created-loading');
  const createdEmpty = document.getElementById('created-empty');
  const createdList = document.getElementById('created-list');
  const createdCountBadge = document.getElementById('created-count-badge');

  // Modal Elements
  const reviewModal = document.getElementById('review-modal');
  const modalQuizTitle = document.getElementById('modal-quiz-title');
  const modalMeta = document.getElementById('modal-meta');
  const modalLoading = document.getElementById('modal-loading');
  const perfectScoreOverlay = document.getElementById('perfect-score-overlay');
  const modalMissedList = document.getElementById('modal-missed-list');
  const modalStatusSummary = document.getElementById('modal-status-summary');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const modalDoneBtn = document.getElementById('modal-done-btn');

  // Initialize Header
  headerUsernameEl.textContent = currentUser.username || 'Michael';
  headerAvatarEl.textContent = (currentUser.username || 'M').charAt(0).toUpperCase();
  headerBalanceEl.textContent = `$${currentUser.balance || 0}`;

  // Tab Switching
  tabHistoryBtn.addEventListener('click', () => {
    tabHistoryBtn.classList.add('active');
    tabHistoryBtn.classList.remove('text-slate-400');
    tabCreatedBtn.classList.remove('active');
    tabCreatedBtn.classList.add('text-slate-400');

    tabHistoryContent.classList.remove('hidden');
    tabCreatedContent.classList.add('hidden');
  });

  tabCreatedBtn.addEventListener('click', () => {
    tabCreatedBtn.classList.add('active');
    tabCreatedBtn.classList.remove('text-slate-400');
    tabHistoryBtn.classList.remove('active');
    tabHistoryBtn.classList.add('text-slate-400');

    tabCreatedContent.classList.remove('hidden');
    tabHistoryContent.classList.add('hidden');
    loadCreatedQuizzes();
  });

  // Modal Handlers
  function openModal() {
    reviewModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    reviewModal.classList.add('hidden');
    document.body.style.overflow = 'auto';
  }

  closeModalBtn.addEventListener('click', closeModal);
  modalDoneBtn.addEventListener('click', closeModal);
  reviewModal.addEventListener('click', (e) => {
    if (e.target === reviewModal) closeModal();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !reviewModal.classList.contains('hidden')) {
      closeModal();
    }
  });

  // 2. Fetch and Render Attempt History
  async function loadHistory() {
    historyLoading.classList.remove('hidden');
    historyEmpty.classList.add('hidden');
    historyList.innerHTML = '';

    try {
      const res = await fetch('/api/attempts/my-history', {
        headers: { 'x-user-id': currentUser.id }
      });
      const data = await res.json();

      historyLoading.classList.add('hidden');

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch history');
      }

      const attempts = data.attempts || [];
      historyCountBadge.textContent = attempts.length;

      if (attempts.length === 0) {
        historyEmpty.classList.remove('hidden');
        return;
      }

      renderHistoryCards(attempts);
    } catch (err) {
      historyLoading.classList.add('hidden');
      historyList.innerHTML = `
        <div class="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-200 text-xs">
          Failed to load history: ${escapeHtml(err.message)}
        </div>
      `;
    }
  }

  function renderHistoryCards(attempts) {
    historyList.innerHTML = '';

    attempts.forEach(attempt => {
      const dateFormatted = new Date(attempt.completed_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const isPerfect = attempt.score === attempt.total_questions;
      const card = document.createElement('div');
      card.className = 'p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4';

      card.innerHTML = `
        <div class="space-y-1">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-xs font-semibold text-slate-400">${escapeHtml(attempt.quiz_category || 'Quiz')}</span>
            ${attempt.is_daily_challenge ? '<span class="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">DAILY CHALLENGE</span>' : ''}
            <span class="text-slate-600">•</span>
            <span class="text-xs text-slate-500">${dateFormatted}</span>
          </div>

          <h3 class="text-base font-bold text-white leading-tight">
            ${escapeHtml(attempt.quiz_title)}
          </h3>

          <div class="flex items-center gap-3 pt-1 text-xs">
            <span class="px-2.5 py-0.5 rounded-full font-bold ${
              isPerfect 
                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60' 
                : attempt.percentage >= 70 
                ? 'bg-indigo-950/80 text-indigo-400 border border-indigo-800/60' 
                : 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
            }">
              Score: ${attempt.score}/${attempt.total_questions} (${attempt.percentage}%)
            </span>

            <span class="font-extrabold text-emerald-400">
              +$${attempt.cash_earned} earned
            </span>
          </div>
        </div>

        <div class="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            class="review-btn px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              isPerfect
                ? 'bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-300 border border-emerald-700/50'
                : 'bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 hover:text-white'
            }"
            data-id="${attempt.id}"
            data-title="${escapeHtml(attempt.quiz_title)}"
            data-score="${attempt.score}"
            data-total="${attempt.total_questions}"
            data-pct="${attempt.percentage}"
            data-date="${dateFormatted}"
            data-perfect="${isPerfect}"
          >
            <span>🔍 Review Missed Questions</span>
          </button>

          <a
            href="/quiz-take.html?id=${attempt.quiz_id}${attempt.is_daily_challenge ? '&daily=true' : ''}"
            class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors text-xs font-semibold"
            title="Retake Quiz"
          >
            🔄
          </a>
        </div>
      `;

      // Attach review button event
      const revBtn = card.querySelector('.review-btn');
      revBtn.addEventListener('click', () => {
        handleReviewClick({
          id: attempt.id,
          title: attempt.quiz_title,
          score: attempt.score,
          total: attempt.total_questions,
          percentage: attempt.percentage,
          date: dateFormatted,
          is_perfect: isPerfect
        });
      });

      historyList.appendChild(card);
    });
  }

  // 3. Wrong Answer Review Modal Logic
  async function handleReviewClick(attemptMeta) {
    modalQuizTitle.textContent = attemptMeta.title;
    modalMeta.textContent = `Score: ${attemptMeta.score}/${attemptMeta.total} (${attemptMeta.percentage}%) • ${attemptMeta.date}`;

    openModal();

    // PERFECT SCORE OVERLAY RULE:
    // If score is 10/10 (100%), show overlay reading:
    // "🏆 Perfect Score! You answered every question correctly — no wrong answers to review!"
    if (attemptMeta.is_perfect || attemptMeta.score === attemptMeta.total) {
      modalLoading.classList.add('hidden');
      modalMissedList.innerHTML = '';
      modalMissedList.classList.add('hidden');
      perfectScoreOverlay.classList.remove('hidden');
      modalStatusSummary.textContent = '100% Accuracy — No incorrect answers recorded.';
      return;
    }

    // Otherwise, fetch and show permanent snapshots for missed questions
    perfectScoreOverlay.classList.add('hidden');
    modalMissedList.classList.remove('hidden');
    modalLoading.classList.remove('hidden');
    modalMissedList.innerHTML = '';

    try {
      const res = await fetch(`/api/attempts/${attemptMeta.id}/review`);
      const data = await res.json();

      modalLoading.classList.add('hidden');

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Could not load snapshots');
      }

      const wrongAnswers = data.wrong_answers || [];
      modalStatusSummary.textContent = `${wrongAnswers.length} missed question${wrongAnswers.length === 1 ? '' : 's'} to review`;

      if (wrongAnswers.length === 0) {
        perfectScoreOverlay.classList.remove('hidden');
        return;
      }

      wrongAnswers.forEach((item, index) => {
        const itemCard = document.createElement('div');
        itemCard.className = 'p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3';

        itemCard.innerHTML = `
          <div class="flex items-start justify-between gap-3">
            <span class="text-sm font-bold text-white leading-snug">
              ${index + 1}. ${escapeHtml(item.question_text_snapshot)}
            </span>
            <span class="text-[10px] px-2 py-0.5 rounded font-extrabold bg-rose-950 text-rose-400 border border-rose-800 shrink-0">
              ✗ Missed
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <!-- Wrong Pick Highlighted in Red -->
            <div class="p-3 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-200">
              <span class="text-[10px] font-bold text-rose-400 uppercase tracking-wider block mb-1">
                ❌ Your Wrong Pick:
              </span>
              <span class="font-semibold text-rose-100 text-sm">
                ${escapeHtml(item.selected_choice_text_snapshot || '(No answer / Skipped)')}
              </span>
            </div>

            <!-- Correct Choice Highlighted in Green -->
            <div class="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-200">
              <span class="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                ✓ Correct Choice:
              </span>
              <span class="font-semibold text-emerald-100 text-sm">
                ${escapeHtml(item.correct_choice_text_snapshot)}
              </span>
            </div>
          </div>
        `;

        modalMissedList.appendChild(itemCard);
      });
    } catch (err) {
      modalLoading.classList.add('hidden');
      modalMissedList.innerHTML = `
        <div class="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-200 text-xs">
          Failed to load review: ${escapeHtml(err.message)}
        </div>
      `;
    }
  }

  // 4. Load Created Quizzes (Secondary Tab)
  let createdLoaded = false;
  async function loadCreatedQuizzes() {
    if (createdLoaded) return;
    createdLoading.classList.remove('hidden');
    createdEmpty.classList.add('hidden');
    createdList.innerHTML = '';

    try {
      const res = await fetch('/api/attempts/my-created-quizzes', {
        headers: { 'x-user-id': currentUser.id }
      });
      const data = await res.json();
      createdLoading.classList.add('hidden');

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch created quizzes');
      }

      const quizzes = data.created_quizzes || [];
      createdCountBadge.textContent = quizzes.length;

      if (quizzes.length === 0) {
        createdEmpty.classList.remove('hidden');
        return;
      }

      renderCreatedCards(quizzes);
      createdLoaded = true;
    } catch (err) {
      createdLoading.classList.add('hidden');
      createdList.innerHTML = `
        <div class="col-span-2 p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-200 text-xs">
          Failed to load created quizzes: ${escapeHtml(err.message)}
        </div>
      `;
    }
  }

  function renderCreatedCards(quizzes) {
    createdList.innerHTML = '';

    quizzes.forEach(quiz => {
      const statusBadge = getStatusBadge(quiz.status || 'Approved');
      const card = document.createElement('div');
      card.className = 'p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between';

      card.innerHTML = `
        <div class="space-y-2">
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs font-semibold text-slate-400">${escapeHtml(quiz.category || 'Custom')}</span>
            ${statusBadge}
          </div>

          <h3 class="text-base font-bold text-white leading-tight">
            ${escapeHtml(quiz.title)}
          </h3>

          <p class="text-xs text-slate-400 line-clamp-2">
            ${escapeHtml(quiz.description || 'Custom crafted trivia quiz.')}
          </p>
        </div>

        <div class="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>${quiz.question_count || 10} Questions</span>
          <a
            href="/quiz-take.html?id=${quiz.id}"
            class="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
          >
            Play Quiz
          </a>
        </div>
      `;

      createdList.appendChild(card);
    });
  }

  function getStatusBadge(status) {
    const s = (status || '').toLowerCase();
    if (s === 'approved') {
      return '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/60">✓ Approved</span>';
    } else if (s === 'pending') {
      return '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800/60">⏳ Pending Review</span>';
    } else {
      return '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">Draft</span>';
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

  // Load History on Page Load
  loadHistory();
})();
