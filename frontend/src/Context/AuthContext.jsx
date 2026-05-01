import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
const [user, setUser] = useState(() => {
  const stored = localStorage.getItem('user')
  return stored ? JSON.parse(stored) : {
    first_name: 'Grace',
    last_name: 'Atim',
    role: 'academic_supervisor',
    email: 'g.atim@mak.ac.ug',
  }
})

  const login = (userData, token) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)