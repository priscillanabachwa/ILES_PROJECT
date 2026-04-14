import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('access_token'));

  const api = axios.create({
    baseURL: 'http://localhost:8000/api',
  });

  api.interceptors.request.use((config) => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const refreshToken = localStorage.getItem('refresh_token');
          const response = await axios.post('http://localhost:8000/api/auth/refresh/', {
            refresh: refreshToken,
          });
          const newToken = response.data.access;
          localStorage.setItem('access_token', newToken);
          setToken(newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } catch (err) {
          logout();
          return Promise.reject(err);
        }
      }
      return Promise.reject(error);
    }
  );

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const decoded = jwtDecode(token);
          if (decoded.exp > Date.now() / 1000) {
            const response = await api.get('/auth/me/');
            setUser(response.data);
          } else {
            logout();
          }
        } catch (error) {
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login/', { email, password });
      const { access, refresh, user } = response.data;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      setToken(access);
      setUser(user);
      toast.success('Login successful!');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.error || 'Login failed');
      return false;
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register/', userData);
      const { access, refresh, user } = response.data;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      setToken(access);
      setUser(user);
      toast.success('Registration successful!');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully');
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    api,
    isAuthenticated: !!user,
    isStudent: user?.role === 'student',
    isWorkplaceSupervisor: user?.role === 'workplace_supervisor',
    isAcademicSupervisor: user?.role === 'academic_supervisor',
    isAdmin: user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};