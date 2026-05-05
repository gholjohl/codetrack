import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { getUsers, createUser, updateUser, deleteUser } from '../api/users';
import type { User } from '../api/auth';
import Modal from '../components/Modal';
import clsx from 'clsx';

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  manager: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  employee: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
};
const ROLE_LABELS: Record<string, string> = { admin: 'Администратор', manager: 'Менеджер', employee: 'Сотрудник' };

const EMPTY_FORM = { email: '', password: '', full_name: '', position: '', role: 'employee' };

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [filtered, setFiltered] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
      setFiltered(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    if (!search) { setFiltered(users); return; }
    const q = search.toLowerCase();
    setFiltered(users.filter(u => u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.position || '').toLowerCase().includes(q)));
  }, [search, users]);

  const openCreate = () => {
    setEditUser(null);
    setForm({ ...EMPTY_FORM });
    setModalOpen(true);
  };

  const openEdit = (u: User) => {
    setEditUser(u);
    setForm({ email: u.email, password: '', full_name: u.full_name, position: u.position || '', role: u.role });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.email.trim()) { toast.error('Заполните обязательные поля'); return; }
    if (!editUser && !form.password) { toast.error('Пароль обязателен при создании'); return; }
    setSaving(true);
    try {
      if (editUser) {
        const payload: Record<string, string> = { full_name: form.full_name, position: form.position, role: form.role };
        if (form.password) payload.password = form.password;
        const updated = await updateUser(editUser.id, payload);
        setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
        toast.success('Пользователь обновлён');
      } else {
        const created = await createUser({ email: form.email, password: form.password, full_name: form.full_name, position: form.position, role: form.role });
        setUsers(prev => [...prev, created]);
        toast.success('Пользователь создан');
      }
      setModalOpen(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Ошибка';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteUser(deleteConfirm.id);
      setUsers(prev => prev.filter(u => u.id !== deleteConfirm.id));
      toast.success('Пользователь удалён');
      setDeleteConfirm(null);
    } catch {
      toast.error('Ошибка удаления');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Пользователи</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{users.length} аккаунтов</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={16} /> Добавить
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по имени, email или должности..." className="input pl-9" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-primary-800 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Пользователь</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Должность</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Роль</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Зарегистрирован</th>
                <th className="w-24" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <img src={u.avatar_url || `https://i.pravatar.cc/150?u=${u.email}`} className="w-9 h-9 rounded-full object-cover" alt="" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{u.full_name}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{u.position || '—'}</span>
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <span className={clsx('badge', ROLE_COLORS[u.role])}>{ROLE_LABELS[u.role]}</span>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell text-sm text-gray-400">
                    {new Date(u.created_at).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 transition-colors">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => setDeleteConfirm(u)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-gray-400">Пользователи не найдены</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Модалка создания/редактирования */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editUser ? 'Редактировать пользователя' : 'Новый пользователь'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Имя *</label>
            <input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} className="input" placeholder="Полное имя" required />
          </div>
          {!editUser && (
            <div>
              <label className="label">Email *</label>
              <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="input" placeholder="email@codecraft.kz" required />
            </div>
          )}
          <div>
            <label className="label">{editUser ? 'Новый пароль (оставьте пустым)' : 'Пароль *'}</label>
            <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} className="input" placeholder="Минимум 6 символов" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Должность</label>
              <input value={form.position} onChange={e => setForm(p => ({ ...p, position: e.target.value }))} className="input" placeholder="Backend Developer" />
            </div>
            <div>
              <label className="label">Роль</label>
              <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} className="input">
                <option value="employee">Сотрудник</option>
                <option value="manager">Менеджер</option>
                <option value="admin">Администратор</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Сохранить'}
            </button>
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1 justify-center">Отмена</button>
          </div>
        </form>
      </Modal>

      {/* Подтверждение удаления */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Удалить пользователя?" size="sm">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
          Вы уверены, что хотите удалить <strong>{deleteConfirm?.full_name}</strong>? Это действие нельзя отменить.
        </p>
        <div className="flex gap-3">
          <button onClick={handleDelete} className="btn-danger flex-1 justify-center">Удалить</button>
          <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1 justify-center">Отмена</button>
        </div>
      </Modal>
    </div>
  );
}
