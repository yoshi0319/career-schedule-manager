import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, onAuthStateChange, signIn, signUp, signInWithGoogle, signOut } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<any>
  signUp: (email: string, password: string) => Promise<any>
  signInWithGoogle: () => Promise<any>
  signOut: () => Promise<any>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 初期セッション取得
    const getInitialSession = async () => {
      const { data: { session } } = await supabase().auth.getSession()
      setUser(session?.user || null)
      setLoading(false)
    }

    getInitialSession()

    // 認証状態の変更を監視
    const { data: { subscription } } = onAuthStateChange((event, session) => {
      setUser(session?.user || null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignIn = async (email: string, password: string) => {
    return signIn(email, password)
  }

  const handleSignUp = async (email: string, password: string) => {
    return signUp(email, password)
  }

  const handleSignInWithGoogle = async () => {
    return signInWithGoogle()
  }

  const handleSignOut = async () => {
    try {
      // ログアウト実行
      const { error } = await signOut()
      
      if (error && import.meta.env.DEV) {
        console.warn('SignOut error:', error)
      }
      
      // ローカル状態をクリア（エラーが発生しても実行）
      setUser(null)
      setLoading(false)
      
      // ローカルストレージの完全クリア
      localStorage.clear()
      sessionStorage.clear()
      
      // ページをリロードして完全にクリーンな状態にする
      window.location.reload()
      
      return { error: null }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('SignOut failed:', error)
      }
      
      // エラーが発生してもローカル状態をクリア
      setUser(null)
      setLoading(false)
      localStorage.clear()
      sessionStorage.clear()
      window.location.reload()
      
      return { error }
    }
  }

  const value = {
    user,
    loading,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signInWithGoogle: handleSignInWithGoogle,
    signOut: handleSignOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
