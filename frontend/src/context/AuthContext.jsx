import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('auth_token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      api.authGet('/auth/me', token)
        .then(data => {
          if (data && data.id) setUser(data)
          else {
            setToken(null)
            localStorage.removeItem('auth_token')
          }
        })
        .catch(() => {
          setToken(null)
          localStorage.removeItem('auth_token')
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (email, password) => {
    const data = await api.post('/auth/login', { email, password })
    if (data.access_token) {
      localStorage.setItem('auth_token', data.access_token)
      setToken(data.access_token)
      setUser(data.user)
      return { success: true, user: data.user }
    }
    return { success: false, error: data.detail || 'Login failed' }
  }, [])

  const register = useCallback(async (userData) => {
    const data = await api.post('/auth/register', userData)
    if (data.access_token) {
      localStorage.setItem('auth_token', data.access_token)
      setToken(data.access_token)
      setUser(data.user)
      return { success: true, user: data.user }
    }
    return { success: false, error: data.detail || 'Registration failed' }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
