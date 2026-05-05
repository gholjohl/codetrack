# CodeTrack — Внутренняя система управления задачами

## Контекст

CodeTrack — внутренняя CRM/таск-трекер для **TOO Codecraft** (дочерняя компания **Keden Group**, г. Астана). Цель — централизованный учёт проектов, задач, нагрузки сотрудников; замена разрозненных Excel-таблиц и переписки в мессенджерах.

Проект разрабатывается стажёром-инженером Software Engineering в рамках 2-месячной производственной практики.

## Технологический стек

### Backend
- **Node.js 20+**, ESM-модули (`"type": "module"`)
- **Express 4** — HTTP-сервер
- **better-sqlite3** — встроенная БД (синхронная, без external dependencies)
- **jsonwebtoken** + **bcryptjs** — авторизация
- **zod** — валидация входящих данных
- **cors**, **morgan**, **dotenv**

### Frontend
- **React 18** + **Vite** + **TypeScript**
- **TailwindCSS 3** — стили
- **React Router v6** — роутинг
- **Axios** — HTTP-клиент
- **Recharts** — графики на дашборде
- **Lucide-react** — иконки
- **react-hot-toast** — уведомления

### Тесты
- **Vitest** + **@testing-library/react** — frontend
- **Jest** + **supertest** — backend

## Структура проекта

```
codetrack/
├── backend/
│   ├── src/
│   │   ├── routes/         # auth, users, projects, tasks, comments, stats
│   │   ├── middleware/     # auth, errorHandler, validate
│   │   ├── db/             # schema.sql, seed.js, connection.js
│   │   ├── utils/
│   │   └── server.js
│   ├── tests/
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/          # Login, Register, Dashboard, Projects, Tasks, Profile, Admin
│   │   ├── components/     # Layout, Sidebar, TaskCard, KanbanBoard, Modal, ...
│   │   ├── api/            # axios-инстансы и функции
│   │   ├── context/        # AuthContext
│   │   ├── hooks/
│   │   └── App.tsx
│   ├── tests/
│   └── package.json
├── docs/
│   └── api.md              # описание REST API
├── .gitignore
└── README.md
```

## Соглашения

- Все API под префиксом `/api/v1`
- JWT передаётся в заголовке `Authorization: Bearer <token>`
- Формат ошибок: `{ error: { code: string, message: string } }`
- Имена файлов, переменных, функций — **на английском**
- Комментарии в коде — **на русском** (для отчёта по практике)
- Commit-сообщения на английском, формат Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`)
- Все даты в БД в ISO-8601 (UTC)

## Роли пользователей

- **admin** — полный доступ, управление пользователями
- **manager** — создаёт проекты и задачи, назначает исполнителей
- **employee** — видит свои задачи, меняет статус, комментирует

## База данных

SQLite-файл `backend/data.db`. Таблицы:

- `users` (id, email, password_hash, full_name, position, role, avatar_url, created_at)
- `projects` (id, name, description, status, owner_id, created_at, deadline)
- `tasks` (id, project_id, title, description, status, priority, assignee_id, reporter_id, due_date, created_at, updated_at)
- `comments` (id, task_id, user_id, body, created_at)
- `activity_log` (id, user_id, entity_type, entity_id, action, created_at)

При сидинге создаются:
- 12 сотрудников с реалистичными казахстанскими именами (Айдар, Динара, Нурлан, Алия, Тимур и т.д.), реальными должностями (Backend Developer, QA Engineer, Project Manager, ...)
- 1 admin аккаунт: `admin@codecraft.kz` / `admin123`
- 4 проекта (Keden Cargo Tracker, Internal CRM, Mobile Banking SDK, AI Document Parser)
- ~30 задач разного статуса и приоритета
- Комментарии и записи в activity_log

## Запуск

```bash
# Backend
cd backend && npm install && npm run seed && npm run dev   # порт 4000

# Frontend (в другом терминале)
cd frontend && npm install && npm run dev                  # порт 5173
```

В `frontend/vite.config.ts` настроен прокси `/api → http://localhost:4000`.

## Принципы для разработки

- Все формы валидируются и на клиенте, и на сервере
- Все защищённые роуты используют `authMiddleware`
- Доступ проверяется по роли (`requireRole('admin')`)
- Никаких `any` в TypeScript-коде
- Компоненты ≤ 200 строк, иначе разбиваются
- Каждая страница использует общий `Layout` с сайдбаром