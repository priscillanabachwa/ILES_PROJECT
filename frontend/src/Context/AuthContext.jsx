import { createContext, useContext, useState, useEffect } from 'react'
import { loginUser } from '../services/authService';

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    // Simulate an API call
    const response = await loginUser(email, password );
    if (response.status === 200) { 
      localStorage.setItem('authToken', response.data.token);
      setUser(response.data.user);
      Navigate('/admin/dashboard');
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading ? children : <div className='spinner'>Loading ILES...</div>}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};