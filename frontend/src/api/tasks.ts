import api from './axios';

export interface Task {
  id: number;
  project_id: number;
  project_name: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee_id: number | null;
  assignee_name: string | null;
  assignee_avatar: string | null;
  reporter_id: number | null;
  reporter_name: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: number;
  task_id: number;
  user_id: number;
  full_name: string;
  avatar_url: string | null;
  role: string;
  body: string;
  created_at: string;
}

export async function getTasks(params?: Record<string, string | number>) {
  const res = await api.get<{ data: Task[]; total: number; page: number; limit: number }>('/tasks', { params });
  return res.data;
}

export async function getTask(id: number) {
  const res = await api.get<Task>(`/tasks/${id}`);
  return res.data;
}

export async function createTask(data: Partial<Task>) {
  const res = await api.post<Task>('/tasks', data);
  return res.data;
}

export async function updateTask(id: number, data: Partial<Task>) {
  const res = await api.patch<Task>(`/tasks/${id}`, data);
  return res.data;
}

export async function deleteTask(id: number) {
  await api.delete(`/tasks/${id}`);
}

export async function getComments(taskId: number) {
  const res = await api.get<Comment[]>(`/tasks/${taskId}/comments`);
  return res.data;
}

export async function addComment(taskId: number, body: string) {
  const res = await api.post<Comment>(`/tasks/${taskId}/comments`, { body });
  return res.data;
}

export async function deleteComment(commentId: number) {
  await api.delete(`/comments/${commentId}`);
}
