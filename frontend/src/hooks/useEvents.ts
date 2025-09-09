import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../lib/api'
import { Event } from '../types'
import { useToast } from './use-toast'
import { useAuth } from '../contexts/AuthContext'

// 日時データをDateオブジェクトに変換するヘルパー関数
const processEventDates = (event: Event): Event => ({
  ...event,
  candidate_slots: event.candidate_slots?.map((slot: any) => ({
    start_time: new Date(slot.start_time),
    end_time: new Date(slot.end_time)
  })) || [],
  confirmed_slot: event.confirmed_slot ? {
    start_time: new Date(event.confirmed_slot.start_time),
    end_time: new Date(event.confirmed_slot.end_time)
  } : undefined
})

// イベント一覧取得
export const useEvents = () => {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const startTime = performance.now()
      const events = await apiClient.getEvents()
      const endTime = performance.now()
      
      // パフォーマンス監視（開発環境のみ、詳細ログは無効化）
      if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_PERFORMANCE === 'true') {
        console.log(`Events fetch time: ${(endTime - startTime).toFixed(2)}ms`)
      }
      
      // JSONBフィールドをDateオブジェクトに変換
      return events.map(processEventDates)
    },
    staleTime: 5 * 60 * 1000, // 5分間はキャッシュを使用
    gcTime: 10 * 60 * 1000, // 10分間メモリに保持
    refetchOnWindowFocus: true, // ウィンドウフォーカス時の再取得を有効化
    refetchOnMount: true, // コンポーネントマウント時の再取得を有効化
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
    onSuccess: (newEvent) => {
      // オプティミスティックアップデートで即座にUIを更新（日時変換付き）
      queryClient.setQueryData(['events'], (oldData: Event[] | undefined) => {
        if (!oldData) return [processEventDates(newEvent)]
        return [...oldData, processEventDates(newEvent)]
      })
      // サーバーの最新状態と同期
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
    onSuccess: (updatedEvent) => {
      // オプティミスティックアップデートで即座にUIを更新（日時変換付き）
      queryClient.setQueryData(['events'], (oldData: Event[] | undefined) => {
        if (!oldData) return oldData
        return oldData.map(e => e.id === updatedEvent.id ? processEventDates(updatedEvent) : e)
      })
      // サーバーの最新状態と同期
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
    onSuccess: (_, deletedId) => {
      // オプティミスティックアップデートで即座にUIを更新
      queryClient.setQueryData(['events'], (oldData: Event[] | undefined) => {
        if (!oldData) return oldData
        return oldData.filter(e => e.id !== deletedId)
      })
      
      toast({
        title: "予定を削除しました",
        description: "予定が正常に削除されました。",
      })
      // サーバーの最新状態と同期
      queryClient.invalidateQueries({ queryKey: ['events'] })
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
    onSuccess: (updatedEvent) => {
      // オプティミスティックアップデートで即座にUIを更新（日時変換付き）
      queryClient.setQueryData(['events'], (oldData: Event[] | undefined) => {
        if (!oldData) return oldData
        return oldData.map(e => e.id === updatedEvent.id ? processEventDates(updatedEvent) : e)
      })
      
      toast({
        title: "予定を確定しました",
        description: "予定が正常に確定されました。",
      })
      // サーバーの最新状態と同期
      queryClient.invalidateQueries({ queryKey: ['events'] })
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
