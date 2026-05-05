# CodeTrack

Внутренняя система управления задачами для **TOO Codecraft** (дочерняя компания Keden Group, г. Астана). Централизованный учёт проектов, задач и нагрузки сотрудников — замена разрозненных Excel-таблиц и переписки в мессенджерах.

## Скриншоты

| Дашборд | Kanban-доска | Задачи |
|---------|-------------|--------|
| ![dashboard]() | ![kanban]() | ![tasks]() |

## Стек

| Слой | Технологии |
|------|-----------|
| **Backend** | Node.js 20, Express 4, better-sqlite3, JWT, bcryptjs, Zod |
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS 3, Recharts, Lucide |
| **Тесты** | Vitest + Testing Library (frontend), Jest + Supertest (backend) |

## Установка и запуск

### Требования
- Node.js 20+
- npm 9+

### 1. Клонировать репозиторий
```bash
git clone <repo-url>
cd codetrack
```

### 2. Запустить backend
```bash
cd backend
npm install
npm run seed          # Инициализировать БД с тестовыми данными
npm run dev           # Запустить сервер на http://localhost:4000
```

### 3. Запустить frontend (в новом терминале)
```bash
cd frontend
npm install
npm run dev           # Запустить на http://localhost:5173
```

Открыть: **http://localhost:5173**

### Сброс базы данных
```bash
cd backend
npm run seed -- --reset   # Полный сброс и пересоздание данных
```

## Структура папок

```
codetrack/
├── backend/
│   ├── src/
│   │   ├── db/             # schema.sql, seed.js, connection.js
│   │   ├── routes/         # auth, users, projects, tasks, comments, stats
│   │   ├── middleware/     # auth, errorHandler, validate
│   │   └── server.js
│   ├── tests/
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/            # axios + все API-функции
│   │   ├── components/     # Layout, Sidebar, Topbar, TaskCard, KanbanBoard, Modal
│   │   ├── context/        # AuthContext
│   │   ├── hooks/          # useTheme
│   │   └── pages/          # Login, Dashboard, Projects, Tasks, Profile, AdminUsers
│   ├── tests/
│   └── package.json
└── docs/
    └── api.md
```

## Роли пользователей

| Роль | Возможности |
|------|------------|
| **admin** | Полный доступ, CRUD пользователей, удаление проектов |
| **manager** | Создание проектов и задач, назначение исполнителей |
| **employee** | Просмотр своих задач, смена статуса, комментарии |

## Тестовые credentials

| Email | Пароль | Роль |
|-------|--------|------|
| `admin@codecraft.kz` | `admin123` | Admin (CTO) |
| `aidar.bekov@codecraft.kz` | `password123` | Manager (Lead Backend Dev) |
| `dinara.aliyeva@codecraft.kz` | `password123` | Manager (Senior Frontend Dev) |
| `nurlan.kassymov@codecraft.kz` | `password123` | Employee (Backend Dev) |
| `zhanar.bekova@codecraft.kz` | `password123` | Manager (Project Manager) |

## npm скрипты

### Backend
| Команда | Описание |
|---------|---------|
| `npm run dev` | Запуск с nodemon (hot-reload) |
| `npm start` | Запуск в production-режиме |
| `npm run seed` | Инициализация БД тестовыми данными |
| `npm run seed -- --reset` | Сброс и пересоздание данных |
| `npm test` | Запуск Jest-тестов |

### Frontend
| Команда | Описание |
|---------|---------|
| `npm run dev` | Vite dev-сервер |
| `npm run build` | Production-сборка |
| `npm test` | Vitest |

## API

Документация REST API: [docs/api.md](docs/api.md)

Базовый URL: `http://localhost:4000/api/v1`

## Лицензия

MIT © 2024 TOO Codecraft
