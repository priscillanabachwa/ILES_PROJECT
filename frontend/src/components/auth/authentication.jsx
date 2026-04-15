import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => localStorage.getItem('access_token'));

  const refreshPromiseRef = useRef(null);

  const api = useMemo(
    () =>
      axios.create({
        baseURL: 'http://localhost:8000/api',
      }),
    []
  );

  const logout = useCallback((showToast = true) => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setToken(null);
    setUser(null);
    if (showToast) toast.success('Logged out successfully');
  }, []);

  const refreshAccessToken = useCallback(async () => {
    if (refreshPromiseRef.current) return refreshPromiseRef.current;

    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) throw new Error('No refresh token');

    refreshPromiseRef.current = axios
      .post('http://localhost:8000/api/auth/refresh/', { refresh: refreshToken })
      .then((res) => {
        const newToken = res.data.access;
        localStorage.setItem('access_token', newToken);
        setToken(newToken);
        return newToken;
      })
      .finally(() => {
        refreshPromiseRef.current = null;
      });

    return refreshPromiseRef.current;
  }, []);

  useEffect(() => {
    const reqId = api.interceptors.request.use((config) => {
      const currentToken = localStorage.getItem('access_token');
      if (currentToken) {
        config.headers.Authorization = `Bearer ${currentToken}`;
      }
      return config;
    });

    const resId = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const newToken = await refreshAccessToken();
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          } catch (err) {
            logout(false);
            return Promise.reject(err);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(reqId);
      api.interceptors.response.eject(resId);
    };
  }, [api, refreshAccessToken, logout]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const savedToken = localStorage.getItem('access_token');
        if (!savedToken) {
          setLoading(false);
          return;
        }

        let activeToken = savedToken;
        let decoded = jwtDecode(savedToken);

        if (decoded.exp <= Date.now() / 1000) {
          activeToken = await refreshAccessToken();
          decoded = jwtDecode(activeToken);
          if (decoded.exp <= Date.now() / 1000) throw new Error('Token still expired');
        }

        const response = await api.get('/auth/me/');
        setUser(response.data);
      } catch {
        logout(false);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [api, refreshAccessToken, logout]);

  const login = useCallback(
    async (email, password) => {
      try {
        const response = await api.post('/auth/login/', { email, password });
        const { access, refresh, user: nextUser } = response.data;
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        setToken(access);
        setUser(nextUser);
        toast.success('Login successful!');
        return true;
      } catch (error) {
        toast.error(error.response?.data?.error || 'Login failed');
        return false;
      }
    },
    [api]
  );

  const register = useCallback(
    async (userData) => {
      try {
        const response = await api.post('/auth/register/', userData);
        const { access, refresh, user: nextUser } = response.data;
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        setToken(access);
        setUser(nextUser);
        toast.success('Registration successful!');
        return true;
      } catch (error) {
        toast.error(error.response?.data?.message || 'Registration failed');
        return false;
      }
    },
    [api]
  );

  const value = useMemo(
    () => ({
      user,
      login,
      register,
      logout,
      loading,
      api,
      token,
      isAuthenticated: !!user,
      isStudent: user?.role === 'student',
      isWorkplaceSupervisor: user?.role === 'workplace_supervisor',
      isAcademicSupervisor: user?.role === 'academic_supervisor',
      isAdmin: user?.role === 'admin',
    }),
    [user, login, register, logout, loading, api, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};