import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = process.env.DB_PATH || './data.db';
const reset = process.argv.includes('--reset');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

if (reset) {
  console.log('Сброс базы данных...');
  db.exec(`
    DROP TABLE IF EXISTS activity_log;
    DROP TABLE IF EXISTS comments;
    DROP TABLE IF EXISTS tasks;
    DROP TABLE IF EXISTS projects;
    DROP TABLE IF EXISTS users;
  `);
}

const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

// Проверяем, есть ли уже данные
const existingUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
if (existingUsers.count > 0 && !reset) {
  console.log('База данных уже содержит данные. Используйте --reset для сброса.');
  process.exit(0);
}

console.log('Заполнение базы данных...');

// Хэшируем пароли
const adminHash = bcrypt.hashSync('admin123', 10);
const defaultHash = bcrypt.hashSync('password123', 10);

// Вставка пользователей
const insertUser = db.prepare(`
  INSERT INTO users (email, password_hash, full_name, position, role, avatar_url)
  VALUES (@email, @password_hash, @full_name, @position, @role, @avatar_url)
`);

const users = [
  { email: 'admin@codecraft.kz', password_hash: adminHash, full_name: 'Тарас Кушалиев', position: 'CTO', role: 'admin', avatar_url: 'https://i.pravatar.cc/150?u=admin@codecraft.kz' },
  { email: 'aidar.bekov@codecraft.kz', password_hash: defaultHash, full_name: 'Айдар Беков', position: 'Lead Backend Developer', role: 'manager', avatar_url: 'https://i.pravatar.cc/150?u=aidar.bekov@codecraft.kz' },
  { email: 'dinara.aliyeva@codecraft.kz', password_hash: defaultHash, full_name: 'Динара Алиева', position: 'Senior Frontend Developer', role: 'manager', avatar_url: 'https://i.pravatar.cc/150?u=dinara.aliyeva@codecraft.kz' },
  { email: 'nurlan.kassymov@codecraft.kz', password_hash: defaultHash, full_name: 'Нурлан Касымов', position: 'Backend Developer', role: 'employee', avatar_url: 'https://i.pravatar.cc/150?u=nurlan.kassymov@codecraft.kz' },
  { email: 'aliya.tursunova@codecraft.kz', password_hash: defaultHash, full_name: 'Алия Турсунова', position: 'Frontend Developer', role: 'employee', avatar_url: 'https://i.pravatar.cc/150?u=aliya.tursunova@codecraft.kz' },
  { email: 'timur.zhaksybek@codecraft.kz', password_hash: defaultHash, full_name: 'Тимур Жаксыбек', position: 'DevOps Engineer', role: 'employee', avatar_url: 'https://i.pravatar.cc/150?u=timur.zhaksybek@codecraft.kz' },
  { email: 'madina.omarova@codecraft.kz', password_hash: defaultHash, full_name: 'Мадина Омарова', position: 'QA Lead', role: 'manager', avatar_url: 'https://i.pravatar.cc/150?u=madina.omarova@codecraft.kz' },
  { email: 'daniyar.satov@codecraft.kz', password_hash: defaultHash, full_name: 'Данияр Сатов', position: 'QA Engineer', role: 'employee', avatar_url: 'https://i.pravatar.cc/150?u=daniyar.satov@codecraft.kz' },
  { email: 'asem.nurkhanova@codecraft.kz', password_hash: defaultHash, full_name: 'Асем Нурханова', position: 'UI/UX Designer', role: 'employee', avatar_url: 'https://i.pravatar.cc/150?u=asem.nurkhanova@codecraft.kz' },
  { email: 'ruslan.kim@codecraft.kz', password_hash: defaultHash, full_name: 'Руслан Ким', position: 'Mobile Developer (Flutter)', role: 'employee', avatar_url: 'https://i.pravatar.cc/150?u=ruslan.kim@codecraft.kz' },
  { email: 'zhanar.bekova@codecraft.kz', password_hash: defaultHash, full_name: 'Жанар Бекова', position: 'Project Manager', role: 'manager', avatar_url: 'https://i.pravatar.cc/150?u=zhanar.bekova@codecraft.kz' },
  { email: 'sanzhar.akhmetov@codecraft.kz', password_hash: defaultHash, full_name: 'Санжар Ахметов', position: 'Junior Backend Developer', role: 'employee', avatar_url: 'https://i.pravatar.cc/150?u=sanzhar.akhmetov@codecraft.kz' },
];

const userIds = {};
for (const user of users) {
  const result = insertUser.run(user);
  userIds[user.email] = result.lastInsertRowid;
}
console.log(`Создано ${users.length} пользователей`);

// Вставка проектов
const insertProject = db.prepare(`
  INSERT INTO projects (name, description, status, owner_id, deadline)
  VALUES (@name, @description, @status, @owner_id, @deadline)
`);

const projects = [
  {
    name: 'Keden Cargo Tracker',
    description: 'Система отслеживания грузов для логистики Keden Group. Включает реальное время трекинга, уведомления и интеграцию с таможенными API.',
    status: 'active',
    owner_id: userIds['aidar.bekov@codecraft.kz'],
    deadline: '2026-04-28',
  },
  {
    name: 'Internal CRM',
    description: 'Внутренняя CRM система для управления клиентами Codecraft. Учёт контактов, сделок, задач по клиентам.',
    status: 'active',
    owner_id: userIds['dinara.aliyeva@codecraft.kz'],
    deadline: '2026-05-02',
  },
  {
    name: 'Mobile Banking SDK',
    description: 'SDK для интеграции мобильных приложений с банками-партнёрами. Поддержка Flutter и React Native.',
    status: 'active',
    owner_id: userIds['ruslan.kim@codecraft.kz'],
    deadline: '2026-04-20',
  },
  {
    name: 'AI Document Parser',
    description: 'Парсер таможенных деклараций с использованием ML. Автоматическое извлечение данных из PDF и сканов.',
    status: 'active',
    owner_id: userIds['madina.omarova@codecraft.kz'],
    deadline: '2026-04-15',
  },
];

const projectIds = [];
for (const project of projects) {
  const result = insertProject.run(project);
  projectIds.push(result.lastInsertRowid);
}
console.log(`Создано ${projects.length} проектов`);

// Вставка задач
const insertTask = db.prepare(`
  INSERT INTO tasks (project_id, title, description, status, priority, assignee_id, reporter_id, due_date)
  VALUES (@project_id, @title, @description, @status, @priority, @assignee_id, @reporter_id, @due_date)
`);

const [p1, p2, p3, p4] = projectIds;

const tasks = [
  // Keden Cargo Tracker
  { project_id: p1, title: 'Настроить JWT refresh tokens', description: 'Реализовать механизм обновления access-токенов через refresh-токены. Хранить refresh-токены в БД с возможностью отзыва.', status: 'done', priority: 'high', assignee_id: userIds['nurlan.kassymov@codecraft.kz'], reporter_id: userIds['aidar.bekov@codecraft.kz'], due_date: '2026-03-20' },
  { project_id: p1, title: 'Написать unit-тесты для CargoService', description: 'Покрыть тестами методы createShipment, updateStatus, getCargoByTrackingNumber. Использовать Jest с моком базы.', status: 'in_progress', priority: 'medium', assignee_id: userIds['daniyar.satov@codecraft.kz'], reporter_id: userIds['aidar.bekov@codecraft.kz'], due_date: '2026-04-20' },
  { project_id: p1, title: 'Интеграция с таможенным API КТЖ', description: 'Подключить REST API Казахстан Темір Жолы для автоматического получения статусов грузов.', status: 'todo', priority: 'critical', assignee_id: userIds['nurlan.kassymov@codecraft.kz'], reporter_id: userIds['aidar.bekov@codecraft.kz'], due_date: '2026-04-28' },
  { project_id: p1, title: 'Дизайн страницы отслеживания груза', description: 'Разработать UI для страницы трекинга: карта с маршрутом, временная шкала событий, детали груза.', status: 'review', priority: 'high', assignee_id: userIds['asem.nurkhanova@codecraft.kz'], reporter_id: userIds['zhanar.bekova@codecraft.kz'], due_date: '2026-04-25' },
  { project_id: p1, title: 'Оптимизировать запрос /cargo?filter=status', description: 'Добавить индексы на поля status и created_at. Время ответа должно быть < 100ms при 10k+ записей.', status: 'in_progress', priority: 'high', assignee_id: userIds['nurlan.kassymov@codecraft.kz'], reporter_id: userIds['aidar.bekov@codecraft.kz'], due_date: '2026-04-22' },
  { project_id: p1, title: 'Настроить CI/CD pipeline в GitHub Actions', description: 'Создать workflow для автотестов и деплоя на staging при пуше в main.', status: 'done', priority: 'medium', assignee_id: userIds['timur.zhaksybek@codecraft.kz'], reporter_id: userIds['aidar.bekov@codecraft.kz'], due_date: '2026-03-15' },
  { project_id: p1, title: 'Подключить Sentry для мониторинга ошибок', description: 'Интегрировать Sentry SDK в backend и frontend. Настроить алерты на критические ошибки.', status: 'todo', priority: 'medium', assignee_id: userIds['timur.zhaksybek@codecraft.kz'], reporter_id: userIds['zhanar.bekova@codecraft.kz'], due_date: '2026-05-01' },
  { project_id: p1, title: 'Реализовать push-уведомления через FCM', description: 'Подключить Firebase Cloud Messaging для отправки уведомлений при изменении статуса груза.', status: 'todo', priority: 'low', assignee_id: userIds['sanzhar.akhmetov@codecraft.kz'], reporter_id: userIds['aidar.bekov@codecraft.kz'], due_date: '2026-05-02' },

  // Internal CRM
  { project_id: p2, title: 'Компонент таблицы клиентов с пагинацией', description: 'Создать React-компонент для отображения списка клиентов с серверной пагинацией, поиском и фильтрами.', status: 'done', priority: 'high', assignee_id: userIds['aliya.tursunova@codecraft.kz'], reporter_id: userIds['dinara.aliyeva@codecraft.kz'], due_date: '2026-03-25' },
  { project_id: p2, title: 'API эндпоинт для создания сделки', description: 'POST /deals — валидация через Zod, запись в БД, отправка email-уведомления менеджеру.', status: 'in_progress', priority: 'high', assignee_id: userIds['nurlan.kassymov@codecraft.kz'], reporter_id: userIds['dinara.aliyeva@codecraft.kz'], due_date: '2026-04-27' },
  { project_id: p2, title: 'Миграция БД на v2 схему', description: 'Добавить таблицу deals, поле last_contact_date в clients. Написать скрипт обратной совместимости.', status: 'review', priority: 'critical', assignee_id: userIds['nurlan.kassymov@codecraft.kz'], reporter_id: userIds['zhanar.bekova@codecraft.kz'], due_date: '2026-04-24' },
  { project_id: p2, title: 'Тест-план для модуля работы с клиентами', description: 'Написать тест-план покрывающий CRUD операции, валидацию, граничные случаи.', status: 'in_progress', priority: 'medium', assignee_id: userIds['daniyar.satov@codecraft.kz'], reporter_id: userIds['madina.omarova@codecraft.kz'], due_date: '2026-04-29' },
  { project_id: p2, title: 'Дизайн воронки продаж (Kanban)', description: 'UI для визуализации воронки: колонки по стадиям сделки, drag-and-drop карточек.', status: 'todo', priority: 'medium', assignee_id: userIds['asem.nurkhanova@codecraft.kz'], reporter_id: userIds['dinara.aliyeva@codecraft.kz'], due_date: '2026-05-01' },
  { project_id: p2, title: 'Интеграция с Google Calendar для встреч', description: 'OAuth2 авторизация, создание событий в Google Calendar при планировании встреч с клиентом.', status: 'todo', priority: 'low', assignee_id: userIds['aliya.tursunova@codecraft.kz'], reporter_id: userIds['dinara.aliyeva@codecraft.kz'], due_date: '2026-05-02' },
  { project_id: p2, title: 'Экспорт клиентов в Excel', description: 'Кнопка выгрузки таблицы клиентов в .xlsx через библиотеку exceljs. Фильтры применяются.', status: 'done', priority: 'low', assignee_id: userIds['sanzhar.akhmetov@codecraft.kz'], reporter_id: userIds['dinara.aliyeva@codecraft.kz'], due_date: '2026-03-28' },

  // Mobile Banking SDK
  { project_id: p3, title: 'Архитектура Flutter-пакета для платежей', description: 'Разработать структуру пакета: модели, интерфейсы, адаптеры для банков. Документировать в README.', status: 'done', priority: 'critical', assignee_id: userIds['ruslan.kim@codecraft.kz'], reporter_id: userIds['zhanar.bekova@codecraft.kz'], due_date: '2026-03-09' },
  { project_id: p3, title: 'Реализовать адаптер для Kaspi Bank API', description: 'Интегрировать Kaspi Bank REST API: баланс, история транзакций, P2P переводы.', status: 'in_progress', priority: 'high', assignee_id: userIds['ruslan.kim@codecraft.kz'], reporter_id: userIds['aidar.bekov@codecraft.kz'], due_date: '2026-04-30' },
  { project_id: p3, title: 'Покрыть SDK unit-тестами (coverage > 80%)', description: 'Написать тесты для всех публичных методов SDK. Настроить coverage report в CI.', status: 'review', priority: 'high', assignee_id: userIds['daniyar.satov@codecraft.kz'], reporter_id: userIds['madina.omarova@codecraft.kz'], due_date: '2026-04-26' },
  { project_id: p3, title: 'Документация SDK на pub.dev', description: 'Написать dartdoc-комментарии для всех классов и методов. Добавить примеры использования.', status: 'todo', priority: 'medium', assignee_id: userIds['ruslan.kim@codecraft.kz'], reporter_id: userIds['zhanar.bekova@codecraft.kz'], due_date: '2026-05-02' },
  { project_id: p3, title: 'Настроить автоматическую публикацию в pub.dev', description: 'GitHub Actions workflow для автопубликации новых версий при создании тега vX.X.X.', status: 'todo', priority: 'low', assignee_id: userIds['timur.zhaksybek@codecraft.kz'], reporter_id: userIds['zhanar.bekova@codecraft.kz'], due_date: '2026-05-02' },
  { project_id: p3, title: 'Безопасное хранение API-ключей в SDK', description: 'Использовать flutter_secure_storage для хранения токенов. Добавить обфускацию строк.', status: 'in_progress', priority: 'critical', assignee_id: userIds['ruslan.kim@codecraft.kz'], reporter_id: userIds['aidar.bekov@codecraft.kz'], due_date: '2026-04-23' },

  // AI Document Parser
  { project_id: p4, title: 'Исследование ML-моделей для OCR таможенных форм', description: 'Сравнить Tesseract, EasyOCR, PaddleOCR на датасете казахстанских таможенных деклараций.', status: 'done', priority: 'high', assignee_id: userIds['nurlan.kassymov@codecraft.kz'], reporter_id: userIds['madina.omarova@codecraft.kz'], due_date: '2026-03-12' },
  { project_id: p4, title: 'API эндпоинт для загрузки и парсинга PDF', description: 'POST /parse — принимает PDF/изображение, возвращает структурированный JSON с полями декларации.', status: 'in_progress', priority: 'high', assignee_id: userIds['nurlan.kassymov@codecraft.kz'], reporter_id: userIds['madina.omarova@codecraft.kz'], due_date: '2026-04-27' },
  { project_id: p4, title: 'UI для загрузки документов', description: 'Drag-and-drop зона загрузки файлов, прогресс-бар, предпросмотр результата парсинга.', status: 'todo', priority: 'medium', assignee_id: userIds['aliya.tursunova@codecraft.kz'], reporter_id: userIds['dinara.aliyeva@codecraft.kz'], due_date: '2026-05-01' },
  { project_id: p4, title: 'Оптимизировать запрос /tasks?filter=status', description: 'Профилирование slow queries. Добавить составной индекс (status, project_id, assignee_id).', status: 'review', priority: 'medium', assignee_id: userIds['sanzhar.akhmetov@codecraft.kz'], reporter_id: userIds['aidar.bekov@codecraft.kz'], due_date: '2026-04-21' },
  { project_id: p4, title: 'Нагрузочное тестирование парсера (k6)', description: 'Написать k6-сценарий: 50 одновременных пользователей загружают PDF. Target: p95 < 5s.', status: 'todo', priority: 'medium', assignee_id: userIds['daniyar.satov@codecraft.kz'], reporter_id: userIds['madina.omarova@codecraft.kz'], due_date: '2026-05-02' },
  { project_id: p4, title: 'Реализовать очередь задач через BullMQ', description: 'Вынести тяжёлый парсинг в фоновые джобы. Настроить retry-логику и DLQ.', status: 'todo', priority: 'high', assignee_id: userIds['nurlan.kassymov@codecraft.kz'], reporter_id: userIds['aidar.bekov@codecraft.kz'], due_date: '2026-05-02' },
  { project_id: p4, title: 'Разработать систему версионирования моделей', description: 'MLflow или DVC для отслеживания экспериментов и версий моделей парсера.', status: 'todo', priority: 'low', assignee_id: userIds['sanzhar.akhmetov@codecraft.kz'], reporter_id: userIds['madina.omarova@codecraft.kz'], due_date: '2026-04-30' },
];

const taskIds = [];
for (const task of tasks) {
  const result = insertTask.run(task);
  taskIds.push(result.lastInsertRowid);
}
console.log(`Создано ${tasks.length} задач`);

// Вставка комментариев
const insertComment = db.prepare(`
  INSERT INTO comments (task_id, user_id, body)
  VALUES (@task_id, @user_id, @body)
`);

const comments = [
  { task_id: taskIds[0], user_id: userIds['nurlan.kassymov@codecraft.kz'], body: 'Реализовал хранение refresh-токенов в таблице refresh_tokens. Добавил TTL 30 дней и возможность отзыва по user_id.' },
  { task_id: taskIds[0], user_id: userIds['aidar.bekov@codecraft.kz'], body: 'Отличная работа! Только добавь ротацию токенов — каждый refresh должен выдавать новый refresh-токен.' },
  { task_id: taskIds[1], user_id: userIds['daniyar.satov@codecraft.kz'], body: 'Написал 12 тестов. Покрытие на уровне 78%. Остались граничные случаи для getCargoByTrackingNumber.' },
  { task_id: taskIds[3], user_id: userIds['asem.nurkhanova@codecraft.kz'], body: 'Макеты готовы в Figma. Использовала компонентную библиотеку, совместимую с нашим дизайн-гайдом.' },
  { task_id: taskIds[3], user_id: userIds['zhanar.bekova@codecraft.kz'], body: 'Нужно пересмотреть мобильную версию — карта на маленьких экранах перекрывает таймлайн.' },
  { task_id: taskIds[3], user_id: userIds['aliya.tursunova@codecraft.kz'], body: 'Могу взять в работу реализацию сразу после апрува дизайна. Ориентировочно 3 дня.' },
  { task_id: taskIds[8], user_id: userIds['aliya.tursunova@codecraft.kz'], body: 'Компонент готов. Серверная пагинация работает, добавила debounce 300ms на поиск.' },
  { task_id: taskIds[9], user_id: userIds['nurlan.kassymov@codecraft.kz'], body: 'Столкнулся с проблемой валидации вложенных объектов в Zod. Нужно обсудить схему.' },
  { task_id: taskIds[9], user_id: userIds['dinara.aliyeva@codecraft.kz'], body: 'Смотри документацию zod.dev/api#objects для nested schemas. Или перепиши как flat-структуру.' },
  { task_id: taskIds[15], user_id: userIds['sanzhar.akhmetov@codecraft.kz'], body: 'Экспорт работает. Проверил на 5000 записей — генерация занимает ~2 секунды, это приемлемо.' },
  { task_id: taskIds[16], user_id: userIds['ruslan.kim@codecraft.kz'], body: 'Архитектура согласована с командой. Используем monorepo с packages/core, packages/kaspi, packages/halyk.' },
  { task_id: taskIds[22], user_id: userIds['nurlan.kassymov@codecraft.kz'], body: 'Сравнение завершено: PaddleOCR показал 94.3% точности на тестовом датасете против 87% у Tesseract.' },
  { task_id: taskIds[22], user_id: userIds['madina.omarova@codecraft.kz'], body: 'Хороший результат! Давай возьмём PaddleOCR за основу. Оформи результаты в техническое решение.' },
];

for (const comment of comments) {
  insertComment.run(comment);
}
console.log(`Создано ${comments.length} комментариев`);

// Вставка записей activity_log
const insertActivity = db.prepare(`
  INSERT INTO activity_log (user_id, entity_type, entity_id, action, meta)
  VALUES (@user_id, @entity_type, @entity_id, @action, @meta)
`);

const activities = [];

// Активность по проектам
for (let i = 0; i < projects.length; i++) {
  activities.push({
    user_id: projects[i].owner_id,
    entity_type: 'project',
    entity_id: projectIds[i],
    action: 'created',
    meta: JSON.stringify({ name: projects[i].name }),
  });
}

// Активность по задачам (для первых 15)
for (let i = 0; i < Math.min(15, tasks.length); i++) {
  activities.push({
    user_id: tasks[i].reporter_id,
    entity_type: 'task',
    entity_id: taskIds[i],
    action: 'created',
    meta: JSON.stringify({ title: tasks[i].title }),
  });
}

// Дополнительные активности — смена статусов
activities.push({ user_id: userIds['nurlan.kassymov@codecraft.kz'], entity_type: 'task', entity_id: taskIds[0], action: 'status_changed', meta: JSON.stringify({ from: 'in_progress', to: 'done' }) });
activities.push({ user_id: userIds['timur.zhaksybek@codecraft.kz'], entity_type: 'task', entity_id: taskIds[5], action: 'status_changed', meta: JSON.stringify({ from: 'review', to: 'done' }) });
activities.push({ user_id: userIds['aliya.tursunova@codecraft.kz'], entity_type: 'task', entity_id: taskIds[8], action: 'status_changed', meta: JSON.stringify({ from: 'in_progress', to: 'done' }) });
activities.push({ user_id: userIds['ruslan.kim@codecraft.kz'], entity_type: 'task', entity_id: taskIds[16], action: 'status_changed', meta: JSON.stringify({ from: 'in_progress', to: 'done' }) });

for (const activity of activities) {
  insertActivity.run(activity);
}
console.log(`Создано ${activities.length} записей activity_log`);

console.log('\nСидинг завершён успешно!');
console.log('Тестовые credentials:');
console.log('  admin@codecraft.kz / admin123');
console.log('  aidar.bekov@codecraft.kz / password123');
console.log('  dinara.aliyeva@codecraft.kz / password123');

db.close();
