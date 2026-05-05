import type { Task } from '../api/tasks';
import TaskCard from './TaskCard';

interface KanbanBoardProps {
  tasks: Task[];
  onAdvance: (task: Task) => void;
}

const COLUMNS = [
  { key: 'todo', label: 'К выполнению', color: 'bg-gray-400' },
  { key: 'in_progress', label: 'В работе', color: 'bg-blue-500' },
  { key: 'review', label: 'Ревью', color: 'bg-yellow-500' },
  { key: 'done', label: 'Готово', color: 'bg-green-500' },
] as const;

export default function KanbanBoard({ tasks, onAdvance }: KanbanBoardProps) {
  const byStatus = (status: string) => tasks.filter(t => t.status === status);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {COLUMNS.map(col => {
        const colTasks = byStatus(col.key);
        return (
          <div key={col.key} className="flex flex-col gap-3">
            <div className="flex items-center gap-2 px-1">
              <span className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{col.label}</span>
              <span className="ml-auto text-xs font-medium text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                {colTasks.length}
              </span>
            </div>
            <div className="flex flex-col gap-2 min-h-[120px]">
              {colTasks.map(task => (
                <TaskCard key={task.id} task={task} onAdvance={col.key !== 'done' ? onAdvance : undefined} />
              ))}
              {colTasks.length === 0 && (
                <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-4 text-center text-sm text-gray-400">
                  Нет задач
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
