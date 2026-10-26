import { Router } from 'express';
import db, { memStore } from '../db/index.js';

const router = Router();

// GET /api/users/me - Get current user profile and balance
router.get('/me', async (req, res) => {
  const userId = req.headers['x-user-id'] ? parseInt(req.headers['x-user-id'], 10) : 1;

  try {
    if (db.isPostgres()) {
      const pool = db.getPool();
      const userRes = await pool.query('SELECT id, username, email, balance FROM users WHERE id = $1', [userId]);
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
            balance: user.balance
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

// POST /api/users/login - Simple login or switch user
router.post('/login', async (req, res) => {
  const { username, email } = req.body;
  const cleanUsername = (username || 'Michael').trim();
  const cleanEmail = (email || `${cleanUsername.toLowerCase()}@example.com`).trim();

  try {
    if (db.isPostgres()) {
      const pool = db.getPool();
      let userRes = await pool.query('SELECT * FROM users WHERE username = $1 OR email = $2', [cleanUsername, cleanEmail]);
      if (userRes.rows.length === 0) {
        userRes = await pool.query(
          'INSERT INTO users (username, email, balance) VALUES ($1, $2, $3) RETURNING id, username, email, balance',
          [cleanUsername, cleanEmail, 100]
        );
      }
      return res.json({ success: true, user: userRes.rows[0] });
    } else {
      let user = memStore.users.find(u => u.username.toLowerCase() === cleanUsername.toLowerCase());
      if (!user) {
        user = {
          id: memStore.counters.users++,
          username: cleanUsername,
          email: cleanEmail,
          balance: 100,
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
