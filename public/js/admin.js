// Michael's Quizzes - Phase 4 Admin & Teacher Tools Engine

(function () {
  'use strict';

  // Teacher tools require an explicit sign-in.
  const stored = localStorage.getItem('quiz_user');
  let currentUser = null;
  try {
    currentUser = stored ? JSON.parse(stored) : null;
  } catch {
    localStorage.removeItem('quiz_user');
  }
  if (!currentUser || !Number.isInteger(Number(currentUser.id)) || Number(currentUser.id) < 1) {
    localStorage.removeItem('quiz_user');
    window.location.replace(`/login.html?redirect=${encodeURIComponent(window.location.href)}`);
    return;
  }
  let activeRole = currentUser.role || 'student';

  // DOM Elements
  const roleSwitcher = document.getElementById('role-switcher');
  const accessDeniedView = document.getElementById('access-denied-view');
  const adminDashboardView = document.getElementById('admin-dashboard-view');
  const unlockTeacherBtn = document.getElementById('unlock-teacher-btn');

  const adminQuizFilter = document.getElementById('admin-quiz-filter');
  const adminQuestionsLoading = document.getElementById('admin-questions-loading');
  const adminQuestionsList = document.getElementById('admin-questions-list');
  const openCreateQuestionModalBtn = document.getElementById('open-create-question-modal-btn');

  // Question Modal Elements
  const questionModal = document.getElementById('question-modal');
  const modalEyebrow = document.getElementById('modal-eyebrow');
  const modalTitle = document.getElementById('modal-title');
  const questionForm = document.getElementById('question-form');
  const formQuestionId = document.getElementById('form-question-id');
  const formQuizAssignment = document.getElementById('form-quiz-assignment');
  const formQuestionText = document.getElementById('form-question-text');
  const formError = document.getElementById('form-error');
  const closeQuestionModalBtn = document.getElementById('close-question-modal-btn');
  const cancelModalBtn = document.getElementById('cancel-modal-btn');

  // CSV Importer Elements
  const csvTargetQuiz = document.getElementById('csv-target-quiz');
  const csvFileInput = document.getElementById('csv-file-input');
  const csvRawTextarea = document.getElementById('csv-raw-textarea');
  const loadSampleCsvBtn = document.getElementById('load-sample-csv-btn');
  const csvPreviewSection = document.getElementById('csv-preview-section');
  const csvPreviewTbody = document.getElementById('csv-preview-tbody');
  const csvValidBadge = document.getElementById('csv-valid-badge');
  const csvInvalidBadge = document.getElementById('csv-invalid-badge');
  const confirmImportBtn = document.getElementById('confirm-import-btn');

  // Educator Review Queue Elements
  const pendingQueueBadge = document.getElementById('pending-queue-badge');
  const pendingQueueLoading = document.getElementById('pending-queue-loading');
  const pendingQueueEmpty = document.getElementById('pending-queue-empty');
  const pendingQueueList = document.getElementById('pending-queue-list');
  const rejectModal = document.getElementById('reject-feedback-modal');
  const rejectModalQuizTitle = document.getElementById('reject-modal-quiz-title');
  const rejectFeedbackInput = document.getElementById('reject-feedback-input');
  const cancelRejectModalBtn = document.getElementById('cancel-reject-modal-btn');
  const closeRejectModalBtn = document.getElementById('close-reject-modal-btn');
  const confirmRejectBtn = document.getElementById('confirm-reject-btn');
  let pendingRejectQuizId = null;

  let quizzes = [];
  let parsedCsvRows = [];

  // Initialize Role Switcher
  roleSwitcher.value = activeRole;
  roleSwitcher.addEventListener('change', () => {
    activeRole = roleSwitcher.value;
    currentUser.role = activeRole;
    localStorage.setItem('quiz_user', JSON.stringify(currentUser));
    checkAdminAccess();
  });

  unlockTeacherBtn.addEventListener('click', () => {
    activeRole = 'teacher';
    roleSwitcher.value = 'teacher';
    currentUser.role = 'teacher';
    localStorage.setItem('quiz_user', JSON.stringify(currentUser));
    checkAdminAccess();
  });

  function getHeaders() {
    return {
      'Content-Type': 'application/json',
      'x-user-id': String(currentUser.id),
      'x-user-role': activeRole
    };
  }

  // 1. Verify Access Control (HTTP 403 on Student)
  async function checkAdminAccess() {
    try {
      const res = await fetch('/api/admin/check-access', {
        headers: getHeaders()
      });

      if (res.status === 403) {
        // Access Denied (Student)
        adminDashboardView.classList.add('hidden');
        accessDeniedView.classList.remove('hidden');
        return;
      }

      const data = await res.json();
      if (res.ok && data.success) {
        accessDeniedView.classList.add('hidden');
        adminDashboardView.classList.remove('hidden');
        loadQuizzesDropdowns();
        loadPendingReviewQueue();
      } else {
        throw new Error(data.error || 'Authorization failed');
      }
    } catch (err) {
      adminDashboardView.classList.add('hidden');
      accessDeniedView.classList.remove('hidden');
    }
  }

  // 2. Fetch Quizzes to populate dropdowns
  async function loadQuizzesDropdowns() {
    try {
      const res = await fetch('/api/admin/quizzes', {
        headers: getHeaders()
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);

      quizzes = data.quizzes || [];

      // Populate admin-quiz-filter, csv-target-quiz, and form-quiz-assignment
      populateSelect(adminQuizFilter, quizzes);
      populateSelect(csvTargetQuiz, quizzes);
      populateSelect(formQuizAssignment, quizzes);

      if (quizzes.length > 0) {
        loadQuestionsForQuiz(parseInt(adminQuizFilter.value, 10));
      }
    } catch (err) {
      console.error('Failed to load admin quizzes:', err);
    }
  }

  function populateSelect(selectEl, items) {
    const prevVal = selectEl.value;
    selectEl.innerHTML = '';
    items.forEach(q => {
      const opt = document.createElement('option');
      opt.value = q.id;
      opt.textContent = `${q.is_daily_challenge ? '🔥 [Daily] ' : ''}${q.title} (${q.question_count || 0} Qs)`;
      selectEl.appendChild(opt);
    });
    if (prevVal && items.some(i => String(i.id) === String(prevVal))) {
      selectEl.value = prevVal;
    }
  }

  adminQuizFilter.addEventListener('change', () => {
    loadQuestionsForQuiz(parseInt(adminQuizFilter.value, 10));
  });

  // 3. Load Questions for Selected Quiz
  async function loadQuestionsForQuiz(quizId) {
    adminQuestionsLoading.classList.remove('hidden');
    adminQuestionsList.innerHTML = '';

    try {
      const res = await fetch(`/api/admin/quizzes/${quizId}/questions`, {
        headers: getHeaders()
      });
      const data = await res.json();
      adminQuestionsLoading.classList.add('hidden');

      if (!res.ok || !data.success) throw new Error(data.error);

      const questions = data.questions || [];

      if (questions.length === 0) {
        adminQuestionsList.innerHTML = `
          <div class="text-center py-8 text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl">
            No questions currently in this quiz. Click "+ Add New Question" or use the CSV Importer below!
          </div>
        `;
        return;
      }

      questions.forEach((q, idx) => {
        const item = document.createElement('div');
        item.className = 'p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all space-y-3';

        const choicesHtml = (q.choices || []).map((c, cIdx) => {
          const letter = ['A', 'B', 'C', 'D'][cIdx] || cIdx + 1;
          return `
            <div class="p-2 rounded-xl text-xs flex items-center justify-between ${
              c.is_correct
                ? 'bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 font-semibold'
                : 'bg-slate-900 border border-slate-800 text-slate-400'
            }">
              <span class="flex items-center gap-2">
                <span class="font-bold text-[10px] w-5 h-5 rounded flex items-center justify-center ${
                  c.is_correct ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                }">${letter}</span>
                <span>${escapeHtml(c.choice_text)}</span>
              </span>
              ${c.is_correct ? '<span class="text-[10px] font-bold text-emerald-400 uppercase">✓ Correct</span>' : ''}
            </div>
          `;
        }).join('');

        item.innerHTML = `
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-start gap-2">
              <span class="text-xs font-bold text-indigo-400 mt-0.5">#${idx + 1}</span>
              <span class="text-sm font-bold text-white leading-snug">${escapeHtml(q.question_text)}</span>
            </div>

            <div class="flex items-center gap-1.5 shrink-0">
              <button
                class="edit-q-btn px-2.5 py-1 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 hover:text-white border border-indigo-800/50 text-xs font-semibold transition-colors flex items-center gap-1"
                data-id="${q.id}"
              >
                <span>✏️ Edit</span>
              </button>
              <button
                class="del-q-btn px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 hover:text-rose-200 border border-rose-800/50 text-xs font-semibold transition-colors flex items-center gap-1"
                data-id="${q.id}"
                data-title="${escapeHtml(q.question_text)}"
              >
                <span>🗑️</span>
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            ${choicesHtml}
          </div>
        `;

        // Edit button listener
        item.querySelector('.edit-q-btn').addEventListener('click', () => {
          openEditModal(q);
        });

        // Delete button listener
        item.querySelector('.del-q-btn').addEventListener('click', () => {
          handleDeleteQuestion(q.id, q.question_text);
        });

        adminQuestionsList.appendChild(item);
      });
    } catch (err) {
      adminQuestionsLoading.classList.add('hidden');
      adminQuestionsList.innerHTML = `<div class="p-3 text-rose-300 text-xs">Error loading questions: ${escapeHtml(err.message)}</div>`;
    }
  }

  // 4. Pop-Up Question Editor Modal
  openCreateQuestionModalBtn.addEventListener('click', () => {
    openCreateModal();
  });

  function openCreateModal() {
    formError.classList.add('hidden');
    modalEyebrow.textContent = 'Question Studio';
    modalTitle.textContent = 'Add New Question';
    formQuestionId.value = '';
    formQuizAssignment.value = adminQuizFilter.value || (quizzes[0] && quizzes[0].id) || '1';
    formQuestionText.value = '';

    for (let i = 0; i < 4; i++) {
      document.getElementById(`choice-input-${i}`).value = '';
    }
    document.getElementById('choice-radio-0').checked = true;

    questionModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function openEditModal(q) {
    formError.classList.add('hidden');
    modalEyebrow.textContent = 'Edit Question';
    modalTitle.textContent = `Editing Question #${q.id}`;
    formQuestionId.value = q.id;
    formQuizAssignment.value = q.quiz_id;
    formQuestionText.value = q.question_text;

    (q.choices || []).forEach((c, idx) => {
      if (idx < 4) {
        document.getElementById(`choice-input-${idx}`).value = c.choice_text || '';
        if (c.is_correct) {
          document.getElementById(`choice-radio-${idx}`).checked = true;
        }
      }
    });

    questionModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeQuestionModal() {
    questionModal.classList.add('hidden');
    document.body.style.overflow = 'auto';
  }

  closeQuestionModalBtn.addEventListener('click', closeQuestionModal);
  cancelModalBtn.addEventListener('click', closeQuestionModal);
  questionModal.addEventListener('click', (e) => {
    if (e.target === questionModal) closeQuestionModal();
  });

  // Save Question Form Submit (Create or Edit / Move Quiz)
  questionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.classList.add('hidden');

    const questionId = formQuestionId.value;
    const targetQuizId = parseInt(formQuizAssignment.value, 10);
    const qText = formQuestionText.value.trim();

    const selectedRadio = document.querySelector('input[name="correct-choice"]:checked');
    const correctIdx = selectedRadio ? parseInt(selectedRadio.value, 10) : 0;

    const choices = [];
    for (let i = 0; i < 4; i++) {
      const val = document.getElementById(`choice-input-${i}`).value.trim();
      if (!val) {
        formError.textContent = `Choice ${['A', 'B', 'C', 'D'][i]} cannot be empty`;
        formError.classList.remove('hidden');
        return;
      }
      choices.push({
        choice_text: val,
        is_correct: i === correctIdx
      });
    }

    const payload = {
      quiz_id: targetQuizId,
      question_text: qText,
      choices
    };

    try {
      const isEdit = Boolean(questionId);
      const url = isEdit ? `/api/admin/questions/${questionId}` : '/api/admin/questions';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save question');
      }

      closeQuestionModal();
      loadQuizzesDropdowns();
    } catch (err) {
      formError.textContent = err.message;
      formError.classList.remove('hidden');
    }
  });

  // Delete Question Handler
  async function handleDeleteQuestion(questionId, qTitle) {
    if (!confirm(`Are you sure you want to delete this question?\n\n"${qTitle}"`)) return;

    try {
      const res = await fetch(`/api/admin/questions/${questionId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);

      loadQuizzesDropdowns();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  }

  // 5. CSV Batch Importer & Real-Time Preview
  csvFileInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      csvRawTextarea.value = text;
      parseAndValidateCsv(text);
    };
    reader.readAsText(file);
  });

  csvRawTextarea.addEventListener('input', () => {
    parseAndValidateCsv(csvRawTextarea.value);
  });

  loadSampleCsvBtn.addEventListener('click', () => {
    const sample = `question_text, choice_1, choice_2, choice_3, choice_4, correct_choice_index
In Minecraft, what tool is best for mining stone blocks?, Sword, Pickaxe, Shovel, Axe, 2
Who was the first Avenger in Marvel Cinematic Universe history?, Captain America, Iron Man, Thor, Hawkeye, 1
What species of animal is Sonic the Hedgehog?, Echidna, Fox, Hedgehog, Badger, 3
Sample with missing choices (demonstrating error highlight), Option A, Option B, , , 1
What is the largest ocean on Earth?, Atlantic, Pacific, Indian, Arctic, 2`;

    csvRawTextarea.value = sample;
    parseAndValidateCsv(sample);
  });

  // Parse CSV Line (handles basic commas and quotes)
  function parseCsvLine(line) {
    const result = [];
    let cur = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        inQuotes = !inQuotes;
      } else if (c === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    result.push(cur.trim());
    return result;
  }

  function parseAndValidateCsv(rawText) {
    const lines = (rawText || '')
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    if (lines.length === 0) {
      csvPreviewSection.classList.add('hidden');
      confirmImportBtn.disabled = true;
      return;
    }

    // Check if line 1 is header
    let startIndex = 0;
    const firstCols = parseCsvLine(lines[0]);
    if (firstCols[0].toLowerCase().includes('question')) {
      startIndex = 1;
    }

    parsedCsvRows = [];
    csvPreviewTbody.innerHTML = '';
    let validCount = 0;
    let invalidCount = 0;

    for (let i = startIndex; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]);
      const rowNum = i + 1;

      const qText = cols[0] || '';
      const c1 = cols[1] || '';
      const c2 = cols[2] || '';
      const c3 = cols[3] || '';
      const c4 = cols[4] || '';
      const correctRaw = cols[5] || '';

      let correctIdx = parseInt(correctRaw, 10);
      let isValid = true;
      let errorMsg = '';

      if (!qText) {
        isValid = false;
        errorMsg = 'Missing question prompt';
      } else if (!c1 || !c2 || !c3 || !c4) {
        isValid = false;
        errorMsg = 'Requires all 4 choices';
      } else if (isNaN(correctIdx) || (correctIdx < 1 || correctIdx > 4)) {
        isValid = false;
        errorMsg = 'Correct index must be 1-4';
      }

      if (isValid) {
        validCount++;
        parsedCsvRows.push({
          question_text: qText,
          choice_1: c1,
          choice_2: c2,
          choice_3: c3,
          choice_4: c4,
          correct_choice_index: correctIdx
        });
      } else {
        invalidCount++;
      }

      // Render Table Row with highlight
      const tr = document.createElement('tr');
      tr.className = isValid ? 'csv-row-valid' : 'csv-row-invalid';

      tr.innerHTML = `
        <td class="py-2.5 px-3 text-center font-bold text-slate-400">${rowNum}</td>
        <td class="py-2.5 px-3 font-semibold">
          ${isValid
            ? '<span class="text-emerald-400 font-bold">✓ Valid</span>'
            : `<span class="text-rose-400 font-bold" title="${escapeHtml(errorMsg)}">✗ ${escapeHtml(errorMsg)}</span>`
          }
        </td>
        <td class="py-2.5 px-3 max-w-[200px] truncate text-white" title="${escapeHtml(qText)}">${escapeHtml(qText || '—')}</td>
        <td class="py-2.5 px-3 max-w-[120px] truncate ${isValid && correctIdx === 1 ? 'font-bold text-emerald-400' : 'text-slate-300'}">${escapeHtml(c1 || '—')}</td>
        <td class="py-2.5 px-3 max-w-[120px] truncate ${isValid && correctIdx === 2 ? 'font-bold text-emerald-400' : 'text-slate-300'}">${escapeHtml(c2 || '—')}</td>
        <td class="py-2.5 px-3 max-w-[120px] truncate ${isValid && correctIdx === 3 ? 'font-bold text-emerald-400' : 'text-slate-300'}">${escapeHtml(c3 || '—')}</td>
        <td class="py-2.5 px-3 max-w-[120px] truncate ${isValid && correctIdx === 4 ? 'font-bold text-emerald-400' : 'text-slate-300'}">${escapeHtml(c4 || '—')}</td>
        <td class="py-2.5 px-3 text-center font-bold ${isValid ? 'text-emerald-400' : 'text-rose-400'}">
          ${escapeHtml(correctRaw || '—')}
        </td>
      `;

      csvPreviewTbody.appendChild(tr);
    }

    csvValidBadge.textContent = `${validCount} Valid`;
    csvInvalidBadge.textContent = `${invalidCount} Invalid`;
    csvPreviewSection.classList.remove('hidden');

    confirmImportBtn.disabled = validCount === 0;
    confirmImportBtn.textContent = `✓ Confirm & Import ${validCount} Valid Row${validCount === 1 ? '' : 's'}`;
  }

  // 6. Confirm & Commit Batch Import
  confirmImportBtn.addEventListener('click', async () => {
    if (parsedCsvRows.length === 0) return;
    const targetQuizId = parseInt(csvTargetQuiz.value, 10);

    confirmImportBtn.disabled = true;
    confirmImportBtn.textContent = 'Importing...';

    try {
      const res = await fetch(`/api/admin/quizzes/${targetQuizId}/batch-import`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ rows: parsedCsvRows })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Batch import failed');
      }

      alert(`🎉 Success! ${data.imported_count} questions imported into Quiz #${targetQuizId}!`);

      // Clear input and reload
      csvRawTextarea.value = '';
      csvFileInput.value = '';
      csvPreviewSection.classList.add('hidden');
      adminQuizFilter.value = targetQuizId;
      loadQuizzesDropdowns();
    } catch (err) {
      alert(`Import error: ${err.message}`);
      confirmImportBtn.disabled = false;
      confirmImportBtn.textContent = `✓ Confirm & Import Valid Rows`;
    }
  });

  // ============================================
  // 7. Educator Review Queue (Phase 5)
  // ============================================
  async function loadPendingReviewQueue() {
    if (!pendingQueueList) return;
    pendingQueueLoading.classList.remove('hidden');
    pendingQueueEmpty.classList.add('hidden');
    pendingQueueList.innerHTML = '';

    try {
      const res = await fetch('/api/admin/pending-quizzes', {
        headers: getHeaders()
      });
      const data = await res.json();
      pendingQueueLoading.classList.add('hidden');

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load pending queue');
      }

      const pendingList = data.quizzes || data.pending_quizzes || [];
      pendingQueueBadge.textContent = `${pendingList.length} Pending`;

      if (pendingList.length === 0) {
        pendingQueueEmpty.classList.remove('hidden');
        return;
      }

      pendingList.forEach(q => {
        const item = document.createElement('div');
        item.className = 'p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3';
        const formattedDate = q.created_at ? new Date(q.created_at).toLocaleDateString() : 'Recent';
        
        item.innerHTML = `
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Pending Verification
                </span>
                <span class="text-xs text-slate-400 font-medium">${escapeHtml(q.category || 'General')}</span>
                <span class="text-slate-600 text-xs">•</span>
                <span class="text-xs text-slate-400">${formattedDate}</span>
              </div>
              <h4 class="text-base font-bold text-white">${escapeHtml(q.title)}</h4>
              <p class="text-xs text-slate-300">${escapeHtml(q.description || 'No description provided.')}</p>
              <div class="flex items-center gap-3 pt-1 text-xs text-slate-400">
                <span>👤 Student Author: <strong class="text-emerald-400">${escapeHtml(q.creator_username || 'Student #' + q.creator_user_id)}</strong></span>
                <span>•</span>
                <span>📝 ${q.question_count || 10} Questions</span>
              </div>
            </div>
            <div class="flex items-center gap-2 self-end sm:self-center">
              <button
                class="approve-quiz-btn px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5"
                data-id="${q.id}"
                data-title="${escapeHtml(q.title)}"
              >
                <span>✓</span>
                <span>Approve & Publish</span>
              </button>
              <button
                class="reject-quiz-btn px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
                data-id="${q.id}"
                data-title="${escapeHtml(q.title)}"
              >
                <span>✗</span>
                <span>Reject with Notes</span>
              </button>
            </div>
          </div>
        `;
        pendingQueueList.appendChild(item);
      });

      // Attach Approve handlers
      pendingQueueList.querySelectorAll('.approve-quiz-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const quizId = btn.getAttribute('data-id');
          const title = btn.getAttribute('data-title');
          if (!confirm(`Approve and publish "${title}" to the public catalog?\n\nThis will permanently lock student editing.`)) return;
          try {
            const res = await fetch(`/api/admin/quizzes/${quizId}/approve`, {
              method: 'POST',
              headers: getHeaders()
            });
            const d = await res.json();
            if (!res.ok || !d.success) throw new Error(d.error);
            alert(`🎉 "${title}" has been approved and published to the public catalog!`);
            loadPendingReviewQueue();
            loadQuizzesDropdowns();
          } catch (err) {
            alert(`Approve failed: ${err.message}`);
          }
        });
      });

      // Attach Reject handlers
      pendingQueueList.querySelectorAll('.reject-quiz-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          pendingRejectQuizId = btn.getAttribute('data-id');
          const title = btn.getAttribute('data-title');
          rejectModalQuizTitle.textContent = `Quiz: "${title}" (ID: #${pendingRejectQuizId})`;
          rejectFeedbackInput.value = '';
          rejectModal.classList.remove('hidden');
          rejectFeedbackInput.focus();
        });
      });

    } catch (err) {
      pendingQueueLoading.classList.add('hidden');
      pendingQueueList.innerHTML = `<div class="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">Error loading pending queue: ${escapeHtml(err.message)}</div>`;
    }
  }

  // Reject Modal Close & Confirm
  if (closeRejectModalBtn) {
    closeRejectModalBtn.addEventListener('click', () => {
      rejectModal.classList.add('hidden');
    });
  }
  if (cancelRejectModalBtn) {
    cancelRejectModalBtn.addEventListener('click', () => {
      rejectModal.classList.add('hidden');
    });
  }
  if (confirmRejectBtn) {
    confirmRejectBtn.addEventListener('click', async () => {
      if (!pendingRejectQuizId) return;
      const feedback = rejectFeedbackInput.value.trim();
      if (!feedback) {
        alert('Please provide feedback notes explaining what the student needs to fix.');
        return;
      }
      confirmRejectBtn.disabled = true;
      confirmRejectBtn.textContent = 'Submitting...';
      try {
        const res = await fetch(`/api/admin/quizzes/${pendingRejectQuizId}/reject`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ feedback })
        });
        const d = await res.json();
        if (!res.ok || !d.success) throw new Error(d.error);
        alert(`Quiz #${pendingRejectQuizId} rejected. Feedback notes have been recorded for the student to edit & resubmit.`);
        rejectModal.classList.add('hidden');
        confirmRejectBtn.disabled = false;
        confirmRejectBtn.textContent = 'Confirm Rejection';
        loadPendingReviewQueue();
      } catch (err) {
        alert(`Rejection error: ${err.message}`);
        confirmRejectBtn.disabled = false;
        confirmRejectBtn.textContent = 'Confirm Rejection';
      }
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

  // Initial Run
  checkAdminAccess();
})();
