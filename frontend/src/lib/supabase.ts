import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 認証状態の取得
export const getSession = () => supabase.auth.getSession()

// 認証状態の監視
export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  return supabase.auth.onAuthStateChange(callback)
}

// ログイン
export const signIn = (email: string, password: string) => {
  return supabase.auth.signInWithPassword({ email, password })
}

// サインアップ
export const signUp = (email: string, password: string) => {
  return supabase.auth.signUp({ email, password })
}

// ログアウト
export const signOut = () => {
  return supabase.auth.signOut()
}

// Googleでサインイン
export const signInWithGoogle = () => {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}`
    }
  })
}

// JWTトークンの取得
export const getAccessToken = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || null
}
