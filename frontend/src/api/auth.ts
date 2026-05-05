import api from './axios';

export interface User {
  id: number;
  email: string;
  full_name: string;
  position: string | null;
  role: 'admin' | 'manager' | 'employee';
  avatar_url: string | null;
  created_at: string;
}

export async function login(email: string, password: string) {
  const res = await api.post<{ token: string; user: User }>('/auth/login', { email, password });
  return res.data;
}

export async function getMe() {
  const res = await api.get<User>('/auth/me');
  return res.data;
}

export async function logout() {
  await api.post('/auth/logout');
}
