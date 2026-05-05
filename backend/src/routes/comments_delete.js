import { Router } from 'express';
import db from '../db/connection.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// DELETE /comments/:id
router.delete('/:id', (req, res) => {
  const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(req.params.id);
  if (!comment) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Комментарий не найден' } });
  }

  const isAuthor = comment.user_id === req.user.id;
  const isAdmin = req.user.role === 'admin';
  if (!isAuthor && !isAdmin) {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Нет прав на удаление' } });
  }

  db.prepare('DELETE FROM comments WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

export default router;
