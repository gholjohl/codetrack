import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, Code2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { login as apiLogin } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { Sun, Moon } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!email) e.email = 'Введите email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Некорректный email';
    if (!password) e.password = 'Введите пароль';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const data = await apiLogin(email, password);
      login(data.token, data.user);
      toast.success(`Добро пожаловать, ${data.user.full_name.split(' ')[0]}!`);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Ошибка входа';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex dark:bg-dark-900">
      {/* Левая колонка — брендинг */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-800 to-primary-900 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-accent-500/30 blur-3xl" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Code2 size={22} className="text-white" />
            </div>
            <span className="text-2xl font-bold text-white">CodeTrack</span>
          </div>
          <p className="text-primary-200 text-sm">TOO Codecraft × Keden Group</p>
        </div>

        <div className="relative">
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Управляй<br />проектами<br />эффективно
          </h1>
          <p className="text-primary-200 text-lg leading-relaxed">
            Централизованный учёт задач, прозрачная нагрузка команды и аналитика в реальном времени.
          </p>
        </div>

        <div className="relative grid grid-cols-3 gap-4">
          {[
            { label: 'Проектов', value: '4+' },
            { label: 'Задач', value: '30+' },
            { label: 'Сотрудников', value: '12' },
          ].map(stat => (
            <div key={stat.label} className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-primary-200 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Правая колонка — форма */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="lg:hidden">
              <span className="text-2xl font-bold text-primary-800 dark:text-primary-400">Code</span>
              <span className="text-2xl font-bold text-accent-500">Track</span>
            </div>
            <button onClick={toggleTheme} className="ml-auto p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Вход в систему</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Используйте корпоративный аккаунт</p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: undefined })); }}
                placeholder="имя@codecraft.kz"
                className={`input ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                autoComplete="email"
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>

            <div>
              <label className="label">Пароль</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: undefined })); }}
                  placeholder="••••••••"
                  className={`input pr-10 ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 mt-2">
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={16} />
                  Войти
                </>
              )}
            </button>
          </form>

          <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">Тестовые аккаунты:</p>
            <div className="space-y-1">
              {[
                { email: 'admin@codecraft.kz', label: 'Admin' },
                { email: 'aidar.bekov@codecraft.kz', label: 'Manager' },
                { email: 'nurlan.kassymov@codecraft.kz', label: 'Employee' },
              ].map(acc => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => { setEmail(acc.email); setPassword(acc.label === 'Admin' ? 'admin123' : 'password123'); }}
                  className="flex items-center justify-between w-full text-xs text-left p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="text-gray-600 dark:text-gray-300">{acc.email}</span>
                  <span className="text-gray-400 dark:text-gray-500 bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded-full">{acc.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
