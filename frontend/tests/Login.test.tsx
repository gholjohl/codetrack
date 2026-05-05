import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Login from '../src/pages/Login';
import { AuthProvider } from '../src/context/AuthContext';

// Мокаем axios для изоляции тестов
vi.mock('../src/api/axios', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

vi.mock('../src/api/auth', () => ({
  login: vi.fn(),
  getMe: vi.fn().mockResolvedValue(null),
  logout: vi.fn(),
}));

function renderLogin() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('Login page', () => {
  it('рендерится без ошибок и показывает форму', () => {
    renderLogin();
    expect(screen.getByText(/вход в систему/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/имя@codecraft\.kz/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /войти/i })).toBeInTheDocument();
  });

  it('показывает ошибку при отправке пустой формы', async () => {
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: /войти/i }));
    await waitFor(() => {
      expect(screen.getByText(/введите email/i)).toBeInTheDocument();
    });
  });

  it('показывает ошибку при невалидном email', async () => {
    renderLogin();
    const emailInput = screen.getByPlaceholderText(/имя@codecraft\.kz/i);
    fireEvent.change(emailInput, { target: { value: 'not-an-email' } });
    fireEvent.click(screen.getByRole('button', { name: /войти/i }));
    await waitFor(() => {
      expect(screen.getByText(/некорректный email/i)).toBeInTheDocument();
    });
  });

  it('заполняет форму при клике на тестовый аккаунт admin', () => {
    renderLogin();
    const adminBtn = screen.getByText('admin@codecraft.kz');
    fireEvent.click(adminBtn);
    expect((screen.getByPlaceholderText(/имя@codecraft\.kz/i) as HTMLInputElement).value).toBe('admin@codecraft.kz');
  });
});
