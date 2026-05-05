import api from './axios';

export interface StatsOverview {
  total_projects: number;
  total_tasks: number;
  my_active_tasks: number;
  completed_this_week: number;
  tasks_by_status: { status: string; count: number }[];
  tasks_by_priority: { priority: string; count: number }[];
}

export interface WorkloadItem {
  id: number;
  full_name: string;
  position: string;
  avatar_url: string | null;
  total_tasks: number;
  todo: number;
  in_progress: number;
  review: number;
  done: number;
}

export interface ActivityItem {
  id: number;
  user_id: number;
  full_name: string;
  avatar_url: string | null;
  entity_type: string;
  entity_id: number;
  action: string;
  meta: string | null;
  created_at: string;
}

export async function getOverview() {
  const res = await api.get<StatsOverview>('/stats/overview');
  return res.data;
}

export async function getWorkload() {
  const res = await api.get<WorkloadItem[]>('/stats/workload');
  return res.data;
}

export async function getBurndown(projectId: number) {
  const res = await api.get<{ project: object; data: { date: string; completed: number; remaining: number }[] }>(`/stats/burndown?project_id=${projectId}`);
  return res.data;
}

export async function getActivity(limit = 20) {
  const res = await api.get<ActivityItem[]>(`/stats/activity?limit=${limit}`);
  return res.data;
}
