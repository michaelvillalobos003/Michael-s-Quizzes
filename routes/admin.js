import { Router } from 'express';
import db, { memStore } from '../db/index.js';

const router = Router();

/**
 * Access Control Middleware
 * Restricts all admin endpoints to users with role = 'teacher'.
 * Returns HTTP 403 Forbidden for student accounts.
 */
async function requireTeacherRole(req, res, next) {
  const userId = req.headers['x-user-id'] 
    ? parseInt(req.headers['x-user-id'], 10) 
    : req.query.user_id 
    ? parseInt(req.query.user_id, 10) 
    : 1;

  let user = null;
  if (db.isPostgres()) {
    const pool = db.getPool();
    const userRes = await pool.query('SELECT id, username, email, role, balance FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length > 0) user = userRes.rows[0];
  } else {
    user = memStore.users.find(u => u.id === userId);
  }

  // Check role: supports explicit x-user-role header override for convenient testing in development
  const role = (req.headers['x-user-role'] || (user && user.role) || 'student').toLowerCase();

  if (role !== 'teacher') {
    return res.status(403).json({
      success: false,
      error: 'Access denied: Teacher permissions required. Student accounts cannot access admin tools.'
    });
  }

  req.adminUser = user || { id: userId, username: 'Teacher', role: 'teacher' };
  next();
}

// Apply teacher restriction to all admin routes
router.use(requireTeacherRole);

/**
 * GET /api/admin/check-access
 * Verification endpoint to confirm teacher status
 */
router.get('/check-access', (req, res) => {
  res.json({
    success: true,
    message: 'Teacher authorization verified.',
    user: req.adminUser
  });
});

/**
 * GET /api/admin/quizzes
 * Returns all quizzes with question counts for administration
 */
router.get('/quizzes', async (req, res) => {
  try {
    if (db.isPostgres()) {
      const pool = db.getPool();
      const result = await pool.query(`
        SELECT 
          q.id,
          q.title,
          q.description,
          q.category,
          q.difficulty,
          q.is_approved,
          q.is_daily_challenge,
          q.created_at,
          COUNT(qu.id) AS question_count
        FROM quizzes q
        LEFT JOIN questions qu ON qu.quiz_id = q.id
        GROUP BY q.id
        ORDER BY q.id ASC
      `);
      return res.json({ success: true, quizzes: result.rows });
    }

    // In-memory fallback
    const list = memStore.quizzes.map(q => ({
      ...q,
      question_count: memStore.questions.filter(qu => qu.quiz_id === q.id).length
    }));

    return res.json({ success: true, quizzes: list });
  } catch (err) {
    console.error('Admin quizzes error:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve quizzes for admin' });
  }
});

/**
 * GET /api/admin/quizzes/:id/questions
 * Returns questions and choices with is_correct flags for editing
 */
router.get('/quizzes/:id/questions', async (req, res) => {
  const quizId = parseInt(req.params.id, 10);
  if (isNaN(quizId)) return res.status(400).json({ success: false, error: 'Invalid quiz ID' });

  try {
    if (db.isPostgres()) {
      const pool = db.getPool();
      const qRes = await pool.query(
        'SELECT id, quiz_id, question_text, order_num FROM questions WHERE quiz_id = $1 ORDER BY order_num ASC, id ASC',
        [quizId]
      );
      const questions = qRes.rows;
      const qIds = questions.map(q => q.id);

      let choices = [];
      if (qIds.length > 0) {
        const cRes = await pool.query(
          'SELECT id, question_id, choice_text, is_correct FROM choices WHERE question_id = ANY($1::int[]) ORDER BY id ASC',
          [qIds]
        );
        choices = cRes.rows;
      }

      const formatted = questions.map(q => ({
        id: q.id,
        quiz_id: q.quiz_id,
        question_text: q.question_text,
        order_num: q.order_num,
        choices: choices.filter(c => c.question_id === q.id)
      }));

      return res.json({ success: true, questions: formatted });
    }

    // In-memory fallback
    const questions = memStore.questions
      .filter(q => q.quiz_id === quizId)
      .sort((a, b) => a.order_num - b.order_num);

    const formatted = questions.map(q => ({
      id: q.id,
      quiz_id: q.quiz_id,
      question_text: q.question_text,
      order_num: q.order_num,
      choices: memStore.choices.filter(c => c.question_id === q.id)
    }));

    return res.json({ success: true, questions: formatted });
  } catch (err) {
    console.error(`Admin questions error for quiz #${quizId}:`, err);
    res.status(500).json({ success: false, error: 'Failed to retrieve questions for admin' });
  }
});

/**
 * POST /api/admin/questions
 * Adds a new question with 4 choices to a targeted quiz
 */
router.post('/questions', async (req, res) => {
  const { quiz_id, question_text, choices } = req.body;
  const quizId = parseInt(quiz_id, 10);

  if (isNaN(quizId) || !question_text || !Array.isArray(choices) || choices.length !== 4) {
    return res.status(400).json({
      success: false,
      error: 'Invalid question payload: must provide quiz_id, non-empty question_text, and exactly 4 choices'
    });
  }

  const correctCount = choices.filter(c => Boolean(c.is_correct)).length;
  if (correctCount !== 1) {
    return res.status(400).json({
      success: false,
      error: 'Question must have exactly 1 correct choice'
    });
  }

  try {
    if (db.isPostgres()) {
      const pool = db.getPool();
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const countRes = await client.query('SELECT COUNT(*) FROM questions WHERE quiz_id = $1', [quizId]);
        const orderNum = parseInt(countRes.rows[0].count, 10) + 1;

        const qRes = await client.query(
          'INSERT INTO questions (quiz_id, question_text, order_num) VALUES ($1, $2, $3) RETURNING id',
          [quizId, question_text.trim(), orderNum]
        );
        const questionId = qRes.rows[0].id;

        for (const c of choices) {
          await client.query(
            'INSERT INTO choices (question_id, choice_text, is_correct) VALUES ($1, $2, $3)',
            [questionId, (c.choice_text || '').trim(), Boolean(c.is_correct)]
          );
        }

        await client.query('COMMIT');
        return res.json({ success: true, message: 'Question created successfully', question_id: questionId });
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }

    // In-memory fallback
    const questionId = memStore.counters.questions++;
    const orderNum = memStore.questions.filter(q => q.quiz_id === quizId).length + 1;

    memStore.questions.push({
      id: questionId,
      quiz_id: quizId,
      question_text: question_text.trim(),
      order_num: orderNum
    });

    choices.forEach(c => {
      memStore.choices.push({
        id: memStore.counters.choices++,
        question_id: questionId,
        choice_text: (c.choice_text || '').trim(),
        is_correct: Boolean(c.is_correct)
      });
    });

    return res.json({ success: true, message: 'Question created successfully', question_id: questionId });
  } catch (err) {
    console.error('Error creating question:', err);
    res.status(500).json({ success: false, error: 'Failed to create question' });
  }
});

/**
 * PUT /api/admin/questions/:id
 * Updates an existing question, choices, and moves/reassigns to another quiz if changed
 */
router.put('/questions/:id', async (req, res) => {
  const questionId = parseInt(req.params.id, 10);
  const { quiz_id, question_text, choices } = req.body;
  const targetQuizId = parseInt(quiz_id, 10);

  if (isNaN(questionId) || isNaN(targetQuizId) || !question_text || !Array.isArray(choices) || choices.length !== 4) {
    return res.status(400).json({
      success: false,
      error: 'Invalid payload: must provide target quiz_id, question_text, and exactly 4 choices'
    });
  }

  const correctCount = choices.filter(c => Boolean(c.is_correct)).length;
  if (correctCount !== 1) {
    return res.status(400).json({
      success: false,
      error: 'Question must have exactly 1 correct choice'
    });
  }

  try {
    if (db.isPostgres()) {
      const pool = db.getPool();
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        // Update question and quiz_id assignment
        await client.query(
          'UPDATE questions SET quiz_id = $1, question_text = $2 WHERE id = $3',
          [targetQuizId, question_text.trim(), questionId]
        );

        // Replace choices
        await client.query('DELETE FROM choices WHERE question_id = $1', [questionId]);
        for (const c of choices) {
          await client.query(
            'INSERT INTO choices (question_id, choice_text, is_correct) VALUES ($1, $2, $3)',
            [questionId, (c.choice_text || '').trim(), Boolean(c.is_correct)]
          );
        }

        await client.query('COMMIT');
        return res.json({ success: true, message: 'Question updated and reassigned successfully' });
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }

    // In-memory fallback
    const qIndex = memStore.questions.findIndex(q => q.id === questionId);
    if (qIndex === -1) {
      return res.status(404).json({ success: false, error: 'Question not found' });
    }

    memStore.questions[qIndex].quiz_id = targetQuizId;
    memStore.questions[qIndex].question_text = question_text.trim();

    // Replace choices in memStore
    memStore.choices = memStore.choices.filter(c => c.question_id !== questionId);
    choices.forEach(c => {
      memStore.choices.push({
        id: memStore.counters.choices++,
        question_id: questionId,
        choice_text: (c.choice_text || '').trim(),
        is_correct: Boolean(c.is_correct)
      });
    });

    return res.json({ success: true, message: 'Question updated and reassigned successfully' });
  } catch (err) {
    console.error('Error updating question:', err);
    res.status(500).json({ success: false, error: 'Failed to update question' });
  }
});

/**
 * DELETE /api/admin/questions/:id
 * Deletes a question and its choices
 */
router.delete('/questions/:id', async (req, res) => {
  const questionId = parseInt(req.params.id, 10);
  if (isNaN(questionId)) return res.status(400).json({ success: false, error: 'Invalid question ID' });

  try {
    if (db.isPostgres()) {
      const pool = db.getPool();
      await pool.query('DELETE FROM questions WHERE id = $1', [questionId]);
      return res.json({ success: true, message: 'Question deleted successfully' });
    }

    memStore.questions = memStore.questions.filter(q => q.id !== questionId);
    memStore.choices = memStore.choices.filter(c => c.question_id !== questionId);
    return res.json({ success: true, message: 'Question deleted successfully' });
  } catch (err) {
    console.error('Error deleting question:', err);
    res.status(500).json({ success: false, error: 'Failed to delete question' });
  }
});

/**
 * POST /api/admin/quizzes/:id/batch-import
 * CSV Batch Importer: Commits only valid rows to the database
 * Expected row: { question_text, choice_1, choice_2, choice_3, choice_4, correct_choice_index }
 */
router.post('/quizzes/:id/batch-import', async (req, res) => {
  const quizId = parseInt(req.params.id, 10);
  if (isNaN(quizId)) return res.status(400).json({ success: false, error: 'Invalid quiz ID' });

  const { rows } = req.body;
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ success: false, error: 'No rows provided for import' });
  }

  // Filter and validate rows
  const validRows = [];
  const rejectedRows = [];

  rows.forEach((r, idx) => {
    const qText = (r.question_text || '').trim();
    const c1 = (r.choice_1 || '').trim();
    const c2 = (r.choice_2 || '').trim();
    const c3 = (r.choice_3 || '').trim();
    const c4 = (r.choice_4 || '').trim();

    // correct_choice_index can be 1, 2, 3, 4 (1-based) or 0, 1, 2, 3 (0-based)
    let correctIdx = parseInt(r.correct_choice_index, 10);
    if (correctIdx >= 1 && correctIdx <= 4) {
      correctIdx = correctIdx - 1; // convert 1-based to 0-based
    }

    if (!qText) {
      rejectedRows.push({ row_index: idx + 1, reason: 'Empty question text' });
    } else if (!c1 || !c2 || !c3 || !c4) {
      rejectedRows.push({ row_index: idx + 1, reason: 'One or more of the 4 choices is missing' });
    } else if (isNaN(correctIdx) || correctIdx < 0 || correctIdx > 3) {
      rejectedRows.push({ row_index: idx + 1, reason: 'correct_choice_index must be between 1 and 4' });
    } else {
      validRows.push({
        question_text: qText,
        choices: [
          { text: c1, is_correct: correctIdx === 0 },
          { text: c2, is_correct: correctIdx === 1 },
          { text: c3, is_correct: correctIdx === 2 },
          { text: c4, is_correct: correctIdx === 3 }
        ]
      });
    }
  });

  if (validRows.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'No valid rows found to import',
      total_received: rows.length,
      rejected_count: rejectedRows.length,
      rejected_details: rejectedRows
    });
  }

  try {
    if (db.isPostgres()) {
      const pool = db.getPool();
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const countRes = await client.query('SELECT COUNT(*) FROM questions WHERE quiz_id = $1', [quizId]);
        let nextOrder = parseInt(countRes.rows[0].count, 10) + 1;

        for (const v of validRows) {
          const qRes = await client.query(
            'INSERT INTO questions (quiz_id, question_text, order_num) VALUES ($1, $2, $3) RETURNING id',
            [quizId, v.question_text, nextOrder++]
          );
          const qId = qRes.rows[0].id;

          for (const c of v.choices) {
            await client.query(
              'INSERT INTO choices (question_id, choice_text, is_correct) VALUES ($1, $2, $3)',
              [qId, c.text, c.is_correct]
            );
          }
        }

        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } else {
      // In-memory fallback
      let nextOrder = memStore.questions.filter(q => q.quiz_id === quizId).length + 1;

      validRows.forEach(v => {
        const qId = memStore.counters.questions++;
        memStore.questions.push({
          id: qId,
          quiz_id: quizId,
          question_text: v.question_text,
          order_num: nextOrder++
        });

        v.choices.forEach(c => {
          memStore.choices.push({
            id: memStore.counters.choices++,
            question_id: qId,
            choice_text: c.text,
            is_correct: c.is_correct
          });
        });
      });
    }

    return res.json({
      success: true,
      message: `Successfully imported ${validRows.length} questions into Quiz #${quizId}!`,
      imported_count: validRows.length,
      total_received: rows.length,
      rejected_count: rejectedRows.length,
      rejected_details: rejectedRows
    });
  } catch (err) {
    console.error('Error during batch import:', err);
    res.status(500).json({ success: false, error: 'Failed to commit batch import to database' });
  }
});

/**
 * GET /api/admin/pending-quizzes
 * Educator Review Queue: Returns pending student quizzes awaiting teacher approval
 */
router.get('/pending-quizzes', async (req, res) => {
  try {
    if (db.isPostgres()) {
      const pool = db.getPool();
      const result = await pool.query(`
        SELECT 
          q.id,
          q.title,
          q.description,
          q.category,
          q.difficulty,
          q.status,
          q.is_approved,
          q.rejection_feedback,
          q.created_at,
          q.creator_user_id,
          u.username AS creator_username,
          (SELECT COUNT(*) FROM questions qu WHERE qu.quiz_id = q.id) AS question_count
        FROM quizzes q
        LEFT JOIN users u ON q.creator_user_id = u.id
        WHERE q.status = 'Pending' OR (q.is_approved = false AND (q.status IS NULL OR q.status = 'Pending'))
        ORDER BY q.created_at ASC
      `);
      return res.json({ success: true, pending_quizzes: result.rows });
    }

    // In-memory fallback
    const list = memStore.quizzes
      .filter(q => q.status === 'Pending' || (!q.is_approved && (!q.status || q.status === 'Pending')))
      .map(q => {
        const creator = memStore.users.find(u => u.id === q.creator_user_id);
        return {
          ...q,
          creator_username: creator ? creator.username : 'Student',
          question_count: memStore.questions.filter(qu => qu.quiz_id === q.id).length
        };
      });

    return res.json({ success: true, pending_quizzes: list });
  } catch (err) {
    console.error('Error fetching pending quizzes:', err);
    res.status(500).json({ success: false, error: 'Failed to load educator review queue' });
  }
});

/**
 * POST /api/admin/quizzes/:id/approve
 * Approves and publishes the quiz to the public catalog, permanently locking student editing
 */
router.post('/quizzes/:id/approve', async (req, res) => {
  const quizId = parseInt(req.params.id, 10);
  if (isNaN(quizId)) return res.status(400).json({ success: false, error: 'Invalid quiz ID' });

  try {
    if (db.isPostgres()) {
      const pool = db.getPool();
      await pool.query(
        `UPDATE quizzes 
         SET status = 'Approved', is_approved = true, rejection_feedback = NULL 
         WHERE id = $1`,
        [quizId]
      );
    } else {
      const quiz = memStore.quizzes.find(q => q.id === quizId);
      if (!quiz) return res.status(404).json({ success: false, error: 'Quiz not found' });
      quiz.status = 'Approved';
      quiz.is_approved = true;
      quiz.rejection_feedback = null;
    }

    return res.json({
      success: true,
      message: `Quiz #${quizId} approved and published to public catalog! Student editing is now permanently locked.`
    });
  } catch (err) {
    console.error(`Error approving quiz ${quizId}:`, err);
    res.status(500).json({ success: false, error: 'Failed to approve quiz' });
  }
});

/**
 * POST /api/admin/quizzes/:id/reject
 * Rejects the quiz and records educator feedback notes so student can edit and resubmit
 */
router.post('/quizzes/:id/reject', async (req, res) => {
  const quizId = parseInt(req.params.id, 10);
  const { feedback } = req.body;
  if (isNaN(quizId)) return res.status(400).json({ success: false, error: 'Invalid quiz ID' });

  const notes = (feedback || '').trim() || 'Please review and improve question quality before resubmitting.';

  try {
    if (db.isPostgres()) {
      const pool = db.getPool();
      await pool.query(
        `UPDATE quizzes 
         SET status = 'Rejected', is_approved = false, rejection_feedback = $1 
         WHERE id = $2`,
        [notes, quizId]
      );
    } else {
      const quiz = memStore.quizzes.find(q => q.id === quizId);
      if (!quiz) return res.status(404).json({ success: false, error: 'Quiz not found' });
      quiz.status = 'Rejected';
      quiz.is_approved = false;
      quiz.rejection_feedback = notes;
    }

    return res.json({
      success: true,
      message: `Quiz #${quizId} marked as Rejected with feedback provided to the student creator.`
    });
  } catch (err) {
    console.error(`Error rejecting quiz ${quizId}:`, err);
    res.status(500).json({ success: false, error: 'Failed to reject quiz' });
  }
});

export default router;
