import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Calendar, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import { getProject } from '../api/projects';
import { createTask, updateTask } from '../api/tasks';
import type { Task } from '../api/tasks';
import type { ProjectWithTasks } from '../api/projects';
import { getUsers } from '../api/users';
import type { User } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import KanbanBoard from '../components/KanbanBoard';
import Modal from '../components/Modal';
import clsx from 'clsx';

const STATUS_LABELS: Record<string, string> = {
  active: 'Активный', paused: 'На паузе', completed: 'Завершён', archived: 'Архив',
};
const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  paused: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  archived: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
};

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<ProjectWithTasks | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskModal, setTaskModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', assignee_id: '', due_date: '' });
  const [saving, setSaving] = useState(false);

  const canManage = user?.role === 'admin' || user?.role === 'manager';

  const fetchProject = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getProject(parseInt(id));
      setProject(data);
    } catch {
      toast.error('Проект не найден');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProject(); }, [id]);
  useEffect(() => { if (taskModal) getUsers().then(setUsers); }, [taskModal]);

  const handleAdvance = async (task: Task) => {
    const nextMap: Record<string, string> = { todo: 'in_progress', in_progress: 'review', review: 'done' };
    const next = nextMap[task.status];
    if (!next) return;
    try {
      await updateTask(task.id, { status: next as Task['status'] });
      setProject(p => p ? { ...p, tasks: p.tasks.map(t => t.id === task.id ? { ...t, status: next as Task['status'] } : t) } : p);
      toast.success('Статус обновлён');
    } catch {
      toast.error('Ошибка обновления');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Введите название'); return; }
    setSaving(true);
    try {
      const task = await createTask({
        project_id: parseInt(id!),
        title: form.title,
        description: form.description || undefined,
        priority: form.priority as Task['priority'],
        assignee_id: form.assignee_id ? parseInt(form.assignee_id) : undefined,
        due_date: form.due_date || undefined,
      });
      setProject(p => p ? { ...p, tasks: [task, ...p.tasks] } : p);
      toast.success('Задача создана');
      setTaskModal(false);
      setForm({ title: '', description: '', priority: 'medium', assignee_id: '', due_date: '' });
    } catch {
      toast.error('Ошибка создания задачи');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-32">
      <div className="w-8 h-8 border-2 border-primary-800 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!project) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button onClick={() => navigate('/projects')} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors mt-0.5">
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
              <span className={clsx('badge', STATUS_COLORS[project.status])}>{STATUS_LABELS[project.status]}</span>
            </div>
            {project.description && <p className="text-gray-500 dark:text-gray-400">{project.description}</p>}
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
              <div className="flex items-center gap-1.5">
                <img src={project.owner_avatar || `https://i.pravatar.cc/150?u=${project.owner_id}`} className="w-5 h-5 rounded-full" alt="" />
                <span>{project.owner_name}</span>
              </div>
              {project.deadline && (
                <div className="flex items-center gap-1">
                  <Calendar size={13} />
                  <span>{new Date(project.deadline).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Layers size={13} />
                <span>{project.tasks.length} задач</span>
              </div>
            </div>
          </div>
        </div>
        {canManage && (
          <button onClick={() => setTaskModal(true)} className="btn-primary flex-shrink-0">
            <Plus size={16} /> Задача
          </button>
        )}
      </div>

      <KanbanBoard tasks={project.tasks} onAdvance={handleAdvance} />

      <Modal open={taskModal} onClose={() => setTaskModal(false)} title="Новая задача">
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="label">Название *</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="input" placeholder="Что нужно сделать?" required />
          </div>
          <div>
            <label className="label">Описание</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="input min-h-[80px] resize-none" placeholder="Подробное описание..." />
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
            <button type="button" onClick={() => setTaskModal(false)} className="btn-secondary flex-1 justify-center">Отмена</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
