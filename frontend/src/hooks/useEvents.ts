import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../lib/api'
import { Event } from '../types'
import { useToast } from './use-toast'
import { useAuth } from '../contexts/AuthContext'

// イベント一覧取得
export const useEvents = () => {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const events = await apiClient.getEvents()
      // JSONBフィールドを適切に変換
      return events.map(event => ({
        ...event,
        candidate_slots: Array.isArray(event.candidate_slots) 
          ? event.candidate_slots.map((slot: any) => ({
              start_time: new Date(slot.start_time),
              end_time: new Date(slot.end_time)
            }))
          : [],
        confirmed_slot: event.confirmed_slot 
          ? {
              start_time: new Date(event.confirmed_slot.start_time),
              end_time: new Date(event.confirmed_slot.end_time)
            }
          : undefined
      }))
    },
    staleTime: 5 * 60 * 1000, // 5分間はキャッシュを使用
    enabled: !!user, // ユーザーがログインしている場合のみ実行
  })
}

// イベント作成
export const useCreateEvent = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (event: Omit<Event, 'id' | 'created_at' | 'updated_at'>) =>
      apiClient.createEvent(event),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      toast({
        title: "予定を追加しました",
        description: "新しい予定が正常に追加されました。",
      })
    },
    onError: (error) => {
      toast({
        title: "エラーが発生しました",
        description: `予定の追加に失敗しました: ${error.message}`,
        variant: "destructive",
      })
    },
  })
}

// イベント更新
export const useUpdateEvent = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, event }: { id: string; event: Partial<Event> }) =>
      apiClient.updateEvent(id, event),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      toast({
        title: "予定を更新しました",
        description: "予定が正常に更新されました。",
      })
    },
    onError: (error) => {
      toast({
        title: "エラーが発生しました",
        description: `予定の更新に失敗しました: ${error.message}`,
        variant: "destructive",
      })
    },
  })
}

// イベント削除
export const useDeleteEvent = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (id: string) => apiClient.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      toast({
        title: "予定を削除しました",
        description: "予定が正常に削除されました。",
      })
    },
    onError: (error) => {
      toast({
        title: "エラーが発生しました",
        description: `予定の削除に失敗しました: ${error.message}`,
        variant: "destructive",
      })
    },
  })
}

// イベント確定
export const useConfirmEvent = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, confirmedSlot, status }: { 
      id: string; 
      confirmedSlot: any; 
      status: string 
    }) => apiClient.confirmEvent(id, confirmedSlot, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      toast({
        title: "予定を確定しました",
        description: "予定が正常に確定されました。",
      })
    },
    onError: (error) => {
      toast({
        title: "エラーが発生しました",
        description: `予定の確定に失敗しました: ${error.message}`,
        variant: "destructive",
      })
    },
  })
}
