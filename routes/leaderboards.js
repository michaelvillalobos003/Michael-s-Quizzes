import { Router } from 'express';
import db, { memStore } from '../db/index.js';

const router = Router();

/**
 * GET /api/leaderboards/balance
 * Returns top users ranked by virtual cash (balance DESC).
 * Privacy: Displays usernames only, never emails.
 */
router.get('/balance', async (req, res) => {
  try {
    if (db.isPostgres()) {
      const pool = db.getPool();
      const result = await pool.query(`
        SELECT 
          id AS user_id,
          username,
          balance,
          role
        FROM users
        ORDER BY balance DESC, id ASC
        LIMIT 50
      `);

      const leaderboard = result.rows.map((row, index) => ({
        rank: index + 1,
        user_id: row.user_id,
        username: row.username,
        balance: parseFloat(row.balance || 0),
        role: row.role || 'student'
      }));

      return res.json({ success: true, leaderboard });
    }

    // In-memory fallback
    const leaderboard = memStore.users
      .slice()
      .sort((a, b) => (b.balance || 0) - (a.balance || 0))
      .slice(0, 50)
      .map((u, index) => ({
        rank: index + 1,
        user_id: u.id,
        username: u.username,
        balance: u.balance || 0,
        role: u.role || 'student'
      }));

    return res.json({ success: true, leaderboard });
  } catch (err) {
    console.error('Error fetching balance leaderboard:', err);
    res.status(500).json({ success: false, error: 'Server error fetching balance leaderboard' });
  }
});

/**
 * GET /api/leaderboards/overall
 * Returns top users ranked by total completed quiz attempts.
 * Privacy & Filtering: Displays usernames only, ignores incomplete attempts.
 */
router.get('/overall', async (req, res) => {
  try {
    if (db.isPostgres()) {
      const pool = db.getPool();
      const result = await pool.query(`
        SELECT 
          u.id AS user_id,
          u.username,
          u.role,
          COUNT(a.id) AS total_completed_attempts,
          ROUND(AVG(a.percentage)) AS average_percentage,
          COALESCE(SUM(a.cash_earned), 0) AS total_cash_earned
        FROM users u
        INNER JOIN attempts a ON a.user_id = u.id
        GROUP BY u.id, u.username, u.role
        HAVING COUNT(a.id) > 0
        ORDER BY total_completed_attempts DESC, average_percentage DESC
        LIMIT 50
      `);

      const leaderboard = result.rows.map((row, index) => ({
        rank: index + 1,
        user_id: row.user_id,
        username: row.username,
        role: row.role || 'student',
        total_completed_attempts: parseInt(row.total_completed_attempts, 10),
        average_percentage: parseInt(row.average_percentage, 10),
        total_cash_earned: parseFloat(row.total_cash_earned)
      }));

      return res.json({ success: true, leaderboard });
    }

    // In-memory fallback
    const userStatsMap = new Map();

    for (const a of memStore.attempts) {
      if (!userStatsMap.has(a.user_id)) {
        userStatsMap.set(a.user_id, { count: 0, sumPct: 0, sumCash: 0 });
      }
      const st = userStatsMap.get(a.user_id);
      st.count += 1;
      st.sumPct += a.percentage || 0;
      st.sumCash += a.cash_earned || 0;
    }

    const leaderboard = [];
    for (const [userId, stats] of userStatsMap.entries()) {
      const user = memStore.users.find(u => u.id === userId);
      if (user && stats.count > 0) {
        leaderboard.push({
          user_id: user.id,
          username: user.username,
          role: user.role || 'student',
          total_completed_attempts: stats.count,
          average_percentage: Math.round(stats.sumPct / stats.count),
          total_cash_earned: stats.sumCash
        });
      }
    }

    leaderboard.sort((a, b) => {
      if (b.total_completed_attempts !== a.total_completed_attempts) {
        return b.total_completed_attempts - a.total_completed_attempts;
      }
      return b.average_percentage - a.average_percentage;
    });

    const ranked = leaderboard.slice(0, 50).map((row, index) => ({
      rank: index + 1,
      ...row
    }));

    return res.json({ success: true, leaderboard: ranked });
  } catch (err) {
    console.error('Error fetching overall completed leaderboard:', err);
    res.status(500).json({ success: false, error: 'Server error fetching overall leaderboard' });
  }
});

/**
 * GET /api/leaderboards/quiz/:quiz_id
 * Returns users ranked by highest percentage score on a specific quiz, showing their attempt count for that quiz.
 * Privacy & Filtering: Displays usernames only, ignores incomplete attempts.
 */
router.get('/quiz/:quiz_id', async (req, res) => {
  const quizId = parseInt(req.params.quiz_id, 10);
  if (isNaN(quizId)) {
    return res.status(400).json({ success: false, error: 'Invalid quiz ID format' });
  }

  try {
    let quizTitle = 'Quiz';

    if (db.isPostgres()) {
      const pool = db.getPool();
      const qRes = await pool.query('SELECT id, title FROM quizzes WHERE id = $1', [quizId]);
      if (qRes.rows.length === 0) {
        return res.status(404).json({ success: false, error: `Quiz #${quizId} not found` });
      }
      quizTitle = qRes.rows[0].title;

      const result = await pool.query(`
        SELECT 
          u.id AS user_id,
          u.username,
          MAX(a.score) AS best_score,
          MAX(a.total_questions) AS total_questions,
          MAX(a.percentage) AS best_percentage,
          COUNT(a.id) AS attempt_count,
          MAX(a.completed_at) AS last_attempt_at
        FROM attempts a
        INNER JOIN users u ON a.user_id = u.id
        WHERE a.quiz_id = $1
        GROUP BY u.id, u.username
        ORDER BY best_percentage DESC, attempt_count ASC, last_attempt_at ASC
        LIMIT 50
      `, [quizId]);

      const leaderboard = result.rows.map((row, index) => ({
        rank: index + 1,
        user_id: row.user_id,
        username: row.username,
        best_score: parseInt(row.best_score, 10),
        total_questions: parseInt(row.total_questions, 10),
        best_percentage: parseInt(row.best_percentage, 10),
        attempt_count: parseInt(row.attempt_count, 10),
        last_attempt_at: row.last_attempt_at
      }));

      return res.json({
        success: true,
        quiz_id: quizId,
        quiz_title: quizTitle,
        leaderboard
      });
    }

    // In-memory fallback
    const quiz = memStore.quizzes.find(q => q.id === quizId);
    if (!quiz) {
      return res.status(404).json({ success: false, error: `Quiz #${quizId} not found` });
    }
    quizTitle = quiz.title;

    const quizAttempts = memStore.attempts.filter(a => a.quiz_id === quizId);
    const userAttemptMap = new Map();

    for (const a of quizAttempts) {
      if (!userAttemptMap.has(a.user_id)) {
        userAttemptMap.set(a.user_id, {
          user_id: a.user_id,
          best_score: a.score,
          total_questions: a.total_questions,
          best_percentage: a.percentage,
          attempt_count: 0,
          last_attempt_at: a.completed_at
        });
      }
      const st = userAttemptMap.get(a.user_id);
      st.attempt_count += 1;
      if (a.percentage > st.best_percentage) {
        st.best_percentage = a.percentage;
        st.best_score = a.score;
      }
      if (new Date(a.completed_at) > new Date(st.last_attempt_at)) {
        st.last_attempt_at = a.completed_at;
      }
    }

    const leaderboard = [];
    for (const [userId, item] of userAttemptMap.entries()) {
      const user = memStore.users.find(u => u.id === userId);
      if (user) {
        leaderboard.push({
          user_id: user.id,
          username: user.username,
          best_score: item.best_score,
          total_questions: item.total_questions,
          best_percentage: item.best_percentage,
          attempt_count: item.attempt_count,
          last_attempt_at: item.last_attempt_at
        });
      }
    }

    leaderboard.sort((a, b) => {
      if (b.best_percentage !== a.best_percentage) {
        return b.best_percentage - a.best_percentage;
      }
      return a.attempt_count - b.attempt_count;
    });

    const ranked = leaderboard.slice(0, 50).map((row, index) => ({
      rank: index + 1,
      ...row
    }));

    return res.json({
      success: true,
      quiz_id: quizId,
      quiz_title: quizTitle,
      leaderboard: ranked
    });
  } catch (err) {
    console.error(`Error fetching quiz #${quizId} leaderboard:`, err);
    res.status(500).json({ success: false, error: 'Server error fetching quiz leaderboard' });
  }
});

export default router;
