import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { apiClient } from '../lib/api'
import { Company } from '../types'
import { useToast } from './use-toast'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '@/lib/supabase'

// 企業一覧取得
export const useCompanies = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  return useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const startTime = performance.now()
      const companies = await apiClient.getCompanies()
      const endTime = performance.now()
      
      // パフォーマンス監視（開発環境のみ、詳細ログは無効化）
      if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_PERFORMANCE === 'true') {
        console.log(`Companies fetch time: ${(endTime - startTime).toFixed(2)}ms`)
      }
      
      return companies
    },
    staleTime: 0, // キャッシュを即座に無効化
    gcTime: 5 * 60 * 1000, // 10分間メモリに保持
    refetchOnWindowFocus: true, // ウィンドウフォーカス時の再取得を有効化
    refetchOnMount: true, // コンポーネントマウント時の再取得を有効化
    enabled: !!user, // ユーザーがログインしている場合のみ実行
  })
}

// Supabase Realtime 購読で企業一覧を自動同期
export const useSyncCompaniesRealtime = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!user) return
    const client = supabase()
    const channel = client
      .channel('companies-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'companies', filter: `user_id=eq.${user.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['companies'] })
          queryClient.refetchQueries({ queryKey: ['companies'] })
        }
      )
      .subscribe()

    return () => {
      client.removeChannel(channel)
    }
  }, [user, queryClient])
}

// 企業作成
export const useCreateCompany = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (company: Omit<Company, 'id' | 'created_at' | 'updated_at'>) =>
      apiClient.createCompany(company),
    onSuccess: (newCompany) => {
      // オプティミスティックアップデートで即座にUIを更新
      queryClient.setQueryData(['companies'], (oldData: Company[] | undefined) => {
        if (!oldData) return [newCompany]
        return [...oldData, newCompany]
      })
      
      toast({
        title: "企業を追加しました",
        description: "新しい企業が正常に追加されました。",
      })
    },
    onError: (error) => {
      toast({
        title: "エラーが発生しました",
        description: `企業の追加に失敗しました: ${error.message}`,
        variant: "destructive",
      })
    },
  })
}

// 企業更新
export const useUpdateCompany = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, company }: { id: string; company: Partial<Company> }) =>
      apiClient.updateCompany(id, company),
    onSuccess: (updatedCompany) => {
      // オプティミスティックアップデートで即座にUIを更新
      queryClient.setQueryData(['companies'], (oldData: Company[] | undefined) => {
        if (!oldData) return oldData
        return oldData.map(c => c.id === updatedCompany.id ? updatedCompany : c)
      })
      
      toast({
        title: "企業を更新しました",
        description: "企業情報が正常に更新されました。",
      })
    },
    onError: (error) => {
      toast({
        title: "エラーが発生しました",
        description: `企業の更新に失敗しました: ${error.message}`,
        variant: "destructive",
      })
    },
  })
}

// 企業削除
export const useDeleteCompany = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (id: string) => apiClient.deleteCompany(id),
    onSuccess: (_, deletedId) => {
      // より強制的なキャッシュ更新
      queryClient.removeQueries({ queryKey: ['companies'] })
      queryClient.removeQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.refetchQueries({ queryKey: ['companies'] })
      queryClient.refetchQueries({ queryKey: ['events'] })
      
      toast({
        title: "企業を削除しました",
        description: "企業が正常に削除されました。",
      })
    },
    onError: (error) => {
      toast({
        title: "エラーが発生しました",
        description: `企業の削除に失敗しました: ${error.message}`,
        variant: "destructive",
      })
    },
  })
}
