import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import projectsRouter from './routes/projects.js';
import tasksRouter from './routes/tasks.js';
import commentsRouter from './routes/comments.js';
import commentsDeleteRouter from './routes/comments_delete.js';
import statsRouter from './routes/stats.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Маршруты API
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/projects', projectsRouter);
app.use('/api/v1/tasks', tasksRouter);
app.use('/api/v1/tasks/:id/comments', commentsRouter);
app.use('/api/v1/comments', commentsDeleteRouter);
app.use('/api/v1/stats', statsRouter);

// Базовый healthcheck
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`CodeTrack API запущен на http://localhost:${PORT}`);
  });
}

export default app;
