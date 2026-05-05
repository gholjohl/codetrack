import { Router } from 'express';
import { z } from 'zod';
import db from '../db/connection.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authMiddleware);

const projectSchema = z.object({
  name: z.string().min(2, 'Название минимум 2 символа'),
  description: z.string().optional(),
  status: z.enum(['active', 'paused', 'completed', 'archived']).default('active'),
  owner_id: z.number().int().optional(),
  deadline: z.string().optional(),
});

const updateProjectSchema = projectSchema.partial();

// GET /projects — с пагинацией и фильтром по статусу
router.get('/', (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let query = `
    SELECT p.*, u.full_name as owner_name, u.avatar_url as owner_avatar,
    (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count
    FROM projects p
    LEFT JOIN users u ON p.owner_id = u.id
  `;
  const params = [];

  if (status) {
    query += ' WHERE p.status = ?';
    params.push(status);
  }

  query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);

  const projects = db.prepare(query).all(...params);

  const countQuery = status
    ? 'SELECT COUNT(*) as total FROM projects WHERE status = ?'
    : 'SELECT COUNT(*) as total FROM projects';
  const { total } = db.prepare(countQuery).get(...(status ? [status] : []));

  res.json({ data: projects, total, page: parseInt(page), limit: parseInt(limit) });
});

// GET /projects/:id — детали с задачами
router.get('/:id', (req, res) => {
  const project = db.prepare(`
    SELECT p.*, u.full_name as owner_name, u.avatar_url as owner_avatar
    FROM projects p
    LEFT JOIN users u ON p.owner_id = u.id
    WHERE p.id = ?
  `).get(req.params.id);

  if (!project) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Проект не найден' } });
  }

  const tasks = db.prepare(`
    SELECT t.*,
      a.full_name as assignee_name, a.avatar_url as assignee_avatar,
      r.full_name as reporter_name
    FROM tasks t
    LEFT JOIN users a ON t.assignee_id = a.id
    LEFT JOIN users r ON t.reporter_id = r.id
    WHERE t.project_id = ?
    ORDER BY t.created_at DESC
  `).all(req.params.id);

  res.json({ ...project, tasks });
});

// POST /projects — manager или admin
router.post('/', requireRole('admin', 'manager'), validate(projectSchema), (req, res) => {
  const { name, description, status, owner_id, deadline } = req.body;
  const ownerId = owner_id || req.user.id;

  const result = db.prepare(`
    INSERT INTO projects (name, description, status, owner_id, deadline)
    VALUES (?, ?, ?, ?, ?)
  `).run(name, description || null, status || 'active', ownerId, deadline || null);

  db.prepare(`
    INSERT INTO activity_log (user_id, entity_type, entity_id, action, meta)
    VALUES (?, 'project', ?, 'created', ?)
  `).run(req.user.id, result.lastInsertRowid, JSON.stringify({ name }));

  const project = db.prepare(`
    SELECT p.*, u.full_name as owner_name FROM projects p
    LEFT JOIN users u ON p.owner_id = u.id WHERE p.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(project);
});

// PATCH /projects/:id
router.patch('/:id', requireRole('admin', 'manager'), validate(updateProjectSchema), (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Проект не найден' } });
  }

  const fields = Object.keys(req.body).map(k => `${k} = ?`).join(', ');
  const values = Object.values(req.body);
  if (fields.length > 0) {
    db.prepare(`UPDATE projects SET ${fields} WHERE id = ?`).run(...values, req.params.id);
  }

  const updated = db.prepare(`
    SELECT p.*, u.full_name as owner_name FROM projects p
    LEFT JOIN users u ON p.owner_id = u.id WHERE p.id = ?
  `).get(req.params.id);

  res.json(updated);
});

// DELETE /projects/:id — только admin
router.delete('/:id', requireRole('admin'), (req, res) => {
  const result = db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Проект не найден' } });
  }
  res.status(204).send();
});

export default router;
