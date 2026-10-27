// Michael's Quizzes - Phase 5 Student Quiz Creator Engine

(function () {
  'use strict';

  const storedUser = localStorage.getItem('quiz_user');
  let currentUser = null;
  try {
    currentUser = storedUser ? JSON.parse(storedUser) : null;
  } catch {
    localStorage.removeItem('quiz_user');
  }
  if (!currentUser || !Number.isInteger(Number(currentUser.id)) || Number(currentUser.id) < 1) {
    localStorage.removeItem('quiz_user');
    window.location.replace(`/login.html?redirect=${encodeURIComponent(window.location.href)}`);
    return;
  }
  const headerBalanceEl = document.getElementById('header-balance');
  if (headerBalanceEl) headerBalanceEl.textContent = `$${currentUser.balance || 0}`;

  const urlParams = new URLSearchParams(window.location.search);
  const editQuizId = urlParams.get('edit') ? parseInt(urlParams.get('edit'), 10) : null;

  const pageHeading = document.getElementById('page-heading');
  const feedbackAlert = document.getElementById('feedback-alert');
  const feedbackText = document.getElementById('feedback-text');
  const lockedAlert = document.getElementById('locked-alert');
  const quizCreatorForm = document.getElementById('quiz-creator-form');

  const quizTitleInput = document.getElementById('quiz-title');
  const quizDescInput = document.getElementById('quiz-description');
  const quizCatInput = document.getElementById('quiz-category');
  const quizDiffSelect = document.getElementById('quiz-difficulty');
  const questionsWrapper = document.getElementById('questions-wrapper');
  const formErrorBanner = document.getElementById('form-error-banner');
  const submitQuizBtn = document.getElementById('submit-quiz-btn');
  const submitBtnText = document.getElementById('submit-btn-text');
  const fillSampleBtn = document.getElementById('fill-sample-btn');

  // Render 10 Question Cards
  function render10QuestionCards() {
    questionsWrapper.innerHTML = '';
    for (let qIndex = 0; qIndex < 10; qIndex++) {
      const qNum = qIndex + 1;
      const card = document.createElement('div');
      card.className = 'slate-card p-5 sm:p-6 space-y-4';
      card.dataset.index = qIndex;

      card.innerHTML = `
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <div class="flex items-center gap-2">
            <span class="w-6 h-6 rounded-lg bg-indigo-600/30 text-indigo-400 font-extrabold text-xs flex items-center justify-center">
              ${qNum}
            </span>
            <span class="text-sm font-bold text-white">Question #${qNum}</span>
          </div>
          <span class="text-[11px] text-slate-500 font-semibold">Select 1 correct radio</span>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1">Question Prompt: *</label>
          <input
            type="text"
            id="q-text-${qIndex}"
            required
            placeholder="e.g. In Minecraft, what is the rarest naturally occurring block?"
            class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div class="space-y-2 pt-1">
          <label class="block text-xs font-semibold text-slate-400">Four Choices & Correct Choice: *</label>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            ${[0, 1, 2, 3].map(cIdx => {
              const letter = ['A', 'B', 'C', 'D'][cIdx];
              return `
                <div class="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 focus-within:border-indigo-500">
                  <input
                    type="radio"
                    name="correct-q-${qIndex}"
                    value="${cIdx}"
                    id="radio-${qIndex}-${cIdx}"
                    ${cIdx === 0 ? 'checked' : ''}
                    class="w-4 h-4 text-emerald-500 focus:ring-emerald-400 ml-1 cursor-pointer"
                  />
                  <input
                    type="text"
                    id="choice-${qIndex}-${cIdx}"
                    required
                    placeholder="Choice ${letter}..."
                    class="flex-1 bg-transparent border-0 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                  <span class="text-[10px] text-slate-500 uppercase font-bold mr-1">${letter}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;

      questionsWrapper.appendChild(card);
    }
  }

  render10QuestionCards();

  // If in Edit Mode (?edit=:id)
  if (editQuizId) {
    loadEditQuizDetails(editQuizId);
  }

  async function loadEditQuizDetails(id) {
    try {
      const res = await fetch(`/api/quizzes/${id}/edit-details`, {
        headers: { 'x-user-id': currentUser.id }
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
          lockedAlert.classList.remove('hidden');
          quizCreatorForm.classList.add('hidden');
          return;
        }
        throw new Error(data.error || 'Failed to load quiz details');
      }

      const quiz = data.quiz;
      pageHeading.textContent = `Edit & Resubmit Quiz: ${quiz.title}`;
      submitBtnText.textContent = '🔄 Save Changes & Resubmit for Review';

      // Check for rejection feedback
      if (quiz.status === 'Rejected' && quiz.rejection_feedback) {
        feedbackAlert.classList.remove('hidden');
        feedbackText.textContent = `"${quiz.rejection_feedback}"`;
      }

      quizTitleInput.value = quiz.title || '';
      quizDescInput.value = quiz.description || '';
      quizCatInput.value = quiz.category || '';
      quizDiffSelect.value = quiz.difficulty || 'medium';

      // Pre-populate questions
      if (Array.isArray(quiz.questions)) {
        quiz.questions.forEach((q, qIndex) => {
          if (qIndex < 10) {
            const promptEl = document.getElementById(`q-text-${qIndex}`);
            if (promptEl) promptEl.value = q.question_text || '';

            (q.choices || []).forEach((c, cIdx) => {
              if (cIdx < 4) {
                const choiceInput = document.getElementById(`choice-${qIndex}-${cIdx}`);
                if (choiceInput) choiceInput.value = c.choice_text || '';
                if (c.is_correct) {
                  const radio = document.getElementById(`radio-${qIndex}-${cIdx}`);
                  if (radio) radio.checked = true;
                }
              }
            });
          }
        });
      }
    } catch (err) {
      alert(`Could not load quiz for editing: ${err.message}`);
    }
  }

  // Fast Fill 10 Questions Helper (for instant testing)
  fillSampleBtn.addEventListener('click', () => {
    quizTitleInput.value = 'Pokémon Champions & Battle Lore';
    quizDescInput.value = 'Test your mastery of Starter Pokémon, Legendary beasts, gym badges, and battle mechanics.';
    quizCatInput.value = 'Gaming';
    quizDiffSelect.value = 'medium';

    const samplePrompts = [
      { text: 'Which Fire-type starter from Kanto evolves into Charizard?', choices: ['Charmander', 'Cyndaquil', 'Torchic', 'Chimchar'], correct: 0 },
      { text: 'What legendary psychic Pokémon was cloned from Mew?', choices: ['Mewtwo', 'Deoxys', 'Lugia', 'Celebi'], correct: 0 },
      { text: 'What is the standard Poké Ball capture rate multiplier?', choices: ['1.0x', '1.5x', '2.0x', '2.5x'], correct: 0 },
      { text: 'Which region introduced the Fairy type in Generation VI?', choices: ['Kalos', 'Unova', 'Sinnoh', 'Hoenn'], correct: 0 },
      { text: 'What Pokémon is known as the god of all Pokémon in Sinnoh mythology?', choices: ['Arceus', 'Dialga', 'Palkia', 'Giratina'], correct: 0 },
      { text: 'What item is required to evolve Eevee into Vaporeon?', choices: ['Water Stone', 'Fire Stone', 'Thunder Stone', 'Moon Stone'], correct: 0 },
      { text: 'Which starter Pokémon in Hoenn has the Grass typing?', choices: ['Treecko', 'Mudkip', 'Torchic', 'Chikorita'], correct: 0 },
      { text: 'What type is immune to Electric-type moves?', choices: ['Ground', 'Rock', 'Steel', 'Grass'], correct: 0 },
      { text: 'Who is the iconic Champion of the Sinnoh Pokémon League?', choices: ['Cynthia', 'Steven Stone', 'Lance', 'Leon'], correct: 0 },
      { text: 'Which generation introduced Mega Evolution?', choices: ['Generation VI', 'Generation V', 'Generation VII', 'Generation IV'], correct: 0 }
    ];

    samplePrompts.forEach((s, idx) => {
      document.getElementById(`q-text-${idx}`).value = s.text;
      s.choices.forEach((cText, cIdx) => {
        document.getElementById(`choice-${idx}-${cIdx}`).value = cText;
      });
      document.getElementById(`radio-${idx}-${s.correct}`).checked = true;
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Submit Handler (Create or Resubmit)
  quizCreatorForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    formErrorBanner.classList.add('hidden');

    const title = quizTitleInput.value.trim();
    const description = quizDescInput.value.trim();
    const category = quizCatInput.value.trim();
    const difficulty = quizDiffSelect.value;

    const questions = [];

    for (let qIndex = 0; qIndex < 10; qIndex++) {
      const qText = document.getElementById(`q-text-${qIndex}`).value.trim();
      if (!qText) {
        showError(`Question #${qIndex + 1} prompt is missing.`);
        return;
      }

      const selectedRadio = document.querySelector(`input[name="correct-q-${qIndex}"]:checked`);
      const correctIdx = selectedRadio ? parseInt(selectedRadio.value, 10) : 0;

      const choices = [];
      for (let cIdx = 0; cIdx < 4; cIdx++) {
        const cText = document.getElementById(`choice-${qIndex}-${cIdx}`).value.trim();
        if (!cText) {
          showError(`Question #${qIndex + 1}, Choice ${['A', 'B', 'C', 'D'][cIdx]} cannot be empty.`);
          return;
        }
        choices.push({
          choice_text: cText,
          is_correct: cIdx === correctIdx
        });
      }

      questions.push({
        question_text: qText,
        choices
      });
    }

    submitQuizBtn.disabled = true;
    submitBtnText.textContent = editQuizId ? 'Resubmitting...' : 'Submitting...';

    const payload = {
      user_id: currentUser.id,
      title,
      description,
      category,
      difficulty,
      questions
    };

    try {
      const url = editQuizId ? `/api/quizzes/${editQuizId}/resubmit` : '/api/quizzes/create-student-quiz';
      const method = editQuizId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit quiz');
      }

      alert(editQuizId 
        ? '🎉 Quiz successfully resubmitted! It is now pending educator review.'
        : '🎉 Quiz submitted successfully! Status set to PENDING awaiting educator review.'
      );

      window.location.href = '/history.html?tab=created';
    } catch (err) {
      showError(err.message);
      submitQuizBtn.disabled = false;
      submitBtnText.textContent = editQuizId ? '🔄 Save Changes & Resubmit for Review' : '🚀 Submit Quiz for Educator Review';
    }
  });

  function showError(msg) {
    formErrorBanner.textContent = msg;
    formErrorBanner.classList.remove('hidden');
    formErrorBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
})();
