import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)       // { user_id, full_name, role, access_token }
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('bilimai_user')
    if (stored) {
      try { setUser(JSON.parse(stored)) }
      catch { localStorage.removeItem('bilimai_user') }
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const data = await authAPI.login({ email, password })
    const userObj = {
      user_id: data.user_id,
      full_name: data.full_name,
      role: data.role,
      access_token: data.access_token,
    }
    setUser(userObj)
    localStorage.setItem('bilimai_user', JSON.stringify(userObj))
    return userObj
  }

  const register = async (payload) => {
    const data = await authAPI.register(payload)
    const userObj = {
      user_id: data.user_id,
      full_name: data.full_name,
      role: data.role,
      access_token: data.access_token,
    }
    setUser(userObj)
    localStorage.setItem('bilimai_user', JSON.stringify(userObj))
    return userObj
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('bilimai_user')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
