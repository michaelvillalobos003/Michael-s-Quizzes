import pg from 'pg';

const { Pool } = pg;

const hasPostgres = Boolean(process.env.DATABASE_URL);

let pool = null;
let isPostgresConnected = false;

// In-Memory Database Fallback Store
export const memStore = {
  users: [
    {
      id: 1,
      username: 'Michael',
      email: 'michaelvilla0031@gmail.com',
      balance: 100,
      created_at: new Date()
    }
  ],
  quizzes: [],
  questions: [],
  choices: [],
  submissions: [],
  counters: {
    users: 2,
    quizzes: 1,
    questions: 1,
    choices: 1,
    submissions: 1
  }
};

if (hasPostgres) {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL.includes('localhost') 
        ? { rejectUnauthorized: false } 
        : false
    });

    pool.on('error', (err) => {
      console.warn('[PostgreSQL Pool Error - using memory fallback]', err.message);
      isPostgresConnected = false;
    });

    // Test connection
    pool.query('SELECT NOW()')
      .then(() => {
        isPostgresConnected = true;
        console.log('[PostgreSQL] Connected successfully to database');
        initPostgresTables();
      })
      .catch((err) => {
        console.warn('[PostgreSQL] Connection failed, using in-memory store:', err.message);
        isPostgresConnected = false;
      });
  } catch (err) {
    console.warn('[PostgreSQL] Initialization error, falling back to in-memory store:', err);
    isPostgresConnected = false;
  }
} else {
  console.log('[Database] No DATABASE_URL provided. Operating with in-memory database store.');
}

async function initPostgresTables() {
  if (!pool || !isPostgresConnected) return;
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        balance NUMERIC DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS quizzes (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        difficulty VARCHAR(50) DEFAULT 'medium',
        is_approved BOOLEAN DEFAULT TRUE,
        is_daily_challenge BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
        question_text TEXT NOT NULL,
        order_num INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS choices (
        id SERIAL PRIMARY KEY,
        question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
        choice_text TEXT NOT NULL,
        is_correct BOOLEAN DEFAULT FALSE
      );

      CREATE TABLE IF NOT EXISTS quiz_submissions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
        score INTEGER NOT NULL,
        total_questions INTEGER NOT NULL,
        percentage NUMERIC NOT NULL,
        cash_earned NUMERIC NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Ensure default demo user exists
      INSERT INTO users (id, username, email, balance)
      VALUES (1, 'Michael', 'michaelvilla0031@gmail.com', 100)
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('[PostgreSQL] Database tables initialized successfully.');
  } catch (err) {
    console.error('[PostgreSQL] Error creating tables:', err);
  } finally {
    client.release();
  }
}

export const db = {
  isPostgres() {
    return Boolean(pool && isPostgresConnected);
  },

  async query(text, params = []) {
    if (pool && isPostgresConnected) {
      try {
        return await pool.query(text, params);
      } catch (err) {
        console.warn('[PostgreSQL Query Error - Falling back to memStore]', err.message);
      }
    }
    // Return empty fallback structure for raw queries if not using helper methods
    return { rows: [], rowCount: 0 };
  },

  getPool() {
    return pool;
  }
};

export default db;
