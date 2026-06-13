import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import WorkplaceSupervisorDashboard from './WorkplaceSupervisorDashboard';
import { AuthContext } from '../../context/AuthContext';

vi.mock('axios', () => ({
  default: {
    patch: vi.fn(),
    get: vi.fn(),
  }
}));

describe('WorkplaceSupervisorDashboard Exception Handling', () => {
  const mockSupervisorUser = { id: 2, username: 'jane_supervisor', role: 'workplace_supervisor' };

  const renderWithContext = (userValue) => {
    return render(
      <AuthContext.Provider value={{ user: userValue }}>
        <WorkplaceSupervisorDashboard />
      </AuthContext.Provider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('dashboard base structural runtime verification', () => {
    renderWithContext(mockSupervisorUser);
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });
});