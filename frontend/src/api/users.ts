import api from './axios';
import type { User } from './auth';

export async function getUsers() {
  const res = await api.get<User[]>('/users');
  return res.data;
}

export async function getUser(id: number) {
  const res = await api.get<User>(`/users/${id}`);
  return res.data;
}

export async function createUser(data: { email: string; password: string; full_name: string; position?: string; role: string }) {
  const res = await api.post<User>('/users', data);
  return res.data;
}

export async function updateUser(id: number, data: Partial<User> & { password?: string }) {
  const res = await api.patch<User>(`/users/${id}`, data);
  return res.data;
}

export async function deleteUser(id: number) {
  await api.delete(`/users/${id}`);
}
