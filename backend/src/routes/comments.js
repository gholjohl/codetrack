import { Router } from 'express';
import { z } from 'zod';
import db from '../db/connection.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router({ mergeParams: true });
router.use(authMiddleware);

const commentSchema = z.object({
  body: z.string().min(1, 'Комментарий не может быть пустым'),
});

// GET /tasks/:id/comments
router.get('/', (req, res) => {
  const taskId = req.params.id;
  const task = db.prepare('SELECT id FROM tasks WHERE id = ?').get(taskId);
  if (!task) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Задача не найдена' } });
  }

  const comments = db.prepare(`
    SELECT c.*, u.full_name, u.avatar_url, u.role
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.task_id = ?
    ORDER BY c.created_at ASC
  `).all(taskId);

  res.json(comments);
});

// POST /tasks/:id/comments
router.post('/', validate(commentSchema), (req, res) => {
  const taskId = req.params.id;
  const task = db.prepare('SELECT id FROM tasks WHERE id = ?').get(taskId);
  if (!task) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Задача не найдена' } });
  }

  const result = db.prepare(`
    INSERT INTO comments (task_id, user_id, body) VALUES (?, ?, ?)
  `).run(taskId, req.user.id, req.body.body);

  const comment = db.prepare(`
    SELECT c.*, u.full_name, u.avatar_url, u.role
    FROM comments c JOIN users u ON c.user_id = u.id
    WHERE c.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(comment);
});

export default router;
