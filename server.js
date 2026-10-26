import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import quizzesRouter from './routes/quizzes.js';
import usersRouter from './routes/users.js';
import { seedQuizzes } from './db/seed-quizzes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 1. Serve public static assets (quiz-take.html, js, login.html, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// 2. API Endpoints
app.use('/api/quizzes', quizzesRouter);
app.use('/api/users', usersRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auto-seed database/memory store on server startup
seedQuizzes().catch((err) => {
  console.warn('[Startup] Warning during quiz seeding:', err.message);
});

// 3. Vite middleware integration for SPA and development
if (process.env.NODE_ENV !== 'production') {
  try {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0' },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } catch (err) {
    console.warn('[Vite] Vite middleware not loaded, serving public files:', err.message);
  }
} else {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Michael's Quizzes] Server running on http://0.0.0.0:${PORT}`);
});

export default app;
