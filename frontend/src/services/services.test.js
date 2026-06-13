// ─────────────────────────────────────────────────────────────
// ILES Frontend Unit Tests
// Run with: npm test
// Covers: authService.js and dashboardService.js
// ─────────────────────────────────────────────────────────────

import {
  loginUser,
  registerUser,
  getAuthToken,
  getUser,
  fetchWithAuth,
  updateUserProfile,
  requestPasswordReset,
  verifyResetCode,
  resetPassword,
} from '../services/authService';

import dashboardService, { capName } from '../services/dashboardService';

// ─────────────────────────────────────────────────────────────
// GLOBAL TEST SETUP
// ─────────────────────────────────────────────────────────────

beforeEach(() => {
  // Reset fetch mock and localStorage before each test
  global.fetch = vi.fn();
  localStorage.clear();
});

afterEach(() => {
  vi.resetAllMocks();
});

// Helper: mock a successful fetch response
function mockFetchSuccess(data, status = 200) {
  global.fetch.mockResolvedValueOnce({
    ok: true,
    status,
    json: async () => data,
  });
}

// Helper: mock a failed fetch response
function mockFetchFailure(errorData, status = 400) {
  global.fetch.mockResolvedValueOnce({
    ok: false,
    status,
    json: async () => errorData,
  });
}

// Helper: mock a network error (server unreachable)
function mockNetworkError() {
  global.fetch.mockRejectedValueOnce(new Error('Network Error'));
}


// ─────────────────────────────────────────────────────────────
// 1. AUTH SERVICE TESTS
// ─────────────────────────────────────────────────────────────

describe('authService — loginUser', () => {

  test('returns token and user on successful login', async () => {
    mockFetchSuccess({ token: 'abc123', user: { id: 1, email: 'student@test.com', role: 'student' } });

    const result = await loginUser('student@test.com', 'password123');

    expect(result.token).toBe('abc123');
    expect(result.user.email).toBe('student@test.com');
    expect(result.user.role).toBe('student');
  });

  test('throws error with detail message on failed login', async () => {
    mockFetchFailure({ detail: 'Invalid email or password.' });

    await expect(loginUser('wrong@test.com', 'wrongpass'))
      .rejects.toThrow('Invalid email or password.');
  });

  test('throws error with non_field_errors message on failed login', async () => {
    mockFetchFailure({ non_field_errors: ['Unable to log in with provided credentials.'] });

    await expect(loginUser('bad@test.com', 'bad'))
      .rejects.toThrow('Unable to log in with provided credentials.');
  });

  test('throws server unreachable error on network failure', async () => {
    mockNetworkError();

    await expect(loginUser('student@test.com', 'pass'))
      .rejects.toThrow('Cannot reach the server');
  });

  test('calls the correct login endpoint', async () => {
    mockFetchSuccess({ token: 'tok', user: {} });

    await loginUser('student@test.com', 'pass123');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/accounts/login/'),
      expect.objectContaining({ method: 'POST' })
    );
  });
});


describe('authService — registerUser', () => {

  test('returns token and user on successful registration', async () => {
    mockFetchSuccess({ token: 'newtoken', user: { id: 2, email: 'new@test.com' } });

    const result = await registerUser({
      email: 'new@test.com',
      password: 'pass123',
      first_name: 'Alice',
      last_name: 'Smith',
    });

    expect(result.token).toBe('newtoken');
    expect(result.user.email).toBe('new@test.com');
  });

  test('throws error when registration fails with field errors', async () => {
    mockFetchFailure({ email: ['A user with this email already exists.'] });

    await expect(registerUser({ email: 'taken@test.com', password: 'pass' }))
      .rejects.toThrow('A user with this email already exists.');
  });

  test('throws server unreachable error on network failure', async () => {
    mockNetworkError();

    await expect(registerUser({ email: 'a@b.com', password: 'pass' }))
      .rejects.toThrow('Cannot reach the server');
  });

  test('calls the correct register endpoint', async () => {
    mockFetchSuccess({ token: 'tok', user: {} });

    await registerUser({ email: 'a@b.com', password: 'pass' });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/accounts/register/'),
      expect.objectContaining({ method: 'POST' })
    );
  });
});


describe('authService — getAuthToken and getUser', () => {

  test('getAuthToken returns null when no token in localStorage', () => {
    expect(getAuthToken()).toBeNull();
  });

  test('getAuthToken returns the stored token', () => {
    localStorage.setItem('authToken', 'mytoken123');
    expect(getAuthToken()).toBe('mytoken123');
  });

  test('getUser returns null when no user in localStorage', () => {
    expect(getUser()).toBeNull();
  });

  test('getUser returns parsed user object from localStorage', () => {
    const user = { id: 1, email: 'student@test.com', role: 'student' };
    localStorage.setItem('user', JSON.stringify(user));
    expect(getUser()).toEqual(user);
  });
});


describe('authService — fetchWithAuth', () => {

  test('includes Authorization header when token exists', async () => {
    localStorage.setItem('authToken', 'mytoken123');
    mockFetchSuccess({ data: 'ok' });

    await fetchWithAuth('/api/some-endpoint/');

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/some-endpoint/',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Token mytoken123',
        }),
      })
    );
  });

  test('does not include Authorization header when no token', async () => {
    mockFetchSuccess({ data: 'ok' });

    await fetchWithAuth('/api/some-endpoint/');

    const callArgs = global.fetch.mock.calls[0][1];
    expect(callArgs.headers.Authorization).toBeUndefined();
  });

  test('returns null on 204 No Content response', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true, status: 204, json: async () => ({}) });

    const result = await fetchWithAuth('/api/some-endpoint/');
    expect(result).toBeNull();
  });

  test('throws error on failed request', async () => {
    mockFetchFailure({ detail: 'Not found.' }, 404);

    await expect(fetchWithAuth('/api/missing/')).rejects.toThrow('Not found.');
  });
});


describe('authService — requestPasswordReset', () => {

  test('resolves successfully when email is valid', async () => {
    mockFetchSuccess({ message: 'Reset code sent.' });

    const result = await requestPasswordReset('student@test.com');
    expect(result.message).toBe('Reset code sent.');
  });

  test('throws error when email is not found', async () => {
    mockFetchFailure({ detail: 'No user with this email.' });

    await expect(requestPasswordReset('nobody@test.com'))
      .rejects.toThrow('No user with this email.');
  });
});


describe('authService — verifyResetCode', () => {

  test('resolves successfully with valid code', async () => {
    mockFetchSuccess({ message: 'Code verified.' });

    const result = await verifyResetCode('student@test.com', '123456');
    expect(result.message).toBe('Code verified.');
  });

  test('throws error with invalid or expired code', async () => {
    mockFetchFailure({ detail: 'Invalid or expired code' });

    await expect(verifyResetCode('student@test.com', '000000'))
      .rejects.toThrow('Invalid or expired code');
  });
});


describe('authService — resetPassword', () => {

  test('resolves successfully on valid password reset', async () => {
    mockFetchSuccess({ message: 'Password reset successful.' });

    const result = await resetPassword('student@test.com', '123456', 'NewPass123!');
    expect(result.message).toBe('Password reset successful.');
  });

  test('throws error when reset fails', async () => {
    mockFetchFailure({ detail: 'Failed to reset password' });

    await expect(resetPassword('student@test.com', 'badcode', 'pass'))
      .rejects.toThrow('Failed to reset password');
  });
});


// ─────────────────────────────────────────────────────────────
// 2. DASHBOARD SERVICE — UTILITY FUNCTION TESTS
// ─────────────────────────────────────────────────────────────

describe('dashboardService — capName utility', () => {

  test('capitalises the first letter of each word', () => {
    expect(capName('alice smith')).toBe('Alice Smith');
  });

  test('handles already capitalised strings', () => {
    expect(capName('Alice Smith')).toBe('Alice Smith');
  });

  test('handles all uppercase input', () => {
    expect(capName('ALICE SMITH')).toBe('ALICE SMITH');
  });

  test('returns null/undefined as-is', () => {
    expect(capName(null)).toBeNull();
    expect(capName(undefined)).toBeUndefined();
  });

  test('handles empty string', () => {
    expect(capName('')).toBe('');
  });

  test('handles single word', () => {
    expect(capName('alice')).toBe('Alice');
  });
});


// ─────────────────────────────────────────────────────────────
// 3. DASHBOARD SERVICE — API CALL TESTS
// ─────────────────────────────────────────────────────────────

describe('dashboardService — getStudentStats', () => {

  test('returns correct log counts for a student', async () => {
    // fetchWithAuth is called twice: logbooks then evaluations
    global.fetch
      .mockResolvedValueOnce({
        ok: true, status: 200,
        json: async () => [
          { id: 1, status: 'submitted', placement: 1 },
          { id: 2, status: 'approved',  placement: 1 },
          { id: 3, status: 'draft',     placement: 1 },
        ],
      })
      .mockResolvedValueOnce({
        ok: true, status: 200,
        json: async () => [],
      });

    localStorage.setItem('authToken', 'testtoken');

    const result = await dashboardService.getStudentStats();

    expect(result.data.logs_submitted).toBe(2);
    expect(result.data.pending_logs).toBe(1);
  });

  test('handles empty logbooks gracefully', async () => {
    global.fetch
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => [] });

    localStorage.setItem('authToken', 'testtoken');

    const result = await dashboardService.getStudentStats();

    expect(result.data.logs_submitted).toBe(0);
    expect(result.data.pending_logs).toBe(0);
    expect(result.data.current_score).toBeNull();
  });
});


describe('dashboardService — getStudentPlacement', () => {

  test('returns the active placement', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true, status: 200,
      json: async () => [
        { id: 1, status: 'ACTIVE', company_name: 'Test Co', start_date: '2025-01-01', end_date: '2025-04-01' },
        { id: 2, status: 'COMPLETED', company_name: 'Old Co', start_date: '2024-01-01', end_date: '2024-04-01' },
      ],
    });

    localStorage.setItem('authToken', 'testtoken');

    const result = await dashboardService.getStudentPlacement();

    expect(result.data.status).toBe('ACTIVE');
    expect(result.data.company).toBe('Test Co');
  });

  test('returns null when no placements exist', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => [] });

    localStorage.setItem('authToken', 'testtoken');

    const result = await dashboardService.getStudentPlacement();

    expect(result.data).toBeNull();
  });
});


describe('dashboardService — getNextDeadline', () => {

  test('returns the earliest draft log deadline', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true, status: 200,
      json: async () => [
        { id: 1, status: 'draft', week_number: 2, deadline: '2025-02-10' },
        { id: 2, status: 'draft', week_number: 1, deadline: '2025-02-03' },
        { id: 3, status: 'submitted', week_number: 3, deadline: '2025-01-27' },
      ],
    });

    localStorage.setItem('authToken', 'testtoken');

    const result = await dashboardService.getNextDeadline();

    expect(result.data.week_number).toBe(1);
    expect(result.data.due_date).toBe('2025-02-03');
  });

  test('returns null when no draft logs exist', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true, status: 200,
      json: async () => [
        { id: 1, status: 'submitted', week_number: 1, deadline: '2025-01-27' },
      ],
    });

    localStorage.setItem('authToken', 'testtoken');

    const result = await dashboardService.getNextDeadline();

    expect(result.data).toBeNull();
  });
});


describe('dashboardService — getWorkplacePlacements', () => {

  test('maps student names using capName', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true, status: 200,
        json: async () => [
          { id: 1, student: 10, student_name: 'alice smith', company_name: 'Test Co', status: 'ACTIVE' },
        ],
      })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => [] });

    localStorage.setItem('authToken', 'testtoken');

    const result = await dashboardService.getWorkplacePlacements();

    expect(result.data[0].student_name).toBe('Alice Smith');
  });

  test('marks placement status as submitted when a log is submitted', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true, status: 200,
        json: async () => [
          { id: 1, student: 10, student_name: 'Bob Jones', company_name: 'Biz Ltd', status: 'ACTIVE' },
        ],
      })
      .mockResolvedValueOnce({
        ok: true, status: 200,
        json: async () => [
          { id: 5, placement: 1, status: 'submitted', week_number: 1 },
        ],
      });

    localStorage.setItem('authToken', 'testtoken');

    const result = await dashboardService.getWorkplacePlacements();

    expect(result.data[0].status).toBe('submitted');
  });
});


describe('dashboardService — getAdminUsers', () => {

  test('returns formatted user list', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true, status: 200,
      json: async () => [
        { id: 1, first_name: 'Alice', last_name: 'Smith', email: 'alice@test.com', role: 'student', date_joined: '2025-01-01' },
        { id: 2, first_name: 'Bob',   last_name: 'Jones', email: 'bob@test.com',   role: 'workplace_supervisor', date_joined: '2025-01-02' },
      ],
    });

    localStorage.setItem('authToken', 'testtoken');

    const result = await dashboardService.getAdminUsers();

    expect(result.data).toHaveLength(2);
    expect(result.data[0].name).toBe('Alice Smith');
    expect(result.data[1].role).toBe('workplace_supervisor');
  });
});


describe('dashboardService — reviewLog, approveLog, rejectLog', () => {

  test('reviewLog calls the correct endpoint with comment', async () => {
    mockFetchSuccess({ status: 'reviewed' });
    localStorage.setItem('authToken', 'testtoken');

    await dashboardService.reviewLog(5, 'Good work!');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/logbooks/5/review/'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  test('approveLog calls the correct endpoint', async () => {
    mockFetchSuccess({ status: 'approved' });
    localStorage.setItem('authToken', 'testtoken');

    await dashboardService.approveLog(5);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/logbooks/5/approve/'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  test('rejectLog calls the correct endpoint with comment', async () => {
    mockFetchSuccess({ status: 'draft' });
    localStorage.setItem('authToken', 'testtoken');

    await dashboardService.rejectLog(5, 'Needs more detail.');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/logbooks/5/reject/'),
      expect.objectContaining({ method: 'POST' })
    );
  });
});