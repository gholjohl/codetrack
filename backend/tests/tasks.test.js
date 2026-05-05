import request from 'supertest';
import { beforeAll, afterAll, describe, it, expect } from '@jest/globals';
import app from '../src/server.js';
import db from '../src/db/connection.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

let adminToken;
let employeeToken;
let testProjectId;
let testTaskId;

beforeAll(() => {
  // Очищаем остатки от предыдущих запусков тестов
  const hash = bcrypt.hashSync('password123', 10);
  const oldIds = db.prepare("SELECT id FROM users WHERE email IN (?,?)").all('tasks.admin@test.kz', 'tasks.employee@test.kz').map(r => r.id);
  if (oldIds.length) {
    db.prepare(`DELETE FROM activity_log WHERE user_id IN (${oldIds.map(() => '?').join(',')})`).run(...oldIds);
    db.prepare(`DELETE FROM projects WHERE owner_id IN (${oldIds.map(() => '?').join(',')})`).run(...oldIds);
    db.prepare('DELETE FROM users WHERE email IN (?,?)').run('tasks.admin@test.kz', 'tasks.employee@test.kz');
  }

  const adminResult = db.prepare(`
    INSERT INTO users (email, password_hash, full_name, role) VALUES ('tasks.admin@test.kz', ?, 'Admin Test', 'admin')
  `).run(hash);

  const empResult = db.prepare(`
    INSERT INTO users (email, password_hash, full_name, role) VALUES ('tasks.employee@test.kz', ?, 'Employee Test', 'employee')
  `).run(hash);

  adminToken = jwt.sign({ id: adminResult.lastInsertRowid, email: 'tasks.admin@test.kz', role: 'admin', full_name: 'Admin Test' }, process.env.JWT_SECRET, { expiresIn: '1h' });
  employeeToken = jwt.sign({ id: empResult.lastInsertRowid, email: 'tasks.employee@test.kz', role: 'employee', full_name: 'Employee Test' }, process.env.JWT_SECRET, { expiresIn: '1h' });

  // Создаём тестовый проект
  const proj = db.prepare(`
    INSERT INTO projects (name, description, owner_id) VALUES ('Test Project', 'desc', ?)
  `).run(adminResult.lastInsertRowid);
  testProjectId = proj.lastInsertRowid;

  // Создаём тестовую задачу
  const task = db.prepare(`
    INSERT INTO tasks (project_id, title, status, priority, reporter_id) VALUES (?, 'Test Task', 'todo', 'medium', ?)
  `).run(testProjectId, adminResult.lastInsertRowid);
  testTaskId = task.lastInsertRowid;
});

afterAll(() => {
  // Сначала удаляем зависимые записи, потом сущности
  if (testProjectId) db.prepare('DELETE FROM projects WHERE id = ?').run(testProjectId);
  db.prepare('DELETE FROM activity_log WHERE user_id IN (SELECT id FROM users WHERE email IN (?,?))').run('tasks.admin@test.kz', 'tasks.employee@test.kz');
  db.prepare('DELETE FROM users WHERE email IN (?,?)').run('tasks.admin@test.kz', 'tasks.employee@test.kz');
});

describe('GET /api/v1/tasks', () => {
  it('возвращает 401 без токена', async () => {
    const res = await request(app).get('/api/v1/tasks');
    expect(res.status).toBe(401);
  });

  it('возвращает массив задач с токеном', async () => {
    const res = await request(app)
      .get('/api/v1/tasks')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('фильтрует задачи по статусу', async () => {
    const res = await request(app)
      .get('/api/v1/tasks?status=todo')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    res.body.data.forEach(task => {
      expect(task.status).toBe('todo');
    });
  });
});

describe('PATCH /api/v1/tasks/:id', () => {
  it('обновляет статус задачи и updated_at', async () => {
    const before = db.prepare('SELECT updated_at FROM tasks WHERE id = ?').get(testTaskId);

    // Небольшая задержка чтобы updated_at изменился
    await new Promise(r => setTimeout(r, 10));

    const res = await request(app)
      .patch(`/api/v1/tasks/${testTaskId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'in_progress' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('in_progress');
    expect(res.body.updated_at).not.toBe(before.updated_at);
  });
});
