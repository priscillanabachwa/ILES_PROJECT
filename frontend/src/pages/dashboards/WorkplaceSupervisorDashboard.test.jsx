import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import WorkplaceSupervisorDashboard from './WorkplaceSupervisorDashboard';
import { AuthContext } from '../context/AuthContext';

describe('WorkplaceSupervisorDashboard Exception Handling', () => {
  const mockSupervisorUser = { id: 2, username: 'jane_supervisor', role: 'workplace_supervisor' };

  const renderWithContext = (userValue) => {
    return render(
      <AuthContext.Provider value={{ user: userValue }}>
        <WorkplaceSupervisorDashboard />
      </AuthContext.Provider>
    );
  };

  test('displays an authorization error banner if the backend returns a 403', async () => {
    // Force Axios to throw a simulated 403 rejected response tracking error
    axios.patch.mockRejectedValueOnce({
      response: { status: 403, data: { detail: 'Students are not authorized to modify placement tracking statuses.' } }
    });

    renderWithContext(mockSupervisorUser);
    const user = userEvent.setup();

    // Trigger your update or approval action
    const approveButton = screen.getByRole('button', { name: /approve/i });
    await user.click(approveButton);

    // Assert that the UI gracefully captured the error state and displayed a user-friendly alert
    expect(await screen.findByText(/you are not authorized to perform this action/i)).toBeInTheDocument();
  });
});import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import WorkplaceSupervisorDashboard from './WorkplaceSupervisorDashboard';
import { AuthContext } from '../context/AuthContext';

describe('WorkplaceSupervisorDashboard Exception Handling', () => {
  const mockSupervisorUser = { id: 2, username: 'jane_supervisor', role: 'workplace_supervisor' };

  const renderWithContext = (userValue) => {
    return render(
      <AuthContext.Provider value={{ user: userValue }}>
        <WorkplaceSupervisorDashboard />
      </AuthContext.Provider>
    );
  };

  test('displays an authorization error banner if the backend returns a 403', async () => {
    // Force Axios to throw a simulated 403 rejected response tracking error
    axios.patch.mockRejectedValueOnce({
      response: { status: 403, data: { detail: 'Students are not authorized to modify placement tracking statuses.' } }
    });

    renderWithContext(mockSupervisorUser);
    const user = userEvent.setup();

    // Trigger your update or approval action
    const approveButton = screen.getByRole('button', { name: /approve/i });
    await user.click(approveButton);

    // Assert that the UI gracefully captured the error state and displayed a user-friendly alert
    expect(await screen.findByText(/you are not authorized to perform this action/i)).toBeInTheDocument();
  });
});