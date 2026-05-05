import api from './axios';

export interface Project {
  id: number;
  name: string;
  description: string | null;
  status: 'active' | 'paused' | 'completed' | 'archived';
  owner_id: number;
  owner_name: string;
  owner_avatar: string | null;
  deadline: string | null;
  created_at: string;
  task_count?: number;
}

export interface ProjectWithTasks extends Project {
  tasks: import('./tasks').Task[];
}

export async function getProjects(params?: Record<string, string | number>) {
  const res = await api.get<{ data: Project[]; total: number; page: number; limit: number }>('/projects', { params });
  return res.data;
}

export async function getProject(id: number) {
  const res = await api.get<ProjectWithTasks>(`/projects/${id}`);
  return res.data;
}

export async function createProject(data: Partial<Project>) {
  const res = await api.post<Project>('/projects', data);
  return res.data;
}

export async function updateProject(id: number, data: Partial<Project>) {
  const res = await api.patch<Project>(`/projects/${id}`, data);
  return res.data;
}

export async function deleteProject(id: number) {
  await api.delete(`/projects/${id}`);
}
