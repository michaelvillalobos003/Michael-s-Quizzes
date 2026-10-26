import { Router } from 'express';
import db, { memStore } from '../db/index.js';

const router = Router();

/**
 * GET /api/attempts/my-history
 * Returns the logged-in user's past completed attempts sorted from newest to oldest
 */
router.get('/my-history', async (req, res) => {
  const userId = req.headers['x-user-id'] 
    ? parseInt(req.headers['x-user-id'], 10) 
    : req.query.user_id 
    ? parseInt(req.query.user_id, 10) 
    : 1;

  try {
    if (db.isPostgres()) {
      const pool = db.getPool();
      const result = await pool.query(`
        SELECT 
          a.id,
          a.user_id,
          a.quiz_id,
          a.score,
          a.total_questions,
          a.percentage,
          a.cash_earned,
          a.completed_at,
          q.title AS quiz_title,
          q.category AS quiz_category,
          q.difficulty AS quiz_difficulty,
          q.is_daily_challenge
        FROM attempts a
        LEFT JOIN quizzes q ON a.quiz_id = q.id
        WHERE a.user_id = $1
        ORDER BY a.completed_at DESC, a.id DESC
      `, [userId]);

      const attempts = result.rows.map(row => ({
        ...row,
        score: parseInt(row.score, 10),
        total_questions: parseInt(row.total_questions, 10),
        percentage: parseInt(row.percentage, 10),
        cash_earned: parseFloat(row.cash_earned),
        is_perfect: parseInt(row.score, 10) === parseInt(row.total_questions, 10),
        quiz_title: row.quiz_title || 'General Quiz'
      }));

      return res.json({ success: true, attempts });
    }

    // In-memory fallback
    const attempts = memStore.attempts
      .filter(a => a.user_id === userId)
      .slice()
      .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
      .map(a => {
        const quiz = memStore.quizzes.find(q => q.id === a.quiz_id);
        return {
          id: a.id,
          user_id: a.user_id,
          quiz_id: a.quiz_id,
          score: a.score,
          total_questions: a.total_questions,
          percentage: a.percentage,
          cash_earned: a.cash_earned,
          completed_at: a.completed_at,
          quiz_title: quiz ? quiz.title : 'General Quiz',
          quiz_category: quiz ? quiz.category : 'General',
          quiz_difficulty: quiz ? quiz.difficulty : 'medium',
          is_daily_challenge: quiz ? Boolean(quiz.is_daily_challenge) : false,
          is_perfect: a.score === a.total_questions
        };
      });

    return res.json({ success: true, attempts });
  } catch (err) {
    console.error('Error fetching attempt history:', err);
    res.status(500).json({ success: false, error: 'Internal server error fetching history' });
  }
});

/**
 * GET /api/attempts/:id/review
 * Returns permanent answer snapshots for a specific completed attempt
 */
router.get('/:id/review', async (req, res) => {
  const attemptId = parseInt(req.params.id, 10);
  if (isNaN(attemptId)) {
    return res.status(400).json({ success: false, error: 'Invalid attempt ID format' });
  }

  try {
    let attempt = null;
    let snapshots = [];

    if (db.isPostgres()) {
      const pool = db.getPool();
      const attemptRes = await pool.query(`
        SELECT 
          a.id, a.user_id, a.quiz_id, a.score, a.total_questions, a.percentage, a.cash_earned, a.completed_at,
          q.title AS quiz_title, q.category AS quiz_category, q.is_daily_challenge
        FROM attempts a
        LEFT JOIN quizzes q ON a.quiz_id = q.id
        WHERE a.id = $1
      `, [attemptId]);

      if (attemptRes.rows.length === 0) {
        return res.status(404).json({ success: false, error: `Attempt #${attemptId} not found` });
      }

      attempt = attemptRes.rows[0];

      const snapRes = await pool.query(`
        SELECT 
          id,
          attempt_id,
          question_id,
          question_text_snapshot,
          selected_choice_text_snapshot,
          correct_choice_text_snapshot,
          is_correct
        FROM attempt_answers
        WHERE attempt_id = $1
        ORDER BY id ASC
      `, [attemptId]);

      snapshots = snapRes.rows;
    } else {
      attempt = memStore.attempts.find(a => a.id === attemptId);
      if (!attempt) {
        return res.status(404).json({ success: false, error: `Attempt #${attemptId} not found` });
      }

      const quiz = memStore.quizzes.find(q => q.id === attempt.quiz_id);
      attempt = {
        ...attempt,
        quiz_title: quiz ? quiz.title : 'Quiz'
      };

      snapshots = memStore.attempt_answers
        .filter(aa => aa.attempt_id === attemptId)
        .sort((a, b) => a.id - b.id);
    }

    const isPerfect = attempt.score === attempt.total_questions;
    const wrongAnswers = snapshots.filter(s => !s.is_correct);

    return res.json({
      success: true,
      attempt: {
        id: attempt.id,
        quiz_id: attempt.quiz_id,
        quiz_title: attempt.quiz_title,
        score: parseInt(attempt.score, 10),
        total_questions: parseInt(attempt.total_questions, 10),
        percentage: parseInt(attempt.percentage, 10),
        cash_earned: parseFloat(attempt.cash_earned),
        completed_at: attempt.completed_at,
        is_perfect: isPerfect
      },
      is_perfect: isPerfect,
      wrong_answers_count: wrongAnswers.length,
      wrong_answers: wrongAnswers,
      all_answers: snapshots
    });
  } catch (err) {
    console.error(`Error fetching attempt review #${attemptId}:`, err);
    res.status(500).json({ success: false, error: 'Internal server error fetching review snapshots' });
  }
});

/**
 * GET /api/attempts/my-created-quizzes
 * Returns user's created quizzes with status badges (Approved, Pending, Draft)
 */
router.get('/my-created-quizzes', async (req, res) => {
  const userId = req.headers['x-user-id'] 
    ? parseInt(req.headers['x-user-id'], 10) 
    : req.query.user_id 
    ? parseInt(req.query.user_id, 10) 
    : 1;

  try {
    if (db.isPostgres()) {
      const pool = db.getPool();
      const resQuizzes = await pool.query(`
        SELECT 
          id, title, description, category, difficulty, is_approved, is_daily_challenge, status, created_at,
          (SELECT COUNT(*) FROM questions q WHERE q.quiz_id = quizzes.id) AS question_count
        FROM quizzes
        WHERE creator_user_id = $1 OR id > 5
        ORDER BY created_at DESC, id DESC
      `, [userId]);

      const list = resQuizzes.rows.map(q => ({
        ...q,
        status: q.status || (q.is_approved ? 'Approved' : 'Pending')
      }));

      return res.json({ success: true, created_quizzes: list });
    }

    // In-memory fallback: return custom or user quizzes
    const list = memStore.quizzes
      .filter(q => q.creator_user_id === userId || q.id > 5)
      .map(q => ({
        ...q,
        status: q.status || (q.is_approved ? 'Approved' : 'Pending'),
        question_count: memStore.questions.filter(qu => qu.quiz_id === q.id).length
      }));

    return res.json({ success: true, created_quizzes: list });
  } catch (err) {
    console.error('Error fetching created quizzes:', err);
    res.status(500).json({ success: false, error: 'Internal server error fetching created quizzes' });
  }
});

export default router;
