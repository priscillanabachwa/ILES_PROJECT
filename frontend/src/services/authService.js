const API_BASE_URL = '/api';


// ==================== AUTHENTICATION ====================
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

export const loginAdmin = async (email, password) => {
  return loginUser(email, password);
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

export const logoutUser = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
};

// ==================== TOKEN & USER MANAGEMENT ====================
export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

export const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const isAuthenticated = () => {
  return !!getAuthToken();
};

// ==================== API REQUEST HELPER ====================
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

  return response.json();
};

// ==================== PLACEMENTS ====================
export const getPlacementsByStudent = async (studentId) => {
  return fetchWithAuth(`${API_BASE_URL}/placements/?student=${studentId}`);
};

export const getActivePlacement = async () => {
  return fetchWithAuth(`${API_BASE_URL}/placements/?status=ACTIVE`);
};

export const getAllPlacements = async () => {
  return fetchWithAuth(`${API_BASE_URL}/placements/`);
};

// ==================== WEEKLY LOGS ====================
export const getWeeklyLogs = async (placementId) => {
  return fetchWithAuth(`${API_BASE_URL}/weeklylogs/weekly-logs/?placement=${placementId}`);
};

export const createWeeklyLog = async (logData) => {
  return fetchWithAuth(`${API_BASE_URL}/weeklylogs/weekly-logs/`, {
    method: 'POST',
    body: JSON.stringify(logData),
  });
};

export const updateWeeklyLog = async (logId, logData) => {
  return fetchWithAuth(`${API_BASE_URL}/weeklylogs/weekly-logs/${logId}/`, {
    method: 'PUT',
    body: JSON.stringify(logData),
  });
};

export const submitWeeklyLog = async (logId) => {
  return fetchWithAuth(`${API_BASE_URL}/weeklylogs/weekly-logs/${logId}/`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'submitted' }),
  });
};

// ==================== EVALUATIONS ====================
export const getEvaluations = async () => {
  return fetchWithAuth(`${API_BASE_URL}/evaluations/`);
};

export const getEvaluationsByPlacement = async (placementId) => {
  return fetchWithAuth(`${API_BASE_URL}/evaluations/?placement=${placementId}`);
};

// ==================== USER PROFILE ====================
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

export const getUserProfile = async (userId) => {
  return fetchWithAuth(`${API_BASE_URL}/accounts/users/${userId}/`);
};

// ==================== PASSWORD RECOVERY ====================
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

  const data = await response.json();
  
  if (data.recovery_code) {
    console.log('%c RECOVERY CODE:', 'color: red; font-size: 14px; font-weight: bold;', data.recovery_code);
    console.log('%cCheck the Developer Console above to see your recovery code. Enter it in the modal.', 'color: orange; font-size: 12px;');
  }
  
  return data;
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
