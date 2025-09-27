import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../lib/api'
import { Company } from '../types'
import { useToast } from './use-toast'
import { useAuth } from '../contexts/AuthContext'

// 企業一覧取得
export const useCompanies = () => {
  const { user } = useAuth()
  
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
    staleTime: 5 * 60 * 1000, // 5分間はキャッシュを使用
    gcTime: 10 * 60 * 1000, // 10分間メモリに保持
    refetchOnWindowFocus: false, // ウィンドウフォーカス時の再取得を無効化（レート制限対策）
    refetchOnMount: false, // コンポーネントマウント時の再取得を無効化（レート制限対策）
    enabled: !!user, // ユーザーがログインしている場合のみ実行
  })
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
      // サーバーの最新状態と同期
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      
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
    onSuccess: (response) => {
      // レスポンスが自動アーカイブされた場合の処理
      if (response && typeof response === 'object' && 'auto_archived' in response) {
        const { company, auto_archived, message } = response as any
        
        // サーバーの最新状態と同期
        queryClient.invalidateQueries({ queryKey: ['companies'] })
        
        if (auto_archived) {
          toast({
            title: "企業を更新しました",
            description: "企業のステージを「不合格」に変更し、自動的にアーカイブしました。",
          })
        } else {
          toast({
            title: "企業を更新しました",
            description: "企業情報が正常に更新されました。",
          })
        }
      } else {
        // 通常の更新の場合
        const updatedCompany = response as Company
        
        // オプティミスティックアップデートで即座にUIを更新
        queryClient.setQueryData(['companies'], (oldData: Company[] | undefined) => {
          if (!oldData) return oldData
          return oldData.map(c => c.id === updatedCompany.id ? updatedCompany : c)
        })
        // サーバーの最新状態と同期
        queryClient.invalidateQueries({ queryKey: ['companies'] })
        
        toast({
          title: "企業を更新しました",
          description: "企業情報が正常に更新されました。",
        })
      }
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
      // オプティミスティックアップデートで即座にUIを更新
      queryClient.setQueryData(['companies'], (oldData: Company[] | undefined) => {
        if (!oldData) return oldData
        return oldData.filter(c => c.id !== deletedId)
      })
      
      // 関連イベントも更新
      queryClient.setQueryData(['events'], (oldData: any[] | undefined) => {
        if (!oldData) return oldData
        return oldData.filter(e => e.company_id !== deletedId)
      })
      // サーバーの最新状態と同期
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      
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
