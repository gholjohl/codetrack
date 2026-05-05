import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Briefcase, Shield, Key } from 'lucide-react';
import toast from 'react-hot-toast';
import { getTasks } from '../api/tasks';
import type { Task } from '../api/tasks';
import { updateUser } from '../api/users';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import clsx from 'clsx';

const ROLE_LABELS: Record<string, string> = { admin: 'Администратор', manager: 'Менеджер', employee: 'Сотрудник' };
const STATUS_LABELS: Record<string, string> = { todo: 'К выполнению', in_progress: 'В работе', review: 'Ревью', done: 'Готово' };
const STATUS_COLORS: Record<string, string> = {
  todo: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  review: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  done: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

export default function Profile() {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [passModal, setPassModal] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    getTasks({ assignee_id: user.id, limit: 20 })
      .then(d => setTasks(d.data))
      .finally(() => setLoading(false));
  }, [user]);

  const activeTasks = tasks.filter(t => t.status !== 'done');
  const doneTasks = tasks.filter(t => t.status === 'done');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.next !== passwords.confirm) { toast.error('Пароли не совпадают'); return; }
    if (passwords.next.length < 6) { toast.error('Минимум 6 символов'); return; }
    setSaving(true);
    try {
      await updateUser(user!.id, { password: passwords.next });
      toast.success('Пароль изменён');
      setPassModal(false);
      setPasswords({ current: '', next: '', confirm: '' });
    } catch {
      toast.error('Ошибка смены пароля');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl space-y-5">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Профиль</h1>

      <div className="card p-6">
        <div className="flex items-start gap-5">
          <img
            src={user.avatar_url || `https://i.pravatar.cc/150?u=${user.email}`}
            alt={user.full_name}
            className="w-20 h-20 rounded-2xl object-cover ring-4 ring-primary-800/10 flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user.full_name}</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{user.position || 'Должность не указана'}</p>
            <div className="flex flex-wrap gap-3 mt-3">
              <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                <Mail size={14} />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                <Shield size={14} />
                <span>{ROLE_LABELS[user.role]}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                <Briefcase size={14} />
                <span>С {new Date(user.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            </div>
          </div>
          <button onClick={() => setPassModal(true)} className="btn-secondary flex-shrink-0">
            <Key size={15} /> Сменить пароль
          </button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Всего задач', value: tasks.length },
          { label: 'Активных', value: activeTasks.length },
          { label: 'Завершено', value: doneTasks.length },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{s.value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Активные задачи */}
      <div className="card p-5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Мои активные задачи</h3>
        {loading ? (
          <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary-800 border-t-transparent rounded-full animate-spin" /></div>
        ) : activeTasks.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Нет активных задач</p>
        ) : (
          <div className="space-y-2">
            {activeTasks.map(t => (
              <div
                key={t.id}
                onClick={() => navigate(`/tasks/${t.id}`)}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{t.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{t.project_name}</p>
                </div>
                <span className={clsx('badge', STATUS_COLORS[t.status])}>{STATUS_LABELS[t.status]}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={passModal} onClose={() => setPassModal(false)} title="Смена пароля" size="sm">
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="label">Новый пароль</label>
            <input type="password" value={passwords.next} onChange={e => setPasswords(p => ({ ...p, next: e.target.value }))} className="input" placeholder="Минимум 6 символов" />
          </div>
          <div>
            <label className="label">Подтверждение пароля</label>
            <input type="password" value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} className="input" placeholder="Повторите пароль" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Изменить'}
            </button>
            <button type="button" onClick={() => setPassModal(false)} className="btn-secondary flex-1 justify-center">Отмена</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
