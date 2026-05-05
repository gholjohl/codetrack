import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderKanban, Calendar, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { getProjects, createProject, updateProject } from '../api/projects';
import type { Project } from '../api/projects';
import { getUsers } from '../api/users';
import type { User } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import clsx from 'clsx';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  paused: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  archived: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Активный',
  paused: 'На паузе',
  completed: 'Завершён',
  archived: 'Архив',
};

export default function Projects() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState({ name: '', description: '', status: 'active', owner_id: '', deadline: '' });
  const [saving, setSaving] = useState(false);

  const canManage = user?.role === 'admin' || user?.role === 'manager';

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filter) params.status = filter;
      const data = await getProjects(params);
      setProjects(data.data);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, [filter]);

  useEffect(() => {
    if (modalOpen) getUsers().then(setUsers);
  }, [modalOpen]);

  const openCreate = () => {
    setEditProject(null);
    setForm({ name: '', description: '', status: 'active', owner_id: String(user?.id || ''), deadline: '' });
    setModalOpen(true);
  };

  const openEdit = (p: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditProject(p);
    setForm({ name: p.name, description: p.description || '', status: p.status, owner_id: String(p.owner_id), deadline: p.deadline || '' });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Название обязательно'); return; }
    setSaving(true);
    try {
      const payload = { ...form, owner_id: form.owner_id ? parseInt(form.owner_id) : undefined };
      if (editProject) {
        const updated = await updateProject(editProject.id, payload);
        setProjects(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p));
        toast.success('Проект обновлён');
      } else {
        await createProject(payload);
        toast.success('Проект создан');
        await fetchProjects();
      }
      setModalOpen(false);
    } catch {
      toast.error('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Проекты</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{total} проектов всего</p>
        </div>
        {canManage && (
          <button onClick={openCreate} className="btn-primary">
            <Plus size={16} /> Новый проект
          </button>
        )}
      </div>

      {/* Фильтры по статусу */}
      <div className="flex gap-2 flex-wrap">
        {['', 'active', 'paused', 'completed', 'archived'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={clsx(
              'px-3 py-1.5 rounded-xl text-sm font-medium transition-all',
              filter === s
                ? 'bg-primary-800 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-primary-400'
            )}
          >
            {s === '' ? 'Все' : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary-800 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Проект</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Статус</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Владелец</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Дедлайн</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Задач</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {projects.map(p => (
                <tr
                  key={p.id}
                  onClick={() => navigate(`/projects/${p.id}`)}
                  className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary-800/10 dark:bg-primary-800/20 flex items-center justify-center flex-shrink-0">
                        <FolderKanban size={16} className="text-primary-700 dark:text-primary-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{p.name}</p>
                        {p.description && (
                          <p className="text-xs text-gray-400 truncate max-w-xs hidden sm:block">{p.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className={clsx('badge', STATUS_COLORS[p.status])}>{STATUS_LABELS[p.status]}</span>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <div className="flex items-center gap-2">
                      <img src={p.owner_avatar || `https://i.pravatar.cc/150?u=${p.owner_id}`} className="w-6 h-6 rounded-full" alt="" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">{p.owner_name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    {p.deadline ? (
                      <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Calendar size={13} />
                        {new Date(p.deadline).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{p.task_count || 0}</span>
                  </td>
                  <td className="px-3 py-4">
                    {canManage && (
                      <button
                        onClick={e => openEdit(p, e)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <ChevronRight size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {projects.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-400">Проекты не найдены</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editProject ? 'Редактировать проект' : 'Новый проект'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Название *</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="input" placeholder="Название проекта" required />
          </div>
          <div>
            <label className="label">Описание</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="input min-h-[80px] resize-none" placeholder="Краткое описание" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Статус</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="input">
                <option value="active">Активный</option>
                <option value="paused">На паузе</option>
                <option value="completed">Завершён</option>
                <option value="archived">Архив</option>
              </select>
            </div>
            <div>
              <label className="label">Дедлайн</label>
              <input type="date" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} className="input" />
            </div>
          </div>
          <div>
            <label className="label">Владелец</label>
            <select value={form.owner_id} onChange={e => setForm(p => ({ ...p, owner_id: e.target.value }))} className="input">
              {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Сохранить'}
            </button>
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1 justify-center">Отмена</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
