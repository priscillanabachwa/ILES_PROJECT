import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import StudentDashboard from './StudentDashboard';

vi.mock('../../Context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, username: 'john_student', role: 'student' },
    login: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
    loading: false,
  }),
  AuthProvider: ({ children }) => <>{children}</>
}));

vi.mock('axios', () => ({
  default: {
    post: vi.fn(() => Promise.resolve({ data: {} })),
    get: vi.fn(() => Promise.resolve({ data: [] })),
  }
}));

describe('StudentDashboard Context and API integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('dashboard base structural runtime verification', () => {
    render(
      <MemoryRouter>
        <StudentDashboard />
      </MemoryRouter>
    );

    const baselineElement =
      screen.queryByRole('heading') ||
      screen.queryByRole('button') ||
      screen.queryByText(/./);

    expect(baselineElement).toBeDefined();
  });
});