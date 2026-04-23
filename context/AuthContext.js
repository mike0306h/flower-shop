'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { register as apiRegister, login as apiLogin, getCurrentUser } from '../services/api'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 从 localStorage 恢复登录状态
    try {
      const savedToken = localStorage.getItem('flower_user_token')
      const savedUser = localStorage.getItem('flower_user')

      if (savedToken && savedUser) {
        setToken(savedToken)
        setUser(JSON.parse(savedUser))
        setIsLoggedIn(true)

        // 验证 token 是否有效
        validateToken()
      } else {
        setIsHydrated(true)
        setLoading(false)
      }
    } catch (e) {
      console.log('Failed to load auth state')
      setIsHydrated(true)
      setLoading(false)
    }
  }, [])

  const validateToken = async () => {
    try {
      const userData = await getCurrentUser()
      setUser(userData)
      localStorage.setItem('flower_user', JSON.stringify(userData))
    } catch (error) {
      // Token 无效，清除登录状态
      logout()
    } finally {
      setIsHydrated(true)
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const response = await apiLogin({ email, password })
      const { token: newToken, user: userData } = response

      setToken(newToken)
      setUser(userData)
      setIsLoggedIn(true)

      localStorage.setItem('flower_user_token', newToken)
      localStorage.setItem('flower_user', JSON.stringify(userData))

      return { success: true }
    } catch (error) {
      const message = error.response?.data?.detail || 'Login failed. Please try again.'
      return { success: false, error: message }
    }
  }

  const register = async (name, email, phone, password) => {
    try {
      const response = await apiRegister({ name, email, phone, password })
      const { token: newToken, user: userData } = response

      setToken(newToken)
      setUser(userData)
      setIsLoggedIn(true)

      localStorage.setItem('flower_user_token', newToken)
      localStorage.setItem('flower_user', JSON.stringify(userData))

      return { success: true }
    } catch (error) {
      const message = error.response?.data?.detail || 'Registration failed. Please try again.'
      return { success: false, error: message }
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    setIsLoggedIn(false)
    try {
      localStorage.removeItem('flower_user_token')
      localStorage.removeItem('flower_user')
    } catch (e) {}
  }

  const updateUserData = (newUserData) => {
    setUser(newUserData)
    localStorage.setItem('flower_user', JSON.stringify(newUserData))
  }

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoggedIn,
      isHydrated,
      loading,
      login,
      register,
      logout,
      updateUserData
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
