import { Router } from 'express';
import { z } from 'zod';
import db from '../db/connection.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authMiddleware);

const taskSchema = z.object({
  project_id: z.number().int(),
  title: z.string().min(2),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'done']).default('todo'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  assignee_id: z.number().int().nullable().optional(),
  reporter_id: z.number().int().optional(),
  due_date: z.string().optional(),
});

const updateTaskSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  assignee_id: z.number().int().nullable().optional(),
  due_date: z.string().nullable().optional(),
});

// GET /tasks — с фильтрами
router.get('/', (req, res) => {
  const { project_id, assignee_id, status, priority, q, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const conditions = [];
  const params = [];

  if (project_id) { conditions.push('t.project_id = ?'); params.push(project_id); }
  if (assignee_id) { conditions.push('t.assignee_id = ?'); params.push(assignee_id); }
  if (status) { conditions.push('t.status = ?'); params.push(status); }
  if (priority) { conditions.push('t.priority = ?'); params.push(priority); }
  if (q) { conditions.push('t.title LIKE ?'); params.push(`%${q}%`); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const tasks = db.prepare(`
    SELECT t.*,
      a.full_name as assignee_name, a.avatar_url as assignee_avatar,
      r.full_name as reporter_name,
      p.name as project_name
    FROM tasks t
    LEFT JOIN users a ON t.assignee_id = a.id
    LEFT JOIN users r ON t.reporter_id = r.id
    LEFT JOIN projects p ON t.project_id = p.id
    ${where}
    ORDER BY t.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  const { total } = db.prepare(`SELECT COUNT(*) as total FROM tasks t ${where}`).get(...params);

  res.json({ data: tasks, total, page: parseInt(page), limit: parseInt(limit) });
});

// GET /tasks/:id
router.get('/:id', (req, res) => {
  const task = db.prepare(`
    SELECT t.*,
      a.full_name as assignee_name, a.avatar_url as assignee_avatar,
      r.full_name as reporter_name, r.avatar_url as reporter_avatar,
      p.name as project_name
    FROM tasks t
    LEFT JOIN users a ON t.assignee_id = a.id
    LEFT JOIN users r ON t.reporter_id = r.id
    LEFT JOIN projects p ON t.project_id = p.id
    WHERE t.id = ?
  `).get(req.params.id);

  if (!task) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Задача не найдена' } });
  }
  res.json(task);
});

// POST /tasks
router.post('/', validate(taskSchema), (req, res) => {
  const { project_id, title, description, status, priority, assignee_id, reporter_id, due_date } = req.body;

  // Employee может создавать задачи только в проектах, где он участвует
  if (req.user.role === 'employee') {
    const hasTask = db.prepare('SELECT id FROM tasks WHERE project_id = ? AND assignee_id = ?').get(project_id, req.user.id);
    const isAssignee = assignee_id === req.user.id;
    if (!hasTask && !isAssignee) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Нет доступа к этому проекту' } });
    }
  }

  const now = new Date().toISOString();
  const result = db.prepare(`
    INSERT INTO tasks (project_id, title, description, status, priority, assignee_id, reporter_id, due_date, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    project_id, title, description || null,
    status || 'todo', priority || 'medium',
    assignee_id || null, reporter_id || req.user.id,
    due_date || null, now
  );

  db.prepare(`
    INSERT INTO activity_log (user_id, entity_type, entity_id, action, meta)
    VALUES (?, 'task', ?, 'created', ?)
  `).run(req.user.id, result.lastInsertRowid, JSON.stringify({ title }));

  const task = db.prepare(`
    SELECT t.*, a.full_name as assignee_name, a.avatar_url as assignee_avatar,
      p.name as project_name
    FROM tasks t
    LEFT JOIN users a ON t.assignee_id = a.id
    LEFT JOIN projects p ON t.project_id = p.id
    WHERE t.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(task);
});

// PATCH /tasks/:id
router.patch('/:id', validate(updateTaskSchema), (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Задача не найдена' } });
  }

  const updates = { ...req.body, updated_at: new Date().toISOString() };
  const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  const values = Object.values(updates);

  db.prepare(`UPDATE tasks SET ${fields} WHERE id = ?`).run(...values, req.params.id);

  if (req.body.status && req.body.status !== task.status) {
    db.prepare(`
      INSERT INTO activity_log (user_id, entity_type, entity_id, action, meta)
      VALUES (?, 'task', ?, 'status_changed', ?)
    `).run(req.user.id, req.params.id, JSON.stringify({ from: task.status, to: req.body.status }));
  }

  const updated = db.prepare(`
    SELECT t.*, a.full_name as assignee_name, a.avatar_url as assignee_avatar, p.name as project_name
    FROM tasks t
    LEFT JOIN users a ON t.assignee_id = a.id
    LEFT JOIN projects p ON t.project_id = p.id
    WHERE t.id = ?
  `).get(req.params.id);

  res.json(updated);
});

// DELETE /tasks/:id
router.delete('/:id', (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Задача не найдена' } });
  }

  if (req.user.role === 'employee' && task.assignee_id !== req.user.id && task.reporter_id !== req.user.id) {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Нет прав на удаление' } });
  }

  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

export default router;
