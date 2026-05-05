import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Sun, Moon, Search, LogOut, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';

interface TopbarProps {
  onMenuClick: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/tasks?q=${encodeURIComponent(search.trim())}`);
      setSearch('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-10 h-16 bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 gap-4">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <Menu size={20} />
      </button>

      {/* Поиск */}
      <form onSubmit={handleSearch} className="flex-1 max-w-md">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск задач..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
          />
        </div>
      </form>

      <div className="flex items-center gap-2 ml-auto">
        <button className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-400">
          <Bell size={18} />
        </button>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title={isDark ? 'Светлая тема' : 'Тёмная тема'}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />

        <div className="flex items-center gap-2">
          <img
            src={user?.avatar_url || `https://i.pravatar.cc/150?u=${user?.email}`}
            alt={user?.full_name}
            className="w-8 h-8 rounded-full object-cover cursor-pointer ring-2 ring-primary-800/20"
            onClick={() => navigate('/profile')}
          />
          <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300">
            {user?.full_name?.split(' ')[0]}
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
          title="Выйти"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
