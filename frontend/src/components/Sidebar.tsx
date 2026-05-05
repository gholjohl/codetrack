import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, CheckSquare, Users, User, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Дашборд' },
  { to: '/projects', icon: FolderKanban, label: 'Проекты' },
  { to: '/tasks', icon: CheckSquare, label: 'Задачи' },
  { to: '/profile', icon: User, label: 'Профиль' },
];

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { user } = useAuth();

  return (
    <>
      {/* Overlay на мобильных */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={clsx(
        'fixed top-0 left-0 h-full w-64 z-30 flex flex-col',
        'bg-white dark:bg-dark-800 border-r border-gray-200 dark:border-gray-700',
        'transition-transform duration-300 ease-in-out',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Лого */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <div>
            <span className="text-xl font-bold text-primary-800 dark:text-primary-400">Code</span>
            <span className="text-xl font-bold text-accent-500">Track</span>
            <p className="text-xs text-gray-400 mt-0.5">TOO Codecraft</p>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <X size={18} />
          </button>
        </div>

        {/* Навигация */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary-800 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
              )}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}

          {user?.role === 'admin' && (
            <NavLink
              to="/admin/users"
              onClick={onClose}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary-800 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
              )}
            >
              <Users size={18} />
              Пользователи
            </NavLink>
          )}
        </nav>

        {/* Пользователь */}
        <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <img
              src={user?.avatar_url || `https://i.pravatar.cc/150?u=${user?.email}`}
              alt={user?.full_name}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-primary-800/20"
            />
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user?.full_name}</p>
              <p className="text-xs text-gray-400 truncate">{user?.position || user?.role}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
