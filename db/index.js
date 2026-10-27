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
      role: 'teacher',
      balance: 850,
      created_at: new Date(Date.now() - 86400000 * 5)
    },
    {
      id: 2,
      username: 'PixelGamer99',
      email: 'pixel@example.com',
      role: 'student',
      balance: 520,
      created_at: new Date(Date.now() - 86400000 * 4)
    },
    {
      id: 3,
      username: 'TriviaQueen',
      email: 'queen@example.com',
      role: 'student',
      balance: 480,
      created_at: new Date(Date.now() - 86400000 * 3)
    },
    {
      id: 4,
      username: 'NeoCoder',
      email: 'neo@example.com',
      role: 'student',
      balance: 350,
      created_at: new Date(Date.now() - 86400000 * 2)
    },
    {
      id: 5,
      username: 'SpeedRunnerX',
      email: 'speed@example.com',
      role: 'student',
      balance: 290,
      created_at: new Date(Date.now() - 86400000 * 2)
    },
    {
      id: 6,
      username: 'BlockMaster',
      email: 'block@example.com',
      role: 'student',
      balance: 210,
      created_at: new Date(Date.now() - 86400000 * 1)
    }
  ],
  quizzes: [],
  questions: [],
  choices: [],
  submissions: [],
  attempts: [],
  attempt_answers: [],
  counters: {
    users: 2,
    quizzes: 1,
    questions: 1,
    choices: 1,
    submissions: 1,
    attempts: 1,
    attempt_answers: 1
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

      CREATE TABLE IF NOT EXISTS attempts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
        score INTEGER NOT NULL,
        total_questions INTEGER NOT NULL,
        percentage NUMERIC NOT NULL,
        cash_earned NUMERIC DEFAULT 0,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS attempt_answers (
        id SERIAL PRIMARY KEY,
        attempt_id INTEGER REFERENCES attempts(id) ON DELETE CASCADE,
        question_id INTEGER,
        question_text_snapshot TEXT NOT NULL,
        selected_choice_text_snapshot TEXT,
        correct_choice_text_snapshot TEXT NOT NULL,
        is_correct BOOLEAN NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Ensure creator_user_id and status columns exist on quizzes
      ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS creator_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
      ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Approved';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'student';

      -- Ensure default demo users exist
      INSERT INTO users (id, username, email, role, balance)
      VALUES (1, 'Michael', 'michaelvilla0031@gmail.com', 'teacher', 850)
      ON CONFLICT (id) DO UPDATE SET role = 'teacher';

      INSERT INTO users (id, username, email, role, balance)
      VALUES 
        (2, 'PixelGamer99', 'pixel@example.com', 'student', 520),
        (3, 'TriviaQueen', 'queen@example.com', 'student', 480),
        (4, 'NeoCoder', 'neo@example.com', 'student', 350),
        (5, 'SpeedRunnerX', 'speed@example.com', 'student', 290),
        (6, 'BlockMaster', 'block@example.com', 'student', 210)
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
