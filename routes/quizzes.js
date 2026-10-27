import { Router } from 'express';
import db, { memStore } from '../db/index.js';
import { seedQuizzes } from '../db/seed-quizzes.js';

const router = Router();

// Ensure store is seeded on module load if empty
if (memStore.quizzes.length === 0) {
  seedQuizzes().catch(console.error);
}

// Utility to shuffle an array (Fisher-Yates)
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * GET /api/quizzes
 * Returns list of approved quizzes (excludes daily challenge quizzes)
 */
router.get('/', async (req, res) => {
  try {
    if (db.isPostgres()) {
      const pool = db.getPool();
      const result = await pool.query(`
        SELECT id, title, description, category, difficulty, is_approved, is_daily_challenge, status, created_at,
          (SELECT COUNT(*) FROM questions q WHERE q.quiz_id = quizzes.id) AS question_count
        FROM quizzes
        WHERE is_approved = true AND (status = 'Approved' OR status IS NULL) AND is_daily_challenge = false
        ORDER BY id ASC
      `);
      return res.json({ success: true, quizzes: result.rows });
    }

    // In-memory fallback
    const list = memStore.quizzes
      .filter(q => q.is_approved && (!q.status || q.status === 'Approved') && !q.is_daily_challenge)
      .map(q => {
        const questionCount = memStore.questions.filter(qu => qu.quiz_id === q.id).length;
        return {
          ...q,
          question_count: questionCount
        };
      });

    return res.json({ success: true, quizzes: list });
  } catch (err) {
    console.error('Error fetching quizzes:', err);
    res.status(500).json({ success: false, error: 'Internal server error fetching quizzes' });
  }
});

/**
 * GET /api/quizzes/daily-challenge
 * Returns active daily challenge quiz
 */
router.get('/daily-challenge', async (req, res) => {
  try {
    let quiz = null;

    if (db.isPostgres()) {
      const pool = db.getPool();
      const quizRes = await pool.query(`
        SELECT id, title, description, category, difficulty, is_approved, is_daily_challenge, created_at
        FROM quizzes
        WHERE is_approved = true AND is_daily_challenge = true
        ORDER BY id DESC
        LIMIT 1
      `);
      quiz = quizRes.rows[0];
    } else {
      quiz = memStore.quizzes
        .slice()
        .reverse()
        .find(q => q.is_approved && q.is_daily_challenge);
    }

    if (!quiz) {
      return res.status(404).json({ success: false, error: 'No active daily challenge quiz found' });
    }

    // Fetch questions and choices (hiding is_correct and shuffling choice order)
    const formatted = await getQuizWithShuffledChoices(quiz.id);
    return res.json({ success: true, quiz: formatted });
  } catch (err) {
    console.error('Error fetching daily challenge:', err);
    res.status(500).json({ success: false, error: 'Internal server error fetching daily challenge' });
  }
});

/**
 * GET /api/quizzes/:id
 * Returns quiz questions and choices (hides is_correct flags and shuffles choice order)
 */
router.get('/:id', async (req, res) => {
  const quizId = parseInt(req.params.id, 10);
  if (isNaN(quizId)) {
    return res.status(400).json({ success: false, error: 'Invalid quiz ID format' });
  }

  try {
    const formatted = await getQuizWithShuffledChoices(quizId);
    if (!formatted) {
      return res.status(404).json({ success: false, error: `Quiz with ID ${quizId} not found` });
    }
    return res.json({ success: true, quiz: formatted });
  } catch (err) {
    console.error(`Error fetching quiz ${quizId}:`, err);
    res.status(500).json({ success: false, error: 'Internal server error fetching quiz details' });
  }
});

/**
 * Helper: Get quiz, questions, and choices with is_correct removed and choices shuffled
 */
async function getQuizWithShuffledChoices(quizId) {
  let quiz = null;
  let questions = [];
  let choices = [];

  if (db.isPostgres()) {
    const pool = db.getPool();
    const quizRes = await pool.query('SELECT * FROM quizzes WHERE id = $1', [quizId]);
    if (quizRes.rows.length === 0) return null;
    quiz = quizRes.rows[0];

    const questionsRes = await pool.query(
      'SELECT id, quiz_id, question_text, order_num FROM questions WHERE quiz_id = $1 ORDER BY order_num ASC',
      [quizId]
    );
    questions = questionsRes.rows;

    const questionIds = questions.map(q => q.id);
    if (questionIds.length > 0) {
      const choicesRes = await pool.query(
        'SELECT id, question_id, choice_text FROM choices WHERE question_id = ANY($1::int[])',
        [questionIds]
      );
      choices = choicesRes.rows;
    }
  } else {
    quiz = memStore.quizzes.find(q => q.id === quizId);
    if (!quiz) return null;

    questions = memStore.questions
      .filter(q => q.quiz_id === quizId)
      .sort((a, b) => a.order_num - b.order_num);

    const questionIds = new Set(questions.map(q => q.id));
    choices = memStore.choices
      .filter(c => questionIds.has(c.question_id))
      .map(c => ({
        id: c.id,
        question_id: c.question_id,
        choice_text: c.choice_text
        // Note: is_correct is strictly omitted here
      }));
  }

  // Group choices by question and shuffle each question's choices
  const formattedQuestions = questions.map(q => {
    const qChoices = choices.filter(c => c.question_id === q.id);
    return {
      id: q.id,
      question_text: q.question_text,
      order_num: q.order_num,
      choices: shuffleArray(qChoices)
    };
  });

  return {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    category: quiz.category,
    difficulty: quiz.difficulty,
    is_daily_challenge: Boolean(quiz.is_daily_challenge),
    total_questions: formattedQuestions.length,
    questions: formattedQuestions
  };
}

/**
 * POST /api/quizzes/:id/submit
 * Evaluates answers server-side, calculates score, accuracy percentage, awards virtual cash:
 * - Standard Quiz: $10 per correct answer + $25 bonus for a perfect score (10/10).
 * - Daily Challenge: $50 per correct answer + $150 bonus for a perfect score (10/10).
 * Updates users.balance in PostgreSQL / memory and returns score & payout details.
 */
router.post('/:id/submit', async (req, res) => {
  const quizId = parseInt(req.params.id, 10);
  if (isNaN(quizId)) {
    return res.status(400).json({ success: false, error: 'Invalid quiz ID format' });
  }

  const { answers, user_id } = req.body;
  // answers format: [ { question_id: 1, choice_id: 3 }, ... ] or object { [question_id]: choice_id }

  if (!answers) {
    return res.status(400).json({ success: false, error: 'Missing answers array in request body' });
  }

  // Normalized answers array
  let answerList = [];
  if (Array.isArray(answers)) {
    answerList = answers;
  } else if (typeof answers === 'object') {
    answerList = Object.entries(answers).map(([qId, cId]) => ({
      question_id: parseInt(qId, 10),
      choice_id: cId !== null && cId !== undefined ? parseInt(cId, 10) : null
    }));
  }

  try {
    let quiz = null;
    let questions = [];
    let choicesWithCorrectness = [];

    if (db.isPostgres()) {
      const pool = db.getPool();
      const qRes = await pool.query('SELECT * FROM quizzes WHERE id = $1', [quizId]);
      if (qRes.rows.length === 0) {
        return res.status(404).json({ success: false, error: `Quiz with ID ${quizId} not found` });
      }
      quiz = qRes.rows[0];

      const questionsRes = await pool.query('SELECT * FROM questions WHERE quiz_id = $1 ORDER BY order_num ASC', [quizId]);
      questions = questionsRes.rows;

      const qIds = questions.map(q => q.id);
      if (qIds.length > 0) {
        const cRes = await pool.query('SELECT * FROM choices WHERE question_id = ANY($1::int[])', [qIds]);
        choicesWithCorrectness = cRes.rows;
      }
    } else {
      quiz = memStore.quizzes.find(q => q.id === quizId);
      if (!quiz) {
        return res.status(404).json({ success: false, error: `Quiz with ID ${quizId} not found` });
      }
      questions = memStore.questions.filter(q => q.quiz_id === quizId).sort((a, b) => a.order_num - b.order_num);
      const qIds = new Set(questions.map(q => q.id));
      choicesWithCorrectness = memStore.choices.filter(c => qIds.has(c.question_id));
    }

    const totalQuestions = questions.length;
    let correctCount = 0;
    const detailedResults = [];

    // Evaluate answers
    for (const q of questions) {
      const userAns = answerList.find(a => a.question_id === q.id);
      const chosenChoiceId = userAns ? userAns.choice_id : null;
      
      const qChoices = choicesWithCorrectness.filter(c => c.question_id === q.id);
      const correctChoice = qChoices.find(c => c.is_correct);
      const isCorrect = Boolean(chosenChoiceId && correctChoice && chosenChoiceId === correctChoice.id);

      if (isCorrect) {
        correctCount++;
      }

      const chosenChoice = qChoices.find(c => c.id === chosenChoiceId);
      const chosenChoiceText = chosenChoice ? chosenChoice.choice_text : null;

      detailedResults.push({
        question_id: q.id,
        question_text: q.question_text,
        chosen_choice_id: chosenChoiceId,
        selected_choice_text: chosenChoiceText,
        correct_choice_id: correctChoice ? correctChoice.id : null,
        correct_choice_text: correctChoice ? correctChoice.choice_text : '',
        is_correct: isCorrect
      });
    }

    const accuracyPercentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const isPerfect = totalQuestions > 0 && correctCount === totalQuestions;
    const isDaily = Boolean(quiz.is_daily_challenge);

    // Calculate Virtual Cash Payout Rules:
    // Standard Quiz: $10 per correct answer + $25 bonus for a perfect score (10/10)
    // Daily Challenge: $50 per correct answer + $150 bonus for a perfect score (10/10)
    const perAnswerRate = isDaily ? 50 : 10;
    const perfectBonus = isDaily ? 150 : 25;
    
    let cashEarned = correctCount * perAnswerRate;
    let bonusApplied = false;

    if (isPerfect) {
      cashEarned += perfectBonus;
      bonusApplied = true;
    }

    // Determine user ID (default to user 1 if not specified)
    const targetUserId = user_id ? parseInt(user_id, 10) : 1;
    let previousBalance = 0;
    let newBalance = 0;

    if (db.isPostgres()) {
      const pool = db.getPool();
      // Fetch and update user balance
      const userRes = await pool.query('SELECT balance FROM users WHERE id = $1', [targetUserId]);
      if (userRes.rows.length > 0) {
        previousBalance = Number(userRes.rows[0].balance);
        newBalance = previousBalance + cashEarned;
        await pool.query('UPDATE users SET balance = $1 WHERE id = $2', [newBalance, targetUserId]);
      } else {
        // If user doesn't exist, create one
        previousBalance = 0;
        newBalance = cashEarned;
        await pool.query(
          'INSERT INTO users (id, username, email, balance) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET balance = users.balance + $4',
          [targetUserId, `User_${targetUserId}`, `user${targetUserId}@example.com`, newBalance]
        );
      }

      // Record submission
      await pool.query(
        `INSERT INTO quiz_submissions (user_id, quiz_id, score, total_questions, percentage, cash_earned)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [targetUserId, quizId, correctCount, totalQuestions, accuracyPercentage, cashEarned]
      );
    } else {
      // Memory Store update
      let user = memStore.users.find(u => u.id === targetUserId);
      if (!user) {
        user = {
          id: targetUserId,
          username: `User_${targetUserId}`,
          email: `user${targetUserId}@example.com`,
          balance: 0,
          created_at: new Date()
        };
        memStore.users.push(user);
      }
      previousBalance = user.balance;
      user.balance += cashEarned;
      newBalance = user.balance;

      memStore.submissions.push({
        id: memStore.counters.submissions++,
        user_id: targetUserId,
        quiz_id: quizId,
        score: correctCount,
        total_questions: totalQuestions,
        percentage: accuracyPercentage,
        cash_earned: cashEarned,
        created_at: new Date()
      });
    }

    // Check completion rule: Abandoned or unfinished sessions must NEVER be written to the database
    const isCompleted = answerList.length >= totalQuestions && totalQuestions > 0;
    let attemptId = null;

    if (isCompleted) {
      if (db.isPostgres()) {
        const pool = db.getPool();
        const attemptRes = await pool.query(
          `INSERT INTO attempts (user_id, quiz_id, score, total_questions, percentage, cash_earned, completed_at)
           VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
           RETURNING id`,
          [targetUserId, quizId, correctCount, totalQuestions, accuracyPercentage, cashEarned]
        );
        attemptId = attemptRes.rows[0].id;

        for (const detail of detailedResults) {
          await pool.query(
            `INSERT INTO attempt_answers (attempt_id, question_id, question_text_snapshot, selected_choice_text_snapshot, correct_choice_text_snapshot, is_correct)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              attemptId,
              detail.question_id,
              detail.question_text,
              detail.selected_choice_text || '(No Answer / Skipped)',
              detail.correct_choice_text,
              detail.is_correct
            ]
          );
        }
      } else {
        attemptId = memStore.counters.attempts++;
        memStore.attempts.push({
          id: attemptId,
          user_id: targetUserId,
          quiz_id: quizId,
          score: correctCount,
          total_questions: totalQuestions,
          percentage: accuracyPercentage,
          cash_earned: cashEarned,
          completed_at: new Date()
        });

        for (const detail of detailedResults) {
          memStore.attempt_answers.push({
            id: memStore.counters.attempt_answers++,
            attempt_id: attemptId,
            question_id: detail.question_id,
            question_text_snapshot: detail.question_text,
            selected_choice_text_snapshot: detail.selected_choice_text || '(No Answer / Skipped)',
            correct_choice_text_snapshot: detail.correct_choice_text,
            is_correct: detail.is_correct,
            created_at: new Date()
          });
        }
      }
    }

    return res.json({
      success: true,
      message: isPerfect ? '🏆 Perfect Score! Bonus Cash Awarded!' : 'Quiz completed successfully!',
      attempt_id: attemptId,
      quiz_id: quiz.id,
      quiz_title: quiz.title,
      is_daily_challenge: isDaily,
      score: correctCount,
      total_questions: totalQuestions,
      percentage: accuracyPercentage,
      cash_earned: cashEarned,
      is_perfect: isPerfect,
      bonus_applied: bonusApplied,
      per_answer_rate: perAnswerRate,
      perfect_bonus_amount: isPerfect ? perfectBonus : 0,
      user_id: targetUserId,
      previous_balance: previousBalance,
      new_balance: newBalance,
      detailed_results: detailedResults
    });
  } catch (err) {
    console.error(`Error submitting quiz ${quizId}:`, err);
    res.status(500).json({ success: false, error: 'Internal server error evaluating quiz submission' });
  }
});

/**
 * POST /api/quizzes/create-student-quiz
 * Allows students to build a 10-question quiz with 4 choices per question and 1 correct choice.
 * Sets status = 'Pending' and is_approved = false (isolates from public catalog).
 */
router.post('/create-student-quiz', async (req, res) => {
  const userId = req.headers['x-user-id'] 
    ? parseInt(req.headers['x-user-id'], 10) 
    : req.body.user_id 
    ? parseInt(req.body.user_id, 10) 
    : 1;

  const { title, description, category, difficulty, questions } = req.body;

  if (!title || !category || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Invalid payload: title, category, and questions array are required'
    });
  }

  // Validate each question
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (!q.question_text || !q.question_text.trim()) {
      return res.status(400).json({ success: false, error: `Question #${i + 1} is missing question prompt` });
    }
    if (!Array.isArray(q.choices) || q.choices.length !== 4) {
      return res.status(400).json({ success: false, error: `Question #${i + 1} must have exactly 4 choices` });
    }
    const correctCount = q.choices.filter(c => Boolean(c.is_correct)).length;
    if (correctCount !== 1) {
      return res.status(400).json({ success: false, error: `Question #${i + 1} must have exactly 1 correct choice selected` });
    }
  }

  try {
    if (db.isPostgres()) {
      const pool = db.getPool();
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const quizRes = await client.query(
          `INSERT INTO quizzes (title, description, category, difficulty, is_approved, is_daily_challenge, status, creator_user_id, rejection_feedback)
           VALUES ($1, $2, $3, $4, false, false, 'Pending', $5, NULL)
           RETURNING id`,
          [title.trim(), (description || '').trim(), category.trim(), difficulty || 'medium', userId]
        );
        const quizId = quizRes.rows[0].id;

        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          const qRes = await client.query(
            `INSERT INTO questions (quiz_id, question_text, order_num) VALUES ($1, $2, $3) RETURNING id`,
            [quizId, q.question_text.trim(), i + 1]
          );
          const questionId = qRes.rows[0].id;

          for (const c of q.choices) {
            await client.query(
              `INSERT INTO choices (question_id, choice_text, is_correct) VALUES ($1, $2, $3)`,
              [questionId, (c.choice_text || '').trim(), Boolean(c.is_correct)]
            );
          }
        }

        await client.query('COMMIT');
        return res.json({
          success: true,
          message: 'Quiz submitted successfully! Status is set to Pending awaiting educator review.',
          quiz_id: quizId,
          status: 'Pending'
        });
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }

    // In-memory fallback
    const quizId = memStore.counters.quizzes++;
    memStore.quizzes.push({
      id: quizId,
      title: title.trim(),
      description: (description || '').trim(),
      category: category.trim(),
      difficulty: difficulty || 'medium',
      is_approved: false,
      is_daily_challenge: false,
      status: 'Pending',
      creator_user_id: userId,
      rejection_feedback: null,
      created_at: new Date()
    });

    questions.forEach((q, idx) => {
      const qId = memStore.counters.questions++;
      memStore.questions.push({
        id: qId,
        quiz_id: quizId,
        question_text: q.question_text.trim(),
        order_num: idx + 1
      });

      q.choices.forEach(c => {
        memStore.choices.push({
          id: memStore.counters.choices++,
          question_id: qId,
          choice_text: (c.choice_text || '').trim(),
          is_correct: Boolean(c.is_correct)
        });
      });
    });

    return res.json({
      success: true,
      message: 'Quiz submitted successfully! Status is set to Pending awaiting educator review.',
      quiz_id: quizId,
      status: 'Pending'
    });
  } catch (err) {
    console.error('Error creating student quiz:', err);
    res.status(500).json({ success: false, error: 'Failed to create student quiz' });
  }
});

/**
 * GET /api/quizzes/:id/edit-details
 * Pre-loads rejected quizzes with prior data for editing and validates creator permissions.
 * Rule: Approved quizzes are permanently locked from student editing.
 */
router.get('/:id/edit-details', async (req, res) => {
  const quizId = parseInt(req.params.id, 10);
  const userId = req.headers['x-user-id'] ? parseInt(req.headers['x-user-id'], 10) : 1;

  if (isNaN(quizId)) return res.status(400).json({ success: false, error: 'Invalid quiz ID' });

  try {
    let quiz = null;
    let questions = [];

    if (db.isPostgres()) {
      const pool = db.getPool();
      const qRes = await pool.query('SELECT * FROM quizzes WHERE id = $1', [quizId]);
      if (qRes.rows.length === 0) return res.status(404).json({ success: false, error: 'Quiz not found' });
      quiz = qRes.rows[0];

      if (quiz.status === 'Approved') {
        return res.status(403).json({
          success: false,
          error: 'This quiz has already been approved by an educator and is permanently locked from student editing.'
        });
      }

      const questionsRes = await pool.query(
        'SELECT id, quiz_id, question_text, order_num FROM questions WHERE quiz_id = $1 ORDER BY order_num ASC',
        [quizId]
      );
      questions = questionsRes.rows;

      const qIds = questions.map(q => q.id);
      let choices = [];
      if (qIds.length > 0) {
        const cRes = await pool.query('SELECT id, question_id, choice_text, is_correct FROM choices WHERE question_id = ANY($1::int[]) ORDER BY id ASC', [qIds]);
        choices = cRes.rows;
      }

      const formatted = questions.map(q => ({
        id: q.id,
        question_text: q.question_text,
        order_num: q.order_num,
        choices: choices.filter(c => c.question_id === q.id)
      }));

      return res.json({
        success: true,
        quiz: {
          id: quiz.id,
          title: quiz.title,
          description: quiz.description,
          category: quiz.category,
          difficulty: quiz.difficulty,
          status: quiz.status,
          rejection_feedback: quiz.rejection_feedback,
          creator_user_id: quiz.creator_user_id,
          questions: formatted
        }
      });
    }

    // In-memory fallback
    quiz = memStore.quizzes.find(q => q.id === quizId);
    if (!quiz) return res.status(404).json({ success: false, error: 'Quiz not found' });

    if (quiz.status === 'Approved') {
      return res.status(403).json({
        success: false,
        error: 'This quiz has already been approved by an educator and is permanently locked from student editing.'
      });
    }

    const qList = memStore.questions
      .filter(q => q.quiz_id === quizId)
      .sort((a, b) => a.order_num - b.order_num);

    const formatted = qList.map(q => ({
      id: q.id,
      question_text: q.question_text,
      order_num: q.order_num,
      choices: memStore.choices.filter(c => c.question_id === q.id)
    }));

    return res.json({
      success: true,
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        category: quiz.category,
        difficulty: quiz.difficulty,
        status: quiz.status,
        rejection_feedback: quiz.rejection_feedback,
        creator_user_id: quiz.creator_user_id,
        questions: formatted
      }
    });
  } catch (err) {
    console.error(`Error loading edit details for quiz ${quizId}:`, err);
    res.status(500).json({ success: false, error: 'Failed to retrieve quiz details for editing' });
  }
});

/**
 * PUT /api/quizzes/:id/resubmit
 * Updates quiz and resets status to 'Pending' (clearing rejection_feedback)
 */
router.put('/:id/resubmit', async (req, res) => {
  const quizId = parseInt(req.params.id, 10);
  if (isNaN(quizId)) return res.status(400).json({ success: false, error: 'Invalid quiz ID' });

  const { title, description, category, difficulty, questions } = req.body;

  try {
    if (db.isPostgres()) {
      const pool = db.getPool();
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Verify not locked
        const checkRes = await client.query('SELECT status FROM quizzes WHERE id = $1', [quizId]);
        if (checkRes.rows.length === 0) return res.status(404).json({ success: false, error: 'Quiz not found' });
        if (checkRes.rows[0].status === 'Approved') {
          return res.status(403).json({ success: false, error: 'Approved quizzes are permanently locked.' });
        }

        // Update quiz record
        await client.query(
          `UPDATE quizzes 
           SET title = $1, description = $2, category = $3, difficulty = $4, status = 'Pending', is_approved = false, rejection_feedback = NULL
           WHERE id = $5`,
          [title.trim(), (description || '').trim(), category.trim(), difficulty || 'medium', quizId]
        );

        // Delete old questions/choices
        await client.query('DELETE FROM questions WHERE quiz_id = $1', [quizId]);

        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          const qRes = await client.query(
            `INSERT INTO questions (quiz_id, question_text, order_num) VALUES ($1, $2, $3) RETURNING id`,
            [quizId, q.question_text.trim(), i + 1]
          );
          const questionId = qRes.rows[0].id;

          for (const c of q.choices) {
            await client.query(
              `INSERT INTO choices (question_id, choice_text, is_correct) VALUES ($1, $2, $3)`,
              [questionId, (c.choice_text || '').trim(), Boolean(c.is_correct)]
            );
          }
        }

        await client.query('COMMIT');
        return res.json({
          success: true,
          message: 'Quiz resubmitted successfully! It is now pending educator review.',
          status: 'Pending'
        });
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }

    // In-memory fallback
    const quiz = memStore.quizzes.find(q => q.id === quizId);
    if (!quiz) return res.status(404).json({ success: false, error: 'Quiz not found' });
    if (quiz.status === 'Approved') {
      return res.status(403).json({ success: false, error: 'Approved quizzes are permanently locked.' });
    }

    quiz.title = title.trim();
    quiz.description = (description || '').trim();
    quiz.category = category.trim();
    quiz.difficulty = difficulty || 'medium';
    quiz.status = 'Pending';
    quiz.is_approved = false;
    quiz.rejection_feedback = null;

    // Remove old questions/choices
    const oldQIds = memStore.questions.filter(q => q.quiz_id === quizId).map(q => q.id);
    memStore.choices = memStore.choices.filter(c => !oldQIds.includes(c.question_id));
    memStore.questions = memStore.questions.filter(q => q.quiz_id !== quizId);

    // Re-insert questions/choices
    questions.forEach((q, idx) => {
      const qId = memStore.counters.questions++;
      memStore.questions.push({
        id: qId,
        quiz_id: quizId,
        question_text: q.question_text.trim(),
        order_num: idx + 1
      });

      q.choices.forEach(c => {
        memStore.choices.push({
          id: memStore.counters.choices++,
          question_id: qId,
          choice_text: (c.choice_text || '').trim(),
          is_correct: Boolean(c.is_correct)
        });
      });
    });

    return res.json({
      success: true,
      message: 'Quiz resubmitted successfully! It is now pending educator review.',
      status: 'Pending'
    });
  } catch (err) {
    console.error(`Error resubmitting quiz ${quizId}:`, err);
    res.status(500).json({ success: false, error: 'Failed to resubmit quiz' });
  }
});

export default router;
