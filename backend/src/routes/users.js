import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import db from '../db/connection.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authMiddleware);

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(2),
  position: z.string().optional(),
  role: z.enum(['admin', 'manager', 'employee']).default('employee'),
});

const updateUserSchema = z.object({
  full_name: z.string().min(2).optional(),
  position: z.string().optional(),
  role: z.enum(['admin', 'manager', 'employee']).optional(),
  avatar_url: z.string().url().optional(),
  password: z.string().min(6).optional(),
});

// GET /users — список пользователей
router.get('/', (req, res) => {
  const users = db.prepare(`
    SELECT id, email, full_name, position, role, avatar_url, created_at FROM users ORDER BY full_name
  `).all();
  res.json(users);
});

// GET /users/:id
router.get('/:id', (req, res) => {
  const user = db.prepare(`
    SELECT id, email, full_name, position, role, avatar_url, created_at FROM users WHERE id = ?
  `).get(req.params.id);
  if (!user) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Пользователь не найден' } });
  }
  res.json(user);
});

// POST /users — только admin
router.post('/', requireRole('admin'), validate(createUserSchema), (req, res) => {
  const { email, password, full_name, position, role } = req.body;

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: { code: 'EMAIL_TAKEN', message: 'Email уже занят' } });
  }

  const password_hash = bcrypt.hashSync(password, 10);
  const avatar_url = `https://i.pravatar.cc/150?u=${email}`;

  const result = db.prepare(`
    INSERT INTO users (email, password_hash, full_name, position, role, avatar_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(email, password_hash, full_name, position || null, role, avatar_url);

  const user = db.prepare('SELECT id, email, full_name, position, role, avatar_url, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(user);
});

// PATCH /users/:id — admin или сам пользователь
router.patch('/:id', validate(updateUserSchema), (req, res) => {
  const targetId = parseInt(req.params.id);
  const isAdmin = req.user.role === 'admin';
  const isSelf = req.user.id === targetId;

  if (!isAdmin && !isSelf) {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Нет доступа' } });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(targetId);
  if (!user) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Пользователь не найден' } });
  }

  const updates = { ...req.body };
  if (updates.password) {
    updates.password_hash = bcrypt.hashSync(updates.password, 10);
    delete updates.password;
  }
  // Обычный пользователь не может менять свою роль
  if (!isAdmin) {
    delete updates.role;
  }

  const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  const values = Object.values(updates);
  if (fields.length > 0) {
    db.prepare(`UPDATE users SET ${fields} WHERE id = ?`).run(...values, targetId);
  }

  const updated = db.prepare('SELECT id, email, full_name, position, role, avatar_url, created_at FROM users WHERE id = ?').get(targetId);
  res.json(updated);
});

// DELETE /users/:id — только admin
router.delete('/:id', requireRole('admin'), (req, res) => {
  const result = db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Пользователь не найден' } });
  }
  res.status(204).send();
});

export default router;
