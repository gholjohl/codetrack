import { useNavigate } from 'react-router-dom';
import { Calendar, ArrowRight } from 'lucide-react';
import type { Task } from '../api/tasks';
import clsx from 'clsx';

interface TaskCardProps {
  task: Task;
  onAdvance?: (task: Task) => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-400',
  medium: 'bg-blue-500',
  high: 'bg-orange-500',
  critical: 'bg-red-500',
};

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
  critical: 'Критический',
};

const STATUS_NEXT: Record<string, string> = {
  todo: 'in_progress',
  in_progress: 'review',
  review: 'done',
};

export default function TaskCard({ task, onAdvance }: TaskCardProps) {
  const navigate = useNavigate();
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
  const nextStatus = STATUS_NEXT[task.status];

  return (
    <div
      className="card p-3 cursor-pointer hover:shadow-md transition-all duration-200 group"
      onClick={() => navigate(`/tasks/${task.id}`)}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <span className={clsx('w-2 h-2 rounded-full flex-shrink-0', PRIORITY_COLORS[task.priority])} title={PRIORITY_LABELS[task.priority]} />
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug">{task.title}</p>
        </div>
        {nextStatus && onAdvance && (
          <button
            onClick={e => { e.stopPropagation(); onAdvance(task); }}
            className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-600 transition-all flex-shrink-0"
            title={`Перевести в ${nextStatus}`}
          >
            <ArrowRight size={14} />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between mt-3">
        {task.assignee_avatar || task.assignee_name ? (
          <div className="flex items-center gap-1.5">
            <img
              src={task.assignee_avatar || `https://i.pravatar.cc/150?u=${task.assignee_id}`}
              alt={task.assignee_name || ''}
              className="w-5 h-5 rounded-full object-cover"
            />
            <span className="text-xs text-gray-400 truncate max-w-[80px]">{task.assignee_name?.split(' ')[0]}</span>
          </div>
        ) : (
          <span className="text-xs text-gray-300 dark:text-gray-600">Не назначен</span>
        )}

        {task.due_date && (
          <div className={clsx('flex items-center gap-1 text-xs', isOverdue ? 'text-red-500' : 'text-gray-400')}>
            <Calendar size={11} />
            <span>{new Date(task.due_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</span>
          </div>
        )}
      </div>
    </div>
  );
}
