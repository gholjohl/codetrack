import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Flag, User2, Send, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getTask, updateTask, getComments, addComment, deleteComment } from '../api/tasks';
import { getUsers } from '../api/users';
import type { Task, Comment } from '../api/tasks';
import type { User } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';

const STATUS_NEXT: Record<string, string> = { todo: 'in_progress', in_progress: 'review', review: 'done' };
const STATUS_LABELS: Record<string, string> = { todo: 'К выполнению', in_progress: 'В работе', review: 'Ревью', done: 'Готово' };
const STATUS_COLORS: Record<string, string> = {
  todo: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  review: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  done: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};
const PRIORITY_DOT: Record<string, string> = {
  low: 'bg-gray-400', medium: 'bg-blue-500', high: 'bg-orange-500', critical: 'bg-red-500',
};
const PRIORITY_LABELS: Record<string, string> = { low: 'Низкий', medium: 'Средний', high: 'Высокий', critical: 'Критический' };

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      getTask(parseInt(id)),
      getComments(parseInt(id)),
      getUsers(),
    ]).then(([t, c, u]) => {
      setTask(t);
      setComments(c);
      setUsers(u);
    }).catch(() => {
      toast.error('Задача не найдена');
      navigate('/tasks');
    }).finally(() => setLoading(false));
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!task) return;
    try {
      const updated = await updateTask(task.id, { status: newStatus as Task['status'] });
      setTask(updated);
      toast.success('Статус обновлён');
    } catch { toast.error('Ошибка'); }
  };

  const handleAssigneeChange = async (assigneeId: string) => {
    if (!task) return;
    try {
      const updated = await updateTask(task.id, { assignee_id: assigneeId ? parseInt(assigneeId) : null });
      setTask(updated);
      toast.success('Исполнитель обновлён');
    } catch { toast.error('Ошибка'); }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !id) return;
    setSubmitting(true);
    try {
      const c = await addComment(parseInt(id), commentText);
      setComments(prev => [...prev, c]);
      setCommentText('');
    } catch { toast.error('Ошибка добавления комментария'); }
    finally { setSubmitting(false); }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      await deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch { toast.error('Ошибка удаления'); }
  };

  if (loading) return (
    <div className="flex justify-center py-32">
      <div className="w-8 h-8 border-2 border-primary-800 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!task) return null;

  const nextStatus = STATUS_NEXT[task.status];

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <span className="text-sm text-gray-400">{task.project_name} / #{task.id}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Основная информация */}
        <div className="lg:col-span-2 space-y-5">
          <div className="card p-5">
            <div className="flex items-start gap-2 mb-3">
              <span className={clsx('w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0', PRIORITY_DOT[task.priority])} />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-snug">{task.title}</h1>
            </div>
            {task.description ? (
              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">{task.description}</p>
            ) : (
              <p className="text-gray-400 italic">Описание не добавлено</p>
            )}
          </div>

          {/* Комментарии */}
          <div className="card p-5">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Комментарии ({comments.length})</h3>
            <div className="space-y-4 mb-5">
              {comments.map(c => (
                <div key={c.id} className="flex gap-3">
                  <img src={c.avatar_url || `https://i.pravatar.cc/150?u=${c.user_id}`} alt={c.full_name} className="w-8 h-8 rounded-full flex-shrink-0 mt-0.5" />
                  <div className="flex-1 bg-gray-50 dark:bg-gray-700/50 rounded-xl px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{c.full_name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                          {new Date(c.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {(user?.id === c.user_id || user?.role === 'admin') && (
                          <button onClick={() => handleDeleteComment(c.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{c.body}</p>
                  </div>
                </div>
              ))}
              {comments.length === 0 && <p className="text-sm text-gray-400 text-center py-3">Комментариев пока нет</p>}
            </div>

            <form onSubmit={handleComment} className="flex gap-3">
              <img src={user?.avatar_url || `https://i.pravatar.cc/150?u=${user?.email}`} className="w-8 h-8 rounded-full flex-shrink-0" alt="" />
              <div className="flex-1 flex gap-2">
                <input
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Написать комментарий..."
                  className="input flex-1 text-sm"
                />
                <button type="submit" disabled={!commentText.trim() || submitting} className="btn-primary px-3">
                  <Send size={15} />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Метаданные */}
        <div className="space-y-4">
          <div className="card p-4 space-y-4">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Статус</p>
              <select
                value={task.status}
                onChange={e => handleStatusChange(e.target.value)}
                className={clsx('input text-sm font-medium', STATUS_COLORS[task.status])}
              >
                {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              {nextStatus && (
                <button onClick={() => handleStatusChange(nextStatus)} className="mt-2 text-xs text-primary-600 dark:text-primary-400 hover:underline">
                  → Перевести в «{STATUS_LABELS[nextStatus]}»
                </button>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                <Flag size={12} className="inline mr-1" />Приоритет
              </p>
              <div className="flex items-center gap-2">
                <span className={clsx('w-2.5 h-2.5 rounded-full', PRIORITY_DOT[task.priority])} />
                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{PRIORITY_LABELS[task.priority]}</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                <User2 size={12} className="inline mr-1" />Исполнитель
              </p>
              <select value={task.assignee_id || ''} onChange={e => handleAssigneeChange(e.target.value)} className="input text-sm">
                <option value="">Не назначен</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
              </select>
            </div>

            {task.due_date && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  <Calendar size={12} className="inline mr-1" />Срок
                </p>
                <p className={clsx('text-sm font-medium', new Date(task.due_date) < new Date() && task.status !== 'done' ? 'text-red-500' : 'text-gray-700 dark:text-gray-300')}>
                  {new Date(task.due_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            )}

            {task.reporter_name && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Автор</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{task.reporter_name}</p>
              </div>
            )}

            <div className="pt-2 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400 space-y-1">
              <p>Создана: {new Date(task.created_at).toLocaleDateString('ru-RU')}</p>
              <p>Обновлена: {new Date(task.updated_at).toLocaleDateString('ru-RU')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
