const API_BASE_URL = '/api';

export const loginUser = async (email, password) => {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/accounts/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new Error('Cannot reach the server. Please make sure the backend is running.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail ||
      errorData.message ||
      (Array.isArray(errorData.non_field_errors) ? errorData.non_field_errors[0] : null) ||
      'Invalid email or password.'
    );
  }

  const data = await response.json();
  return { token: data.token, user: data.user };
};

export const registerUser = async (userData) => {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/accounts/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
  } catch {
    throw new Error('Cannot reach the server. Please make sure the backend is running.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const firstError =
      errorData.detail ||
      errorData.message ||
      Object.values(errorData)?.[0]?.[0] ||
      'Registration failed';
    throw new Error(firstError);
  }

  const data = await response.json();
  return { token: data.token, user: data.user };
};

export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

export const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const fetchWithAuth = async (url, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail ||
      errorData.message ||
      `Request failed with status ${response.status}`
    );
  }

  if (response.status === 204) return null;

  return response.json();
};

export const updateUserProfile = async (userData) => {
  const user = getUser();
  if (!user || !user.id) {
    throw new Error('User not found');
  }

  return fetchWithAuth(`${API_BASE_URL}/accounts/users/${user.id}/`, {
    method: 'PATCH',
    body: JSON.stringify(userData),
  });
};

export const requestPasswordReset = async (email) => {
  const response = await fetch(`${API_BASE_URL}/accounts/password-reset-request/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  }).catch(() => { throw new Error('Cannot reach the server.'); });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail ||
      errorData.message ||
      'Failed to generate recovery code'
    );
  }

  return response.json();
};

export const verifyResetCode = async (email, code) => {
  const response = await fetch(`${API_BASE_URL}/accounts/verify-reset-code/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  }).catch(() => { throw new Error('Cannot reach the server.'); });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail ||
      errorData.message ||
      'Invalid or expired code'
    );
  }

  return response.json();
};

export const resetPassword = async (email, code, newPassword) => {
  const response = await fetch(`${API_BASE_URL}/accounts/password-reset-confirm/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code, new_password: newPassword }),
  }).catch(() => { throw new Error('Cannot reach the server.'); });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail ||
      errorData.message ||
      'Failed to reset password'
    );
  }

  return response.json();
};
