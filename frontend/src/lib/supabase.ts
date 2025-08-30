import { createClient } from '@supabase/supabase-js'

// Supabaseクライアントの遅延初期化
let supabase: ReturnType<typeof createClient> | null = null

const getSupabaseClient = () => {
  if (!supabase) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables')
    }

    supabase = createClient(supabaseUrl, supabaseAnonKey)
  }
  return supabase
}

export { getSupabaseClient as supabase }

// 認証状態の取得
export const getSession = () => getSupabaseClient().auth.getSession()

// 認証状態の監視
export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  return getSupabaseClient().auth.onAuthStateChange(callback)
}

// ログイン
export const signIn = (email: string, password: string) => {
  return getSupabaseClient().auth.signInWithPassword({ email, password })
}

// サインアップ
export const signUp = (email: string, password: string) => {
  return getSupabaseClient().auth.signUp({ email, password })
}

// ログアウト
export const signOut = () => {
  return getSupabaseClient().auth.signOut()
}

// Googleでサインイン
export const signInWithGoogle = () => {
  return getSupabaseClient().auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}`
    }
  })
}

// JWTトークンの取得
export const getAccessToken = async () => {
  const { data: { session } } = await getSupabaseClient().auth.getSession()
  return session?.access_token || null
}
