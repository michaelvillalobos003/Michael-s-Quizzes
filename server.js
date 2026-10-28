import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import quizzesRouter from './routes/quizzes.js';
import usersRouter from './routes/users.js';
import attemptsRouter from './routes/attempts.js';
import leaderboardsRouter from './routes/leaderboards.js';
import adminRouter from './routes/admin.js';
import { seedQuizzes } from './db/seed-quizzes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Parse port from CLI flags (--port 3000) or env var, fallback to 3000
let port = 3000;
const portArgIndex = process.argv.indexOf('--port');
if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
  port = parseInt(process.argv[portArgIndex + 1], 10);
} else if (process.env.PORT) {
  port = parseInt(process.env.PORT, 10);
}

app.use(cors());
app.use(express.json());

// 1. Health check endpoint (responds instantly)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 2. API Endpoints
app.use('/api/quizzes', quizzesRouter);
app.use('/api/users', usersRouter);
app.use('/api/attempts', attemptsRouter);
app.use('/api/leaderboards', leaderboardsRouter);
app.use('/api/admin', adminRouter);

// 3. Serve public static assets
app.use(express.static(path.join(__dirname, 'public')));

// 4. Page Routes
const sendPublic = (file) => (req, res) => res.sendFile(path.join(__dirname, 'public', file));
app.get('/', sendPublic('index.html'));
app.get('/index.html', sendPublic('index.html'));
app.get('/quizzes', sendPublic('index.html'));
app.get('/quiz-take', sendPublic('quiz-take.html'));
app.get('/quiz-take.html', sendPublic('quiz-take.html'));
app.get('/create-quiz', sendPublic('create-quiz.html'));
app.get('/create-quiz.html', sendPublic('create-quiz.html'));
app.get('/history', sendPublic('history.html'));
app.get('/history.html', sendPublic('history.html'));
app.get('/leaderboards', sendPublic('leaderboards.html'));
app.get('/leaderboards.html', sendPublic('leaderboards.html'));
app.get('/admin', sendPublic('admin.html'));
app.get('/admin.html', sendPublic('admin.html'));
app.get('/login', sendPublic('login.html'));
app.get('/login.html', sendPublic('login.html'));
app.get('/signup', sendPublic('login.html'));
app.get('/signup.html', sendPublic('login.html'));

// 5. Fallback for client navigation (Express 5 compatible)
app.use((req, res, next) => {
  if (req.method === 'GET' && req.accepts('html')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    res.status(404).json({ success: false, error: 'Route not found' });
  }
});

// 6. Start listening immediately on 0.0.0.0
app.listen(port, '0.0.0.0', () => {
  console.log(`[Michael's Quizzes] Server running on http://0.0.0.0:${port}`);
});

// 7. Auto-seed database/memory store in background
seedQuizzes().catch((err) => {
  console.warn('[Startup] Warning during quiz seeding:', err.message);
});

export default app;
