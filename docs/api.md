# CodeTrack REST API

Base URL: `http://localhost:4000/api/v1`

Все защищённые эндпоинты требуют заголовок:
```
Authorization: Bearer <jwt_token>
```

Формат ошибок:
```json
{ "error": { "code": "ERROR_CODE", "message": "Описание ошибки" } }
```

---

## Auth

### POST /api/v1/auth/login
Вход в систему.

**Body:**
```json
{ "email": "string", "password": "string" }
```

**Response 200:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1, "email": "admin@codecraft.kz", "full_name": "Ержан Сериков",
    "position": "CTO", "role": "admin", "avatar_url": "...", "created_at": "..."
  }
}
```

**Response 401:**
```json
{ "error": { "code": "INVALID_CREDENTIALS", "message": "Неверный email или пароль" } }
```

---

### GET /api/v1/auth/me 🔒
Текущий авторизованный пользователь.

**Response 200:** `User`

---

### POST /api/v1/auth/logout 🔒
Заглушка для logout. Клиент должен удалить токен из localStorage.

**Response 200:**
```json
{ "message": "Выход выполнен успешно" }
```

---

### POST /api/v1/auth/register
Регистрация нового пользователя.

**Body:**
```json
{ "email": "string", "password": "string (min 6)", "full_name": "string", "position": "string?", "role": "employee|manager|admin" }
```

**Response 201:** `User`

---

## Users

### GET /api/v1/users 🔒
Список всех пользователей (для выбора assignee).

**Response 200:** `User[]`

---

### GET /api/v1/users/:id 🔒
Получить пользователя по ID.

**Response 200:** `User`
**Response 404:** `{ error: { code: "NOT_FOUND" } }`

---

### POST /api/v1/users 🔒 [admin]
Создать пользователя.

**Body:** `{ email, password, full_name, position?, role }`

**Response 201:** `User`

---

### PATCH /api/v1/users/:id 🔒 [admin | self]
Обновить пользователя. Обычный пользователь может обновить только свой профиль (без смены роли).

**Body:** `{ full_name?, position?, role?, avatar_url?, password? }`

**Response 200:** `User`

---

### DELETE /api/v1/users/:id 🔒 [admin]
Удалить пользователя.

**Response 204:** No Content

---

## Projects

### GET /api/v1/projects 🔒
Список проектов с пагинацией.

**Query params:**
- `status` — фильтр: `active|paused|completed|archived`
- `page` — номер страницы (default: 1)
- `limit` — записей на странице (default: 20)

**Response 200:**
```json
{
  "data": [Project],
  "total": 4,
  "page": 1,
  "limit": 20
}
```

---

### GET /api/v1/projects/:id 🔒
Детали проекта с вложенными задачами.

**Response 200:**
```json
{
  "id": 1, "name": "Keden Cargo Tracker", "status": "active",
  "owner_name": "Айдар Беков", "owner_avatar": "...",
  "tasks": [Task]
}
```

---

### POST /api/v1/projects 🔒 [admin, manager]
Создать проект.

**Body:** `{ name, description?, status?, owner_id?, deadline? }`

**Response 201:** `Project`

---

### PATCH /api/v1/projects/:id 🔒 [admin, manager]
Обновить проект.

**Body:** `{ name?, description?, status?, owner_id?, deadline? }`

**Response 200:** `Project`

---

### DELETE /api/v1/projects/:id 🔒 [admin]
Удалить проект (cascade — удаляет все задачи).

**Response 204:** No Content

---

## Tasks

### GET /api/v1/tasks 🔒
Список задач с фильтрами и пагинацией.

**Query params:**
- `project_id` — фильтр по проекту
- `assignee_id` — фильтр по исполнителю
- `status` — `todo|in_progress|review|done`
- `priority` — `low|medium|high|critical`
- `q` — поиск по заголовку
- `page`, `limit`

**Response 200:**
```json
{ "data": [Task], "total": 30, "page": 1, "limit": 20 }
```

---

### GET /api/v1/tasks/:id 🔒
Детали задачи.

**Response 200:** `Task` (с полями assignee_name, reporter_name, project_name)

---

### POST /api/v1/tasks 🔒
Создать задачу.

**Body:**
```json
{
  "project_id": 1, "title": "string", "description": "string?",
  "status": "todo", "priority": "medium",
  "assignee_id": 2, "due_date": "2024-12-31"
}
```

**Response 201:** `Task`
**Response 403:** Employee без доступа к проекту

---

### PATCH /api/v1/tasks/:id 🔒
Обновить задачу (статус, поля).

**Body:** `{ title?, description?, status?, priority?, assignee_id?, due_date? }`

**Response 200:** `Task`

---

### DELETE /api/v1/tasks/:id 🔒
Удалить задачу.

**Response 204:** No Content

---

## Comments

### GET /api/v1/tasks/:id/comments 🔒
Комментарии к задаче.

**Response 200:** `Comment[]`

---

### POST /api/v1/tasks/:id/comments 🔒
Добавить комментарий.

**Body:** `{ "body": "string" }`

**Response 201:** `Comment`

---

### DELETE /api/v1/comments/:id 🔒 [author | admin]
Удалить комментарий.

**Response 204:** No Content

---

## Stats

### GET /api/v1/stats/overview 🔒
Общая статистика для дашборда.

**Response 200:**
```json
{
  "total_projects": 4,
  "total_tasks": 30,
  "my_active_tasks": 5,
  "completed_this_week": 3,
  "tasks_by_status": [{ "status": "todo", "count": 10 }],
  "tasks_by_priority": [{ "priority": "high", "count": 8 }]
}
```

---

### GET /api/v1/stats/workload 🔒
Нагрузка по сотрудникам (для bar chart).

**Response 200:**
```json
[{
  "id": 2, "full_name": "Нурлан Касымов", "position": "Backend Developer",
  "total_tasks": 7, "todo": 2, "in_progress": 3, "review": 1, "done": 1
}]
```

---

### GET /api/v1/stats/burndown?project_id=:id 🔒
Данные для burndown-графика за последние 14 дней.

**Response 200:**
```json
{
  "project": { "id": 1, "name": "Keden Cargo Tracker" },
  "data": [{ "date": "2024-01-01", "completed": 3, "remaining": 7 }]
}
```

---

### GET /api/v1/stats/activity?limit=20 🔒
Последние действия из activity_log.

**Response 200:**
```json
[{
  "id": 1, "user_id": 2, "full_name": "Айдар Беков", "avatar_url": "...",
  "entity_type": "task", "entity_id": 5, "action": "created",
  "meta": "{\"title\": \"Настроить JWT\"}", "created_at": "..."
}]
```

---

## Типы данных

### User
```typescript
{
  id: number; email: string; full_name: string;
  position: string | null; role: 'admin' | 'manager' | 'employee';
  avatar_url: string | null; created_at: string;
}
```

### Project
```typescript
{
  id: number; name: string; description: string | null;
  status: 'active' | 'paused' | 'completed' | 'archived';
  owner_id: number; deadline: string | null; created_at: string;
}
```

### Task
```typescript
{
  id: number; project_id: number; title: string; description: string | null;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee_id: number | null; reporter_id: number | null;
  due_date: string | null; created_at: string; updated_at: string;
}
```

### Comment
```typescript
{
  id: number; task_id: number; user_id: number;
  full_name: string; avatar_url: string | null;
  body: string; created_at: string;
}
```
