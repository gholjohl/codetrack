import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, PieChart, Pie, Cell, Tooltip, ResponsiveContainer, XAxis, YAxis, Legend } from 'recharts';
import { FolderKanban, CheckSquare, Clock, TrendingUp, Activity } from 'lucide-react';
import { getOverview, getWorkload, getActivity } from '../api/stats';
import type { StatsOverview, WorkloadItem, ActivityItem } from '../api/stats';
import clsx from 'clsx';

const STATUS_COLORS: Record<string, string> = {
  todo: '#94a3b8',
  in_progress: '#3b82f6',
  review: '#f59e0b',
  done: '#10b981',
};

const STATUS_LABELS: Record<string, string> = {
  todo: 'К выполнению',
  in_progress: 'В работе',
  review: 'Ревью',
  done: 'Готово',
};

const ACTION_LABELS: Record<string, string> = {
  created: 'создал(а)',
  status_changed: 'изменил(а) статус',
  updated: 'обновил(а)',
};

function MetricCard({ icon: Icon, label, value, sub, color }: { icon: React.ElementType; label: string; value: number; sub?: string; color: string }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', color)}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-1">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<StatsOverview | null>(null);
  const [workload, setWorkload] = useState<WorkloadItem[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getOverview(), getWorkload(), getActivity(5)])
      .then(([ov, wl, act]) => {
        setOverview(ov);
        setWorkload(wl);
        setActivity(act);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-primary-800 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const pieData = overview?.tasks_by_status.map(s => ({
    name: STATUS_LABELS[s.status] || s.status,
    value: s.count,
    color: STATUS_COLORS[s.status] || '#94a3b8',
  })) || [];

  const workloadTop = workload.slice(0, 8).map(w => ({
    name: w.full_name.split(' ')[0],
    todo: w.todo,
    in_progress: w.in_progress,
    review: w.review,
    done: w.done,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Дашборд</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Обзор активности команды</p>
      </div>

      {/* Метрики */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard icon={FolderKanban} label="Всего проектов" value={overview?.total_projects || 0} color="bg-primary-800" />
        <MetricCard icon={CheckSquare} label="Всего задач" value={overview?.total_tasks || 0} color="bg-accent-500" />
        <MetricCard icon={Clock} label="Мои активные" value={overview?.my_active_tasks || 0} sub="todo + в работе + ревью" color="bg-orange-500" />
        <MetricCard icon={TrendingUp} label="Завершено за неделю" value={overview?.completed_this_week || 0} color="bg-purple-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie chart — статусы */}
        <div className="card p-5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Задачи по статусам</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(val: number, name: string) => [val, name]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar chart — нагрузка */}
        <div className="card p-5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Нагрузка по сотрудникам</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={workloadTop} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="todo" stackId="a" fill="#94a3b8" name="К выполнению" radius={[0, 0, 0, 0]} />
              <Bar dataKey="in_progress" stackId="a" fill="#3b82f6" name="В работе" />
              <Bar dataKey="review" stackId="a" fill="#f59e0b" name="Ревью" />
              <Bar dataKey="done" stackId="a" fill="#10b981" name="Готово" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Последние действия */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={18} className="text-gray-400" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Последние действия</h3>
        </div>
        <div className="space-y-3">
          {activity.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">Нет активности</p>
          )}
          {activity.map(item => {
            const meta = item.meta ? JSON.parse(item.meta) : {};
            return (
              <div key={item.id} className="flex items-start gap-3">
                <img
                  src={item.avatar_url || `https://i.pravatar.cc/150?u=${item.user_id}`}
                  alt={item.full_name}
                  className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">{item.full_name}</span>
                    {' '}{ACTION_LABELS[item.action] || item.action}{' '}
                    <button
                      onClick={() => navigate(`/${item.entity_type}s/${item.entity_id}`)}
                      className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
                    >
                      {item.entity_type === 'task' ? meta.title : meta.name || `#${item.entity_id}`}
                    </button>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(item.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
