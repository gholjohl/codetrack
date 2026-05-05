import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import db from '../db/connection.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(1, 'Пароль обязателен'),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Минимум 6 символов'),
  full_name: z.string().min(2),
  position: z.string().optional(),
  role: z.enum(['admin', 'manager', 'employee']).default('employee'),
});

// POST /auth/login
router.post('/login', validate(loginSchema), (req, res) => {
  const { email, password } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Неверный email или пароль' } });
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Неверный email или пароль' } });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  const { password_hash, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

// GET /auth/me
router.get('/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, email, full_name, position, role, avatar_url, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Пользователь не найден' } });
  }
  res.json(user);
});

// POST /auth/logout — клиент удаляет токен; заглушка для единообразия API
router.post('/logout', authMiddleware, (req, res) => {
  res.json({ message: 'Выход выполнен успешно' });
});

// POST /auth/register — создание нового пользователя
router.post('/register', validate(registerSchema), (req, res) => {
  const { email, password, full_name, position, role } = req.body;

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: { code: 'EMAIL_TAKEN', message: 'Email уже зарегистрирован' } });
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

export default router;
