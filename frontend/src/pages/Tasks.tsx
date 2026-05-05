import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Filter, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { getTasks, createTask } from '../api/tasks';
import type { Task } from '../api/tasks';
import { getProjects } from '../api/projects';
import type { Project } from '../api/projects';
import { getUsers } from '../api/users';
import type { User } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import clsx from 'clsx';

const STATUS_COLORS: Record<string, string> = {
  todo: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  review: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  done: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

const STATUS_LABELS: Record<string, string> = { todo: 'К выполнению', in_progress: 'В работе', review: 'Ревью', done: 'Готово' };

const PRIORITY_COLORS: Record<string, string> = {
  low: 'text-gray-400',
  medium: 'text-blue-500',
  high: 'text-orange-500',
  critical: 'text-red-500',
};

const PRIORITY_LABELS: Record<string, string> = { low: 'Низкий', medium: 'Средний', high: 'Высокий', critical: 'Критический' };

export default function Tasks() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [filters, setFilters] = useState({ project_id: '', status: '', priority: '', assignee_id: '' });
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ project_id: '', title: '', description: '', priority: 'medium', assignee_id: '', due_date: '' });
  const [saving, setSaving] = useState(false);

  const canCreate = user?.role === 'admin' || user?.role === 'manager';

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 15 };
      if (search) params.q = search;
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      const data = await getTasks(params);
      setTasks(data.data);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, [page, search, filters]);
  useEffect(() => {
    getProjects().then(d => setProjects(d.data));
    getUsers().then(setUsers);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.project_id) { toast.error('Заполните обязательные поля'); return; }
    setSaving(true);
    try {
      await createTask({
        project_id: parseInt(form.project_id),
        title: form.title,
        description: form.description || undefined,
        priority: form.priority as Task['priority'],
        assignee_id: form.assignee_id ? parseInt(form.assignee_id) : undefined,
        due_date: form.due_date || undefined,
      });
      toast.success('Задача создана');
      setModalOpen(false);
      fetchTasks();
    } catch {
      toast.error('Ошибка создания задачи');
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.ceil(total / 15);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Задачи</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{total} задач</p>
        </div>
        {canCreate && (
          <button onClick={() => setModalOpen(true)} className="btn-primary">
            <Plus size={16} /> Новая задача
          </button>
        )}
      </div>

      {/* Поиск и фильтры */}
      <div className="card p-4 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Поиск по названию..."
            className="input pl-9"
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select value={filters.project_id} onChange={e => { setFilters(p => ({ ...p, project_id: e.target.value })); setPage(1); }} className="input pl-8 text-sm">
              <option value="">Все проекты</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <select value={filters.status} onChange={e => { setFilters(p => ({ ...p, status: e.target.value })); setPage(1); }} className="input text-sm">
            <option value="">Все статусы</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={filters.priority} onChange={e => { setFilters(p => ({ ...p, priority: e.target.value })); setPage(1); }} className="input text-sm">
            <option value="">Все приоритеты</option>
            {Object.entries(PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={filters.assignee_id} onChange={e => { setFilters(p => ({ ...p, assignee_id: e.target.value })); setPage(1); }} className="input text-sm">
            <option value="">Все исполнители</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-primary-800 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Задача</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Проект</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Статус</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Приоритет</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Исполнитель</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden xl:table-cell">Срок</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(t => (
                <tr
                  key={t.id}
                  onClick={() => navigate(`/tasks/${t.id}`)}
                  className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className={clsx('w-2 h-2 rounded-full flex-shrink-0', {
                        'bg-gray-400': t.priority === 'low',
                        'bg-blue-500': t.priority === 'medium',
                        'bg-orange-500': t.priority === 'high',
                        'bg-red-500': t.priority === 'critical',
                      })} />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1">{t.title}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{t.project_name}</span>
                  </td>
                  <td className="px-5 py-3.5 hidden sm:table-cell">
                    <span className={clsx('badge', STATUS_COLORS[t.status])}>{STATUS_LABELS[t.status]}</span>
                  </td>
                  <td className={clsx('px-5 py-3.5 hidden lg:table-cell text-sm font-medium', PRIORITY_COLORS[t.priority])}>
                    {PRIORITY_LABELS[t.priority]}
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell">
                    {t.assignee_name ? (
                      <div className="flex items-center gap-2">
                        <img src={t.assignee_avatar || `https://i.pravatar.cc/150?u=${t.assignee_id}`} className="w-5 h-5 rounded-full" alt="" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">{t.assignee_name}</span>
                      </div>
                    ) : <span className="text-gray-300 dark:text-gray-600 text-sm">—</span>}
                  </td>
                  <td className="px-5 py-3.5 hidden xl:table-cell text-sm text-gray-500">
                    {t.due_date ? new Date(t.due_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : '—'}
                  </td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">Задачи не найдены</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-3 py-2 disabled:opacity-50">←</button>
          <span className="text-sm text-gray-500">Стр. {page} из {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary px-3 py-2 disabled:opacity-50">→</button>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Новая задача">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Проект *</label>
            <select value={form.project_id} onChange={e => setForm(p => ({ ...p, project_id: e.target.value }))} className="input" required>
              <option value="">Выберите проект</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Название *</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="input" placeholder="Что нужно сделать?" required />
          </div>
          <div>
            <label className="label">Описание</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="input min-h-[80px] resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Приоритет</label>
              <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} className="input">
                <option value="low">Низкий</option>
                <option value="medium">Средний</option>
                <option value="high">Высокий</option>
                <option value="critical">Критический</option>
              </select>
            </div>
            <div>
              <label className="label">Срок</label>
              <input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} className="input" />
            </div>
          </div>
          <div>
            <label className="label">Исполнитель</label>
            <select value={form.assignee_id} onChange={e => setForm(p => ({ ...p, assignee_id: e.target.value }))} className="input">
              <option value="">Не назначен</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Создать'}
            </button>
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1 justify-center">Отмена</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
