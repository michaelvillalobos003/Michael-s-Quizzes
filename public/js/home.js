// Michael's Quizzes - Phase 5 Bento Grid Home Dashboard Engine
(function () {
  'use strict';

  // A visitor is a guest unless they explicitly signed in.
  let currentUser = null;
  const stored = localStorage.getItem('quiz_user');
  if (stored) {
    try {
      const u = JSON.parse(stored);
      if (u && Number.isInteger(Number(u.id)) && Number(u.id) > 0) {
        currentUser = u;
      } else {
        localStorage.removeItem('quiz_user');
      }
    } catch (e) {
      localStorage.removeItem('quiz_user');
    }
  }

  // DOM Elements - Profile & Header
  const headerAvatar = document.getElementById('header-avatar');
  const headerUsername = document.getElementById('header-username');
  const signUpLink = document.getElementById('sign-up-link');
  const signOutButton = document.getElementById('sign-out-button');
  const navStreakCount = document.getElementById('nav-streak-count');
  const navBalanceVal = document.getElementById('nav-balance-val');
  const navStreakPill = document.getElementById('nav-streak-pill');
  const navBalancePill = document.getElementById('nav-balance-pill');

  // DOM Elements - Hero & Bento
  const heroGreetingName = document.getElementById('hero-greeting-name');
  const heroGreetingPrefix = document.getElementById('hero-greeting-prefix');
  const heroStreakText = document.getElementById('hero-streak-text');
  const heroBalanceVal = document.getElementById('hero-balance-val');
  const heroStreakBadge = document.getElementById('hero-streak-badge');
  const heroBalanceCard = document.getElementById('hero-balance-card');
  const dailyBonusCard = document.getElementById('daily-bonus-card');
  const quickStatsCard = document.getElementById('quick-stats-card');
  const recentActivityCard = document.getElementById('recent-activity-card');

  // DOM Elements - Bonus Widget
  const claimBonusBtn = document.getElementById('claim-bonus-btn');
  const claimBonusBtnText = document.getElementById('claim-bonus-btn-text');
  const bonusTimerDisplay = document.getElementById('bonus-timer-display');
  const bonusCountdownLabel = document.getElementById('bonus-countdown-label');

  // DOM Elements - Quick Stats
  const statRankVal = document.getElementById('stat-rank-val');
  const statCompletedVal = document.getElementById('stat-completed-val');
  const statAccuracyVal = document.getElementById('stat-accuracy-val');

  // DOM Elements - Recent Activity
  const recentQuizTitle = document.getElementById('recent-quiz-title');
  const recentQuizScore = document.getElementById('recent-quiz-score');
  const recentQuizCash = document.getElementById('recent-quiz-cash');
  const recentDateLabel = document.getElementById('recent-date-label');
  const recentActivityBtn = document.getElementById('recent-activity-btn');

  // DOM Elements - Quiz Catalog
  const quizzesLoading = document.getElementById('quizzes-loading');
  const quizzesGrid = document.getElementById('quizzes-grid');
  const categoryFilterPills = document.getElementById('category-filter-pills');

  let allQuizzes = [];
  let activeCategory = 'ALL';
  let countdownSeconds = 0;
  let timerInterval = null;

  function getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (currentUser) {
      headers['x-user-id'] = String(currentUser.id);
      if (currentUser.role) headers['x-user-role'] = currentUser.role;
    }
    return headers;
  }

  function syncAuthUi() {
    const signedIn = Boolean(currentUser);
    const name = signedIn ? (currentUser.username || 'Player') : 'Guest';

    if (headerAvatar) headerAvatar.textContent = name[0].toUpperCase();
    if (headerUsername) headerUsername.textContent = name;
    if (heroGreetingName) heroGreetingName.textContent = name;
    if (heroGreetingPrefix) heroGreetingPrefix.textContent = signedIn ? 'Welcome back,' : 'Welcome,';

    signUpLink?.classList.toggle('hidden', signedIn);
    signOutButton?.classList.toggle('hidden', !signedIn);

    [
      navStreakPill,
      navBalancePill,
      heroStreakBadge,
      heroBalanceCard,
      dailyBonusCard,
      quickStatsCard,
      recentActivityCard
    ].forEach((element) => element?.classList.toggle('hidden', !signedIn));
  }

  // Sync Initial UI
  function updateProfileUI(balance, streak) {
    if (!currentUser) return;
    const b = Number(balance || 0).toFixed(2);
    const s = Number(streak || 1);

    if (navBalanceVal) navBalanceVal.textContent = `$${b}`;
    if (heroBalanceVal) heroBalanceVal.textContent = `$${b}`;

    if (navStreakCount) navStreakCount.textContent = s;
    if (heroStreakText) heroStreakText.textContent = `${s} Day Streak`;
  }

  // 1. Fetch Dashboard Stats
  async function loadDashboardStats() {
    if (!currentUser) return;

    try {
      const res = await fetch('/api/users/dashboard-stats', {
        headers: getHeaders()
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load dashboard stats');
      }

      const s = data.stats || data;
      const user = s.user || data.user || currentUser;
      const canClaim = s.daily_bonus ? s.daily_bonus.can_claim : (data.can_claim_bonus !== undefined ? data.can_claim_bonus : true);
      const msLeft = s.daily_bonus ? s.daily_bonus.ms_until_reset : ((data.seconds_until_next_bonus || 0) * 1000);
      const secondsLeft = Math.max(0, Math.floor(msLeft / 1000));
      const rank = s.rank !== undefined ? s.rank : (s.stats ? s.stats.rank : 1);
      const completedCount = s.completed_quizzes_count !== undefined ? s.completed_quizzes_count : (s.stats ? s.stats.total_attempts : 0);
      const accuracy = s.accuracy_pct !== undefined ? s.accuracy_pct : (s.stats && s.stats.accuracy_pct !== undefined ? s.stats.accuracy_pct : 95);
      const recent = s.latest_attempt || data.recent_activity;

      // Update User & Header Stats
      updateProfileUI(user.balance, user.streak_count);

      // Update Quick Stats Matrix
      if (statRankVal) statRankVal.textContent = `#${rank}`;
      if (statCompletedVal) statCompletedVal.textContent = `${completedCount}`;
      if (statAccuracyVal) statAccuracyVal.textContent = `${accuracy}%`;

      // Update Recent Activity
      if (recent) {
        if (recentQuizTitle) recentQuizTitle.textContent = recent.quiz_title;
        if (recentQuizScore) recentQuizScore.textContent = `Score: ${recent.score}/${recent.total_questions} (${recent.percentage}%)`;
        if (recentQuizCash) recentQuizCash.textContent = `+$${recent.cash_earned || 0}`;
        if (recentDateLabel) {
          const d = new Date(recent.completed_at);
          recentDateLabel.textContent = isNaN(d) ? "Recent" : d.toLocaleDateString();
        }
        if (recentActivityBtn) {
          recentActivityBtn.href = `/history.html`;
          recentActivityBtn.textContent = "Review Missed Questions →";
        }
      } else {
        if (recentQuizTitle) recentQuizTitle.textContent = "No quiz attempts yet";
        if (recentQuizScore) recentQuizScore.textContent = "Take your first quiz to earn cash!";
        if (recentQuizCash) recentQuizCash.textContent = "$0";
        if (recentActivityBtn) {
          recentActivityBtn.href = "#quizzes-catalog";
          recentActivityBtn.textContent = "Start First Quiz ↓";
        }
      }

      // Configure Daily Bonus Widget
      configureDailyBonus(canClaim, secondsLeft);
    } catch (err) {
      console.warn('Dashboard stats error:', err.message);
      updateProfileUI(0, 1);
    }
  }

  // Configure Daily Bonus & Live Timer
  function configureDailyBonus(canClaim, secondsLeft) {
    clearInterval(timerInterval);

    if (canClaim) {
      claimBonusBtn.disabled = false;
      claimBonusBtnText.textContent = 'Claim Daily +$50 Virtual Cash';
      claimBonusBtn.classList.remove('opacity-50');
      bonusTimerDisplay.textContent = 'READY TO CLAIM! 🎁';
      bonusTimerDisplay.classList.add('text-emerald-400');
      bonusTimerDisplay.classList.remove('text-cyan-300');
      bonusCountdownLabel.textContent = 'Available Now';
    } else {
      claimBonusBtn.disabled = true;
      claimBonusBtnText.textContent = '✓ Claimed Today (Streak Active!)';
      claimBonusBtn.classList.add('opacity-50');
      bonusCountdownLabel.textContent = 'Resets at UTC Midnight';
      bonusTimerDisplay.classList.remove('text-emerald-400');
      bonusTimerDisplay.classList.add('text-cyan-300');

      countdownSeconds = Math.max(0, secondsLeft || 0);
      updateTimerDisplay();

      timerInterval = setInterval(() => {
        countdownSeconds--;
        if (countdownSeconds <= 0) {
          clearInterval(timerInterval);
          configureDailyBonus(true, 0);
        } else {
          updateTimerDisplay();
        }
      }, 1000);
    }
  }

  function updateTimerDisplay() {
    const hours = Math.floor(countdownSeconds / 3600);
    const mins = Math.floor((countdownSeconds % 3600) / 60);
    const secs = countdownSeconds % 60;
    const pad = (n) => String(n).padStart(2, '0');
    bonusTimerDisplay.textContent = `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
  }

  // Handle Claim Bonus Click
  claimBonusBtn.addEventListener('click', async () => {
    claimBonusBtn.disabled = true;
    claimBonusBtnText.textContent = 'Claiming...';

    try {
      const res = await fetch('/api/users/claim-daily-bonus', {
        method: 'POST',
        headers: getHeaders()
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to claim bonus');
      }

      alert(`🎉 Bonus Claimed! You received +$${data.bonus_awarded} virtual cash!\nYour streak is now ${data.streak_count} days strong! 🔥`);
      updateProfileUI(data.balance, data.streak_count);
      configureDailyBonus(false, 86400); // 24 hours
    } catch (err) {
      alert(`Claim bonus error: ${err.message}`);
      loadDashboardStats();
    }
  });

  // 2. Fetch Quiz Catalog
  async function loadQuizzes() {
    quizzesLoading.classList.remove('hidden');
    quizzesGrid.innerHTML = '';

    try {
      const res = await fetch('/api/quizzes', {
        headers: getHeaders()
      });
      const data = await res.json();
      quizzesLoading.classList.add('hidden');

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch quizzes');
      }

      allQuizzes = data.quizzes || [];
      renderQuizzes();

    } catch (err) {
      quizzesLoading.classList.add('hidden');
      quizzesGrid.innerHTML = `
        <div class="col-span-full p-6 rounded-2xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs text-center">
          Failed to load trivia catalog: ${escapeHtml(err.message)}
        </div>
      `;
    }
  }

  function renderQuizzes() {
    quizzesGrid.innerHTML = '';

    const filtered = allQuizzes.filter(q => {
      if (activeCategory === 'ALL') return true;
      const cat = (q.category || '').toLowerCase();
      return cat.includes(activeCategory.toLowerCase());
    });

    if (filtered.length === 0) {
      quizzesGrid.innerHTML = `
        <div class="col-span-full py-12 text-center p-6 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-xs">
          No quizzes found in category "${escapeHtml(activeCategory)}".
        </div>
      `;
      return;
    }

    filtered.forEach(q => {
      const card = document.createElement('div');
      card.className = 'bento-card rounded-2xl p-5 flex flex-col justify-between space-y-4 group';

      // Pick category icon & colors
      const meta = getCategoryMeta(q.category);

      card.innerHTML = `
        <div class="space-y-3">
          <div class="flex items-center justify-between gap-2">
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${meta.badgeClass}">
              ${meta.icon} ${escapeHtml(q.category || 'Trivia')}
            </span>
            <span class="text-[11px] text-emerald-400 font-bold">$125 Max</span>
          </div>

          <div>
            <h3 class="text-base font-bold text-white group-hover:text-indigo-300 transition-colors leading-snug">
              ${escapeHtml(q.title)}
            </h3>
            <p class="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
              ${escapeHtml(q.description || 'Test your knowledge and earn virtual cash!')}
            </p>
          </div>
        </div>

        <div class="pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <span class="text-xs text-slate-400 font-medium">📝 10 Questions</span>
          <a
            href="/quiz-take.html?id=${q.id}"
            class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5"
          >
            <span>Play Quiz</span>
            <span>→</span>
          </a>
        </div>
      `;

      quizzesGrid.appendChild(card);
    });
  }

  function getCategoryMeta(category) {
    const c = (category || '').toLowerCase();
    if (c.includes('gaming') || c.includes('video')) {
      return { icon: '🎮', badgeClass: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' };
    }
    if (c.includes('comic') || c.includes('superhero')) {
      return { icon: '🦸', badgeClass: 'bg-rose-500/20 text-rose-300 border border-rose-500/30' };
    }
    if (c.includes('movie') || c.includes('animated')) {
      return { icon: '🎬', badgeClass: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' };
    }
    if (c.includes('pop') || c.includes('culture') || c.includes('trend')) {
      return { icon: '🔥', badgeClass: 'bg-violet-500/20 text-violet-300 border border-violet-500/30' };
    }
    if (c.includes('snack') || c.includes('food') || c.includes('candy')) {
      return { icon: '🍿', badgeClass: 'bg-amber-500/20 text-amber-300 border border-amber-500/30' };
    }
    return { icon: '✨', badgeClass: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' };
  }

  // Category Filter Pill Click Handlers
  if (categoryFilterPills) {
    categoryFilterPills.querySelectorAll('.cat-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        categoryFilterPills.querySelectorAll('.cat-pill').forEach(b => {
          b.classList.remove('active', 'bg-indigo-600', 'text-white', 'shadow-md', 'shadow-indigo-600/30');
          b.classList.add('bg-slate-900', 'border', 'border-slate-800', 'text-slate-400');
        });
        btn.classList.add('active', 'bg-indigo-600', 'text-white', 'shadow-md', 'shadow-indigo-600/30');
        btn.classList.remove('bg-slate-900', 'border', 'border-slate-800', 'text-slate-400');

        activeCategory = btn.getAttribute('data-category') || 'ALL';
        renderQuizzes();
      });
    });
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

  // Initialize guest or signed-in UI. Public quizzes remain browseable to guests.
  syncAuthUi();
  signOutButton?.addEventListener('click', () => {
    localStorage.removeItem('quiz_user');
    window.location.reload();
  });

  if (currentUser) loadDashboardStats();
  loadQuizzes();

})();
