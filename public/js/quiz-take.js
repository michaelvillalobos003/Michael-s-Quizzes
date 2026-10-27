// Michael's Quizzes - Phase 2 Quiz Take Engine

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

  // If unauthenticated, redirect to login page
  if (!currentUser || !Number.isInteger(Number(currentUser.id)) || Number(currentUser.id) < 1) {
    localStorage.removeItem('quiz_user');
    const returnUrl = encodeURIComponent(window.location.href);
    window.location.href = `/login.html?redirect=${returnUrl}`;
    return;
  }

  // DOM Elements
  const headerQuizTitle = document.getElementById('header-quiz-title');
  const headerQuizCategory = document.getElementById('header-quiz-category');
  const dailyBadge = document.getElementById('daily-badge');
  const userBalanceEl = document.getElementById('user-balance');
  const userNameEl = document.getElementById('user-name');
  const userAvatarEl = document.getElementById('user-avatar');

  const loadingView = document.getElementById('loading-view');
  const errorView = document.getElementById('error-view');
  const errorMessageEl = document.getElementById('error-message');
  const questionView = document.getElementById('question-view');
  const resultsView = document.getElementById('results-view');

  const questionCounter = document.getElementById('question-counter');
  const progressBarFill = document.getElementById('progress-bar-fill');
  const payoutHint = document.getElementById('payout-hint');
  const questionText = document.getElementById('question-text');
  const choicesContainer = document.getElementById('choices-container');
  const nextBtn = document.getElementById('next-btn');
  const nextBtnText = document.getElementById('next-btn-text');

  const resultsTitle = document.getElementById('results-title');
  const resultsMessage = document.getElementById('results-message');
  const finalScoreEl = document.getElementById('final-score');
  const finalPercentageEl = document.getElementById('final-percentage');
  const finalCashEl = document.getElementById('final-cash');
  const bonusBanner = document.getElementById('bonus-banner');
  const bonusBannerText = document.getElementById('bonus-banner-text');
  const finalNewBalanceEl = document.getElementById('final-new-balance');
  const breakdownContainer = document.getElementById('breakdown-container');
  const retryBtn = document.getElementById('retry-btn');

  // State
  let quizData = null;
  let currentQuestionIndex = 0;
  let selectedChoiceId = null;
  const userAnswers = {}; // { [question_id]: choice_id }

  // Set User Header
  if (currentUser) {
    userNameEl.textContent = currentUser.username || 'Player';
    userAvatarEl.textContent = (currentUser.username || 'M').charAt(0).toUpperCase();
    userBalanceEl.textContent = `$${currentUser.balance || 0}`;
    fetchLatestBalance();
  }

  async function fetchLatestBalance() {
    try {
      const res = await fetch('/api/users/me', {
        headers: { 'x-user-id': currentUser.id }
      });
      const data = await res.json();
      if (data.success && data.user) {
        currentUser.balance = data.user.balance;
        userBalanceEl.textContent = `$${currentUser.balance}`;
        localStorage.setItem('quiz_user', JSON.stringify(currentUser));
      }
    } catch (e) {
      console.warn('Could not refresh balance:', e);
    }
  }

  // 2. Fetch Quiz
  async function loadQuiz() {
    loadingView.classList.remove('hidden');
    questionView.classList.add('hidden');
    resultsView.classList.add('hidden');
    errorView.classList.add('hidden');

    const urlParams = new URLSearchParams(window.location.search);
    const isDaily = urlParams.get('daily') === 'true';
    const quizId = urlParams.get('id') || '1';

    const endpoint = isDaily ? '/api/quizzes/daily-challenge' : `/api/quizzes/${quizId}`;

    try {
      const response = await fetch(endpoint);
      const data = await response.json();

      if (!response.ok || !data.success || !data.quiz) {
        throw new Error(data.error || 'Quiz data could not be loaded.');
      }

      quizData = data.quiz;
      initializeQuiz(quizData);
    } catch (err) {
      loadingView.classList.add('hidden');
      errorView.classList.remove('hidden');
      errorMessageEl.textContent = err.message || 'Network error fetching quiz.';
    }
  }

  function initializeQuiz(quiz) {
    currentQuestionIndex = 0;
    selectedChoiceId = null;
    Object.keys(userAnswers).forEach(key => delete userAnswers[key]);

    headerQuizTitle.textContent = quiz.title;
    headerQuizCategory.textContent = quiz.category || 'General';

    if (quiz.is_daily_challenge) {
      dailyBadge.classList.remove('hidden');
      payoutHint.textContent = '+$50 per correct + $150 perfect bonus!';
      payoutHint.className = 'text-amber-400 font-bold';
    } else {
      dailyBadge.classList.add('hidden');
      payoutHint.textContent = '+$10 per correct + $25 perfect bonus!';
      payoutHint.className = 'text-emerald-400 font-bold';
    }

    loadingView.classList.add('hidden');
    resultsView.classList.add('hidden');
    questionView.classList.remove('hidden');

    renderQuestion();
  }

  // 3. Render Current Question (1 question per screen)
  function renderQuestion() {
    const question = quizData.questions[currentQuestionIndex];
    const total = quizData.questions.length;

    // Reset selection and button state
    selectedChoiceId = userAnswers[question.id] || null;
    updateNextButtonState();

    // Progress and indicators
    const currentNum = currentQuestionIndex + 1;
    questionCounter.textContent = `Question ${currentNum} of ${total}`;
    progressBarFill.style.width = `${(currentNum / total) * 100}%`;

    questionText.textContent = question.question_text;

    // Render Choices
    choicesContainer.innerHTML = '';
    const letters = ['A', 'B', 'C', 'D'];

    question.choices.forEach((choice, index) => {
      const isSelected = selectedChoiceId === choice.id;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `choice-btn w-full p-4 rounded-2xl border text-left font-medium transition-all duration-200 flex items-center justify-between group active:scale-[0.99] ${
        isSelected
          ? 'selected'
          : 'bg-slate-800/60 border-slate-700/80 text-slate-200 hover:bg-slate-800 hover:border-indigo-500/50'
      }`;

      btn.innerHTML = `
        <div class="flex items-center gap-3.5">
          <span class="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-colors ${
            isSelected
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-700/60 text-slate-300 group-hover:bg-indigo-600 group-hover:text-white'
          }">
            ${letters[index] || index + 1}
          </span>
          <span class="text-sm sm:text-base leading-snug">${escapeHtml(choice.choice_text)}</span>
        </div>
      `;

      btn.addEventListener('click', () => {
        handleSelectChoice(choice.id);
      });

      choicesContainer.appendChild(btn);
    });

    // Update Next/Submit Button text
    if (currentQuestionIndex === total - 1) {
      nextBtnText.textContent = 'Submit Quiz';
    } else {
      nextBtnText.textContent = 'Next Question';
    }
  }

  // 4. Choice Selection Enforcement
  function handleSelectChoice(choiceId) {
    selectedChoiceId = choiceId;
    const currentQ = quizData.questions[currentQuestionIndex];
    userAnswers[currentQ.id] = choiceId;

    // Update choice styling in DOM
    const buttons = choicesContainer.querySelectorAll('.choice-btn');
    buttons.forEach((b, idx) => {
      const choice = currentQ.choices[idx];
      const isSelected = choice.id === choiceId;
      if (isSelected) {
        b.classList.add('selected');
        const badge = b.querySelector('span');
        badge.className = 'w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold bg-indigo-600 text-white';
      } else {
        b.classList.remove('selected');
        const badge = b.querySelector('span');
        badge.className = 'w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold bg-slate-700/60 text-slate-300 group-hover:bg-indigo-600 group-hover:text-white';
      }
    });

    updateNextButtonState();
  }

  function updateNextButtonState() {
    // Disabled unless a choice is selected
    if (selectedChoiceId !== null && selectedChoiceId !== undefined) {
      nextBtn.disabled = false;
    } else {
      nextBtn.disabled = true;
    }
  }

  // 5. Next Button Click Handler
  nextBtn.addEventListener('click', () => {
    if (nextBtn.disabled) return;

    if (currentQuestionIndex + 1 < quizData.questions.length) {
      currentQuestionIndex++;
      renderQuestion();
    } else {
      submitQuiz();
    }
  });

  // 6. Submit Quiz & Show Results
  async function submitQuiz() {
    nextBtn.disabled = true;
    nextBtnText.textContent = 'Submitting...';

    const payload = {
      user_id: currentUser.id,
      answers: Object.entries(userAnswers).map(([qId, cId]) => ({
        question_id: parseInt(qId, 10),
        choice_id: parseInt(cId, 10)
      }))
    };

    try {
      const res = await fetch(`/api/quizzes/${quizData.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Failed to evaluate quiz.');
      }

      displayResults(result);
    } catch (err) {
      alert(`Submission error: ${err.message}`);
      nextBtn.disabled = false;
      nextBtnText.textContent = 'Submit Quiz';
    }
  }

  // 7. Results Screen View
  function displayResults(res) {
    questionView.classList.add('hidden');
    resultsView.classList.remove('hidden');

    finalScoreEl.textContent = `${res.score}/${res.total_questions}`;
    finalPercentageEl.textContent = `${res.percentage}%`;
    finalCashEl.textContent = `+$${res.cash_earned}`;

    if (res.bonus_applied) {
      bonusBanner.classList.remove('hidden');
      bonusBannerText.textContent = `PERFECT 10/10 SCORE! +$${res.perfect_bonus_amount} BONUS CASH AWARDED!`;
    } else {
      bonusBanner.classList.add('hidden');
    }

    finalNewBalanceEl.textContent = `$${res.new_balance}`;
    userBalanceEl.textContent = `$${res.new_balance}`;

    // Update currentUser balance in storage
    currentUser.balance = res.new_balance;
    localStorage.setItem('quiz_user', JSON.stringify(currentUser));

    // Appraisal Title & Message
    if (res.percentage === 100) {
      resultsTitle.textContent = 'Flawless Victory! 🌟';
      resultsTitle.className = 'text-3xl font-extrabold text-emerald-400 mb-2';
      resultsMessage.textContent = 'You nailed every single question and unlocked the grand jackpot bonus!';
    } else if (res.percentage >= 80) {
      resultsTitle.textContent = 'Awesome Performance! 🎉';
      resultsTitle.className = 'text-3xl font-extrabold text-indigo-400 mb-2';
      resultsMessage.textContent = 'Outstanding trivia mastery! Check out the breakdown below.';
    } else if (res.percentage >= 60) {
      resultsTitle.textContent = 'Solid Effort! 👍';
      resultsTitle.className = 'text-3xl font-extrabold text-amber-400 mb-2';
      resultsMessage.textContent = 'Good try! Review the tricky answers below and give it another shot.';
    } else {
      resultsTitle.textContent = 'Keep Practicing! 💪';
      resultsTitle.className = 'text-3xl font-extrabold text-slate-300 mb-2';
      resultsMessage.textContent = 'Every quiz teaches you something new. Try again to boost your cash!';
    }

    // Render detailed breakdown
    breakdownContainer.innerHTML = '';
    if (Array.isArray(res.detailed_results)) {
      res.detailed_results.forEach((item, idx) => {
        const row = document.createElement('div');
        row.className = `p-4 rounded-xl border text-sm ${
          item.is_correct
            ? 'bg-slate-950/60 border-emerald-900/40 text-emerald-300'
            : 'bg-slate-950/60 border-rose-900/40 text-rose-300'
        }`;

        row.innerHTML = `
          <div class="flex items-start justify-between gap-3 mb-2">
            <span class="font-semibold text-white leading-snug">${idx + 1}. ${escapeHtml(item.question_text)}</span>
            <span class="text-xs px-2 py-0.5 rounded font-bold ${
              item.is_correct ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
            }">
              ${item.is_correct ? '✓ Correct' : '✗ Missed'}
            </span>
          </div>
          ${
            !item.is_correct
              ? `<div class="text-xs text-slate-400 mt-2 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <span class="text-slate-500">Correct Answer:</span> <strong class="text-emerald-400">${escapeHtml(item.correct_choice_text)}</strong>
                </div>`
              : ''
          }
        `;
        breakdownContainer.appendChild(row);
      });
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Retry Handler
  retryBtn.addEventListener('click', () => {
    initializeQuiz(quizData);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Utility
  function escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Start
  loadQuiz();
})();
