import { createClient } from '@supabase/supabase-js'

// Supabaseクライアントの遅延初期化
let supabase: ReturnType<typeof createClient> | null = null

const getSupabaseClient = () => {
  if (!supabase) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey
      })
      throw new Error('Missing Supabase environment variables')
    }

    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        debug: false, // デバッグログを無効化
      },
      global: {
        headers: {
          'X-Client-Info': 'career-schedule-manager'
        }
      }
    })
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
export const signOut = async () => {
  try {
    // まず現在のセッションを取得
    const { data: { session } } = await getSupabaseClient().auth.getSession()
    
    if (session) {
      // セッションが存在する場合はログアウトを試行
      const { error } = await getSupabaseClient().auth.signOut()
      if (error) {
        // エラー時のみログ出力
        if (import.meta.env.DEV) {
          console.warn('Supabase logout failed:', error.message)
        }
        // エラーが発生してもローカル状態をクリア
        await getSupabaseClient().auth.signOut({ scope: 'local' })
      }
    }
    
    // ローカルストレージのクリア
    localStorage.removeItem('supabase.auth.token')
    
    return { error: null }
  } catch (error) {
    // エラー時のみログ出力
    if (import.meta.env.DEV) {
      console.error('Logout error:', error)
    }
    // エラーが発生してもローカル状態をクリア
    try {
      await getSupabaseClient().auth.signOut({ scope: 'local' })
    } catch (localError) {
      if (import.meta.env.DEV) {
        console.warn('Local logout also failed:', localError)
      }
    }
    
    return { error }
  }
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
