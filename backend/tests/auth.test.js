import request from 'supertest';
import { beforeAll, afterAll, describe, it, expect } from '@jest/globals';
import app from '../src/server.js';
import db from '../src/db/connection.js';
import bcrypt from 'bcryptjs';

// Создаём тестового пользователя перед тестами
beforeAll(() => {
  const hash = bcrypt.hashSync('testpassword', 10);
  db.prepare('DELETE FROM users WHERE email = ?').run('test.user@codecraft.kz');
  db.prepare(`
    INSERT INTO users (email, password_hash, full_name, position, role)
    VALUES ('test.user@codecraft.kz', ?, 'Test User', 'Tester', 'employee')
  `).run(hash);
});

afterAll(() => {
  db.prepare('DELETE FROM users WHERE email = ?').run('test.user@codecraft.kz');
});

describe('POST /api/v1/auth/login', () => {
  it('возвращает токен при верных credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test.user@codecraft.kz', password: 'testpassword' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe('test.user@codecraft.kz');
    expect(res.body.user).not.toHaveProperty('password_hash');
  });

  it('возвращает 401 при неверном пароле', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test.user@codecraft.kz', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('возвращает 400 при невалидном email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'not-an-email', password: 'somepassword' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
