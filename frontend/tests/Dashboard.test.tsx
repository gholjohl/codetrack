import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../src/pages/Dashboard';

// Мокаем API-функции
vi.mock('../src/api/stats', () => ({
  getOverview: vi.fn(),
  getWorkload: vi.fn(),
  getActivity: vi.fn(),
}));

import { getOverview, getWorkload, getActivity } from '../src/api/stats';

const mockOverview = {
  total_projects: 4,
  total_tasks: 30,
  my_active_tasks: 5,
  completed_this_week: 3,
  tasks_by_status: [
    { status: 'todo', count: 10 },
    { status: 'in_progress', count: 8 },
    { status: 'review', count: 6 },
    { status: 'done', count: 6 },
  ],
  tasks_by_priority: [
    { priority: 'low', count: 5 },
    { priority: 'medium', count: 12 },
    { priority: 'high', count: 10 },
    { priority: 'critical', count: 3 },
  ],
};

describe('Dashboard', () => {
  beforeEach(() => {
    vi.mocked(getOverview).mockResolvedValue(mockOverview);
    vi.mocked(getWorkload).mockResolvedValue([]);
    vi.mocked(getActivity).mockResolvedValue([]);
  });

  it('показывает лоадер при загрузке', () => {
    vi.mocked(getOverview).mockReturnValue(new Promise(() => {}));
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('отображает метрики после загрузки', async () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText('30')).toBeInTheDocument();
    });
  });

  it('показывает заголовок Дашборд', async () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Дашборд')).toBeInTheDocument();
    });
  });
});
