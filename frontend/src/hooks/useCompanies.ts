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
    queryFn: () => apiClient.getCompanies(),
    staleTime: 5 * 60 * 1000, // 5分間はキャッシュを使用
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
    onSuccess: () => {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      queryClient.invalidateQueries({ queryKey: ['events'] }) // 関連イベントも更新
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
