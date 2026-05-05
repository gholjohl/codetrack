import { Router } from 'express';
import db from '../db/connection.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// GET /stats/overview
router.get('/overview', (req, res) => {
  const total_projects = db.prepare('SELECT COUNT(*) as n FROM projects').get().n;
  const total_tasks = db.prepare('SELECT COUNT(*) as n FROM tasks').get().n;

  const my_active_tasks = db.prepare(`
    SELECT COUNT(*) as n FROM tasks WHERE assignee_id = ? AND status IN ('todo','in_progress','review')
  `).get(req.user.id).n;

  const tasks_by_status = db.prepare(`
    SELECT status, COUNT(*) as count FROM tasks GROUP BY status
  `).all();

  const tasks_by_priority = db.prepare(`
    SELECT priority, COUNT(*) as count FROM tasks GROUP BY priority
  `).all();

  // Задачи, завершённые за последние 7 дней
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const completed_this_week = db.prepare(`
    SELECT COUNT(*) as n FROM tasks WHERE status = 'done' AND updated_at >= ?
  `).get(sevenDaysAgo).n;

  res.json({
    total_projects,
    total_tasks,
    my_active_tasks,
    completed_this_week,
    tasks_by_status,
    tasks_by_priority,
  });
});

// GET /stats/workload — задачи по сотрудникам
router.get('/workload', (req, res) => {
  const workload = db.prepare(`
    SELECT
      u.id, u.full_name, u.position, u.avatar_url,
      COUNT(t.id) as total_tasks,
      SUM(CASE WHEN t.status = 'todo' THEN 1 ELSE 0 END) as todo,
      SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
      SUM(CASE WHEN t.status = 'review' THEN 1 ELSE 0 END) as review,
      SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as done
    FROM users u
    LEFT JOIN tasks t ON t.assignee_id = u.id
    GROUP BY u.id
    HAVING total_tasks > 0
    ORDER BY total_tasks DESC
  `).all();

  res.json(workload);
});

// GET /stats/burndown?project_id
router.get('/burndown', (req, res) => {
  const { project_id } = req.query;
  if (!project_id) {
    return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'project_id обязателен' } });
  }

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(project_id);
  if (!project) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Проект не найден' } });
  }

  // Генерируем данные за последние 14 дней
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const completed = db.prepare(`
      SELECT COUNT(*) as n FROM tasks
      WHERE project_id = ? AND status = 'done' AND DATE(updated_at) <= ?
    `).get(project_id, dateStr).n;

    const total = db.prepare(`
      SELECT COUNT(*) as n FROM tasks
      WHERE project_id = ? AND DATE(created_at) <= ?
    `).get(project_id, dateStr).n;

    days.push({ date: dateStr, completed, remaining: total - completed });
  }

  res.json({ project, data: days });
});

// GET /stats/activity — последние действия
router.get('/activity', (req, res) => {
  const { limit = 20 } = req.query;
  const activity = db.prepare(`
    SELECT a.*, u.full_name, u.avatar_url
    FROM activity_log a
    LEFT JOIN users u ON a.user_id = u.id
    ORDER BY a.created_at DESC
    LIMIT ?
  `).all(parseInt(limit));

  res.json(activity);
});

export default router;
