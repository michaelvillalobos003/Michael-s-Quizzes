import { Router } from 'express';
import db, { memStore } from '../db/index.js';

const router = Router();

// GET /api/users/me - Get current user profile and balance
router.get('/me', async (req, res) => {
  const userId = req.headers['x-user-id'] ? parseInt(req.headers['x-user-id'], 10) : 1;

  try {
    if (db.isPostgres()) {
      const pool = db.getPool();
      const userRes = await pool.query('SELECT id, username, email, role, balance, streak_count, last_daily_bonus_claimed FROM users WHERE id = $1', [userId]);
      if (userRes.rows.length > 0) {
        return res.json({ success: true, user: userRes.rows[0] });
      }
    } else {
      const user = memStore.users.find(u => u.id === userId);
      if (user) {
        return res.json({
          success: true,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role || 'student',
            balance: user.balance,
            streak_count: user.streak_count || 3,
            last_daily_bonus_claimed: user.last_daily_bonus_claimed || null
          }
        });
      }
    }

    return res.status(404).json({ success: false, error: 'User not found' });
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ success: false, error: 'Server error fetching user profile' });
  }
});

// GET /api/users/dashboard-stats - For Bento Grid Home Dashboard
router.get('/dashboard-stats', async (req, res) => {
  const userId = req.headers['x-user-id'] ? parseInt(req.headers['x-user-id'], 10) : 1;

  try {
    let user = null;
    let completedCount = 0;
    let rank = 1;
    let latestAttempt = null;

    if (db.isPostgres()) {
      const pool = db.getPool();
      const uRes = await pool.query('SELECT id, username, email, role, balance, streak_count, last_daily_bonus_claimed FROM users WHERE id = $1', [userId]);
      if (uRes.rows.length > 0) user = uRes.rows[0];

      // Completed attempts
      const countRes = await pool.query('SELECT COUNT(*) FROM attempts WHERE user_id = $1', [userId]);
      completedCount = parseInt(countRes.rows[0].count, 10);

      // Rank
      const rankRes = await pool.query(
        'SELECT COUNT(*) + 1 AS rank FROM users WHERE balance > (SELECT balance FROM users WHERE id = $1)',
        [userId]
      );
      rank = parseInt(rankRes.rows[0].rank, 10);

      // Latest attempt
      const latestRes = await pool.query(`
        SELECT a.id, a.score, a.total_questions, a.percentage, a.cash_earned, a.completed_at, q.title as quiz_title
        FROM attempts a
        LEFT JOIN quizzes q ON a.quiz_id = q.id
        WHERE a.user_id = $1
        ORDER BY a.completed_at DESC
        LIMIT 1
      `, [userId]);
      if (latestRes.rows.length > 0) latestAttempt = latestRes.rows[0];
    } else {
      user = memStore.users.find(u => u.id === userId) || memStore.users[0];
      const userAttempts = memStore.attempts
        .filter(a => a.user_id === userId)
        .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));

      completedCount = userAttempts.length;

      const sortedUsers = memStore.users.slice().sort((a, b) => (b.balance || 0) - (a.balance || 0));
      const foundIdx = sortedUsers.findIndex(u => u.id === userId);
      rank = foundIdx >= 0 ? foundIdx + 1 : 1;

      if (userAttempts.length > 0) {
        const top = userAttempts[0];
        const q = memStore.quizzes.find(qu => qu.id === top.quiz_id);
        latestAttempt = {
          ...top,
          quiz_title: q ? q.title : 'Quiz'
        };
      }
    }

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Check if daily bonus can be claimed
    const now = new Date();
    const lastClaimed = user.last_daily_bonus_claimed ? new Date(user.last_daily_bonus_claimed) : null;
    const isSameDayUtc = lastClaimed &&
      lastClaimed.getUTCFullYear() === now.getUTCFullYear() &&
      lastClaimed.getUTCMonth() === now.getUTCMonth() &&
      lastClaimed.getUTCDate() === now.getUTCDate();

    const canClaimDaily = !isSameDayUtc;

    // Calculate time until next UTC midnight
    const nextUtcMidnight = new Date();
    nextUtcMidnight.setUTCHours(24, 0, 0, 0);
    const msUntilMidnight = Math.max(0, nextUtcMidnight.getTime() - now.getTime());

    return res.json({
      success: true,
      stats: {
        user: {
          id: user.id,
          username: user.username,
          role: user.role || 'student',
          balance: parseFloat(user.balance || 0),
          streak_count: parseInt(user.streak_count || 3, 10)
        },
        rank,
        completed_quizzes_count: completedCount,
        latest_attempt: latestAttempt,
        daily_bonus: {
          can_claim: canClaimDaily,
          amount: 50,
          ms_until_reset: msUntilMidnight,
          next_reset_utc: nextUtcMidnight.toISOString()
        }
      }
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve dashboard stats' });
  }
});

// POST /api/users/claim-daily-bonus - Claim +$50 daily streak bonus
router.post('/claim-daily-bonus', async (req, res) => {
  const userId = req.headers['x-user-id'] ? parseInt(req.headers['x-user-id'], 10) : 1;
  const now = new Date();

  try {
    if (db.isPostgres()) {
      const pool = db.getPool();
      const uRes = await pool.query('SELECT id, balance, streak_count, last_daily_bonus_claimed FROM users WHERE id = $1', [userId]);
      if (uRes.rows.length === 0) return res.status(404).json({ success: false, error: 'User not found' });
      const user = uRes.rows[0];

      const lastClaimed = user.last_daily_bonus_claimed ? new Date(user.last_daily_bonus_claimed) : null;
      if (
        lastClaimed &&
        lastClaimed.getUTCFullYear() === now.getUTCFullYear() &&
        lastClaimed.getUTCMonth() === now.getUTCMonth() &&
        lastClaimed.getUTCDate() === now.getUTCDate()
      ) {
        return res.status(400).json({
          success: false,
          error: 'Daily bonus already claimed today! Come back after midnight UTC.'
        });
      }

      const newBalance = parseFloat(user.balance || 0) + 50;
      const newStreak = parseInt(user.streak_count || 1, 10) + 1;

      await pool.query(
        'UPDATE users SET balance = $1, streak_count = $2, last_daily_bonus_claimed = $3 WHERE id = $4',
        [newBalance, newStreak, now, userId]
      );

      return res.json({
        success: true,
        message: '🎉 +$50 Daily Streak Bonus Claimed!',
        bonus_amount: 50,
        new_balance: newBalance,
        new_streak: newStreak
      });
    }

    // In-memory fallback
    const user = memStore.users.find(u => u.id === userId) || memStore.users[0];
    const lastClaimed = user.last_daily_bonus_claimed ? new Date(user.last_daily_bonus_claimed) : null;
    if (
      lastClaimed &&
      lastClaimed.getUTCFullYear() === now.getUTCFullYear() &&
      lastClaimed.getUTCMonth() === now.getUTCMonth() &&
      lastClaimed.getUTCDate() === now.getUTCDate()
    ) {
      return res.status(400).json({
        success: false,
        error: 'Daily bonus already claimed today! Come back after midnight UTC.'
      });
    }

    user.balance = (user.balance || 0) + 50;
    user.streak_count = (user.streak_count || 1) + 1;
    user.last_daily_bonus_claimed = now;

    return res.json({
      success: true,
      message: '🎉 +$50 Daily Streak Bonus Claimed!',
      bonus_amount: 50,
      new_balance: user.balance,
      new_streak: user.streak_count
    });
  } catch (err) {
    console.error('Error claiming daily bonus:', err);
    res.status(500).json({ success: false, error: 'Failed to claim daily bonus' });
  }
});

// POST /api/users/signup - Register a new user with username and gmail
router.post('/signup', async (req, res) => {
  const { username, email, gmail, role } = req.body;
  const rawUsername = (username || '').trim();
  let rawEmail = (gmail || email || '').trim();

  if (!rawUsername) {
    return res.status(400).json({ success: false, error: 'Please enter your username.' });
  }

  if (rawUsername.length < 2) {
    return res.status(400).json({ success: false, error: 'Username must be at least 2 characters long.' });
  }

  if (!rawEmail) {
    return res.status(400).json({ success: false, error: 'Please enter your Gmail address.' });
  }

  // Normalize gmail format if missing @
  if (!rawEmail.includes('@')) {
    rawEmail = `${rawEmail.toLowerCase()}@gmail.com`;
  }

  const cleanUsername = rawUsername;
  const cleanEmail = rawEmail.toLowerCase();
  const assignedRole = role === 'teacher' ? 'teacher' : 'student';

  try {
    if (db.isPostgres()) {
      const pool = db.getPool();
      const existing = await pool.query(
        'SELECT id, username, email, role, balance, streak_count FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($2)',
        [cleanUsername, cleanEmail]
      );

      if (existing.rows.length > 0) {
        // Return existing user smoothly
        return res.json({
          success: true,
          user: existing.rows[0],
          isNew: false,
          message: `Welcome back, ${existing.rows[0].username}!`
        });
      }

      const insertRes = await pool.query(
        'INSERT INTO users (username, email, role, balance, streak_count) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, role, balance, streak_count',
        [cleanUsername, cleanEmail, assignedRole, 100, 1]
      );
      return res.status(201).json({
        success: true,
        user: insertRes.rows[0],
        isNew: true,
        message: 'Account created! Welcome to Michael\'s Quizzes.'
      });
    } else {
      let existingUser = memStore.users.find(
        u => u.username.toLowerCase() === cleanUsername.toLowerCase() ||
             (u.email && u.email.toLowerCase() === cleanEmail.toLowerCase())
      );

      if (existingUser) {
        return res.json({
          success: true,
          user: existingUser,
          isNew: false,
          message: `Welcome back, ${existingUser.username}!`
        });
      }

      const newUser = {
        id: memStore.counters.users++,
        username: cleanUsername,
        email: cleanEmail,
        role: assignedRole,
        balance: 100,
        streak_count: 1,
        last_daily_bonus_claimed: null,
        created_at: new Date()
      };
      memStore.users.push(newUser);

      return res.status(201).json({
        success: true,
        user: newUser,
        isNew: true,
        message: 'Account created! Welcome to Michael\'s Quizzes.'
      });
    }
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ success: false, error: 'Server error during sign up.' });
  }
});

// POST /api/users/login - Simple login or switch user by username and gmail
router.post('/login', async (req, res) => {
  const { username, email, gmail } = req.body;
  const rawUsername = (username || '').trim();
  let rawEmail = (gmail || email || '').trim();

  if (!rawUsername && !rawEmail) {
    return res.status(400).json({ success: false, error: 'Please enter your username or Gmail.' });
  }

  // Normalize gmail format if missing @
  if (rawEmail && !rawEmail.includes('@')) {
    rawEmail = `${rawEmail.toLowerCase()}@gmail.com`;
  }

  const cleanUsername = rawUsername || (rawEmail ? rawEmail.split('@')[0] : 'Player');
  const cleanEmail = rawEmail.toLowerCase() || `${cleanUsername.toLowerCase()}@gmail.com`;

  try {
    if (db.isPostgres()) {
      const pool = db.getPool();
      let userRes = await pool.query(
        'SELECT id, username, email, role, balance, streak_count FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($2)',
        [cleanUsername, cleanEmail]
      );
      if (userRes.rows.length === 0) {
        // Auto-create on login if doesn't exist yet
        userRes = await pool.query(
          'INSERT INTO users (username, email, role, balance, streak_count) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, role, balance, streak_count',
          [cleanUsername, cleanEmail, 'student', 100, 1]
        );
      }
      return res.json({ success: true, user: userRes.rows[0] });
    } else {
      let user = memStore.users.find(
        u => (rawUsername && u.username.toLowerCase() === rawUsername.toLowerCase()) ||
             (rawEmail && u.email && u.email.toLowerCase() === rawEmail.toLowerCase())
      );

      if (!user) {
        user = {
          id: memStore.counters.users++,
          username: cleanUsername,
          email: cleanEmail,
          role: 'student',
          balance: 100,
          streak_count: 1,
          last_daily_bonus_claimed: null,
          created_at: new Date()
        };
        memStore.users.push(user);
      }
      return res.json({ success: true, user });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Server error during login' });
  }
});

export default router;
