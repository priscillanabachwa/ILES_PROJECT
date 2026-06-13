import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios'; // This will automatically pull from your __mocks__/axios.js
import StudentDashboard from './StudentDashboard';
import { AuthContext } from '../context/AuthContext'; // <-- Path to your real AuthContext

describe('StudentDashboard Context and API integration', () => {
  const mockStudentUser = { id: 1, username: 'john_student', role: 'student' };

  // Helper function to render our dashboard wrapped in your actual Context Provider
  const renderWithContext = (userValue) => {
    return render(
      <AuthContext.Provider value={{ user: userValue }}>
        <StudentDashboard />
      </AuthContext.Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('successfully submits a placement form via Axios', async () => {
    // 1. Tell our mock Axios what to return when the component loads or submits data
    axios.post.mockResolvedValueOnce({
      status: 201,
      data: { id: 101, status: 'PENDING', company_name: 'Tech Corp' }
    });

    renderWithContext(mockStudentUser);
    const user = userEvent.setup();

    // 2. Interact with the form UI elements
    const companyInput = screen.getByLabelText(/company name/i);
    const submitButton = screen.getByRole('button', { name: /submit placement/i });

    await user.type(companyInput, 'Tech Corp');
    await user.click(submitButton);

    // 3. Assert that Axios was called with the exact payload expected by Django
    expect(axios.post).toHaveBeenCalledWith('/api/placements/', expect.objectContaining({
      company_name: 'Tech Corp',
      student: 1
    }));

    // 4. Verify the success banner updates on screen
    expect(await screen.findByText(/placement submitted successfully/i)).toBeInTheDocument();
  });
});