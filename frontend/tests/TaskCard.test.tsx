import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import TaskCard from '../src/components/TaskCard';
import type { Task } from '../src/api/tasks';

const mockTask: Task = {
  id: 1,
  project_id: 1,
  project_name: 'Test Project',
  title: 'Настроить JWT refresh tokens',
  description: 'Реализовать refresh-токены',
  status: 'in_progress',
  priority: 'high',
  assignee_id: 2,
  assignee_name: 'Нурлан Касымов',
  assignee_avatar: 'https://i.pravatar.cc/150?u=test',
  reporter_id: 1,
  reporter_name: 'Айдар Беков',
  due_date: '2026-12-31',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

describe('TaskCard', () => {
  it('отображает заголовок задачи', () => {
    render(<MemoryRouter><TaskCard task={mockTask} /></MemoryRouter>);
    expect(screen.getByText('Настроить JWT refresh tokens')).toBeInTheDocument();
  });

  it('показывает имя исполнителя', () => {
    render(<MemoryRouter><TaskCard task={mockTask} /></MemoryRouter>);
    expect(screen.getByText('Нурлан')).toBeInTheDocument();
  });

  it('показывает аватар исполнителя', () => {
    render(<MemoryRouter><TaskCard task={mockTask} /></MemoryRouter>);
    const avatar = screen.getByAltText('Нурлан Касымов');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute('src', 'https://i.pravatar.cc/150?u=test');
  });

  it('показывает срок выполнения', () => {
    render(<MemoryRouter><TaskCard task={mockTask} /></MemoryRouter>);
    expect(screen.getByText(/31 дек/i)).toBeInTheDocument();
  });

  it('показывает цветную точку приоритета high', () => {
    const { container } = render(<MemoryRouter><TaskCard task={mockTask} /></MemoryRouter>);
    const dot = container.querySelector('.bg-orange-500');
    expect(dot).toBeInTheDocument();
  });

  it('показывает кнопку → для задачи без статуса done', () => {
    const onAdvance = vi.fn();
    render(<MemoryRouter><TaskCard task={mockTask} onAdvance={onAdvance} /></MemoryRouter>);
    // Кнопка скрыта через opacity-0, но присутствует в DOM
    const btn = document.querySelector('button[title]');
    expect(btn).toBeInTheDocument();
  });
});
