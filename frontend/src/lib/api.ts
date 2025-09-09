import { getAccessToken } from './supabase'
import { Company, Event } from '../types'

const getApiBaseUrl = () => {
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
}

class ApiClient {
  private async getHeaders(): Promise<HeadersInit> {
    const token = await getAccessToken()
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${getApiBaseUrl()}${endpoint}`
    
    try {
      const headers = await this.getHeaders()
      
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
          'Accept': 'application/json',
        },
        cache: 'no-store',
        // リクエスト最適化
        keepalive: true, // ページ遷移時もリクエスト完了を保証
      })

      if (!response.ok) {
        let errorMessage = `サーバーエラーが発生しました (${response.status})`
        
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          // If JSON parsing fails, use status text
          errorMessage = response.statusText || errorMessage
        }

        // Handle specific error codes
        switch (response.status) {
          case 401:
            throw new Error('認証が必要です。再度ログインしてください。')
          case 403:
            throw new Error('この操作を実行する権限がありません。')
          case 404:
            throw new Error('指定されたリソースが見つかりません。')
          case 500:
            throw new Error('サーバー内部エラーが発生しました。しばらく後に再試行してください。')
          default:
            throw new Error(errorMessage)
        }
      }

      return response.json()
    } catch (error) {
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('ネットワークエラーが発生しました。インターネット接続を確認してください。')
      }
      
      // Re-throw API errors as-is
      if (error instanceof Error) {
        throw error
      }
      
      // Fallback for unknown errors
      throw new Error('予期しないエラーが発生しました。')
    }
  }

  // Company API
  async getCompanies(): Promise<Company[]> {
    return this.request<Company[]>('/api/v1/companies')
  }

  async createCompany(company: Omit<Company, 'id' | 'created_at' | 'updated_at'>): Promise<Company> {
    return this.request<Company>('/api/v1/companies', {
      method: 'POST',
      body: JSON.stringify(company),
    })
  }

  async updateCompany(id: string, company: Partial<Company>): Promise<Company> {
    return this.request<Company>(`/api/v1/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(company),
    })
  }

  async deleteCompany(id: string): Promise<void> {
    return this.request<void>(`/api/v1/companies/${id}`, {
      method: 'DELETE',
    })
  }

  // Event API
  async getEvents(): Promise<Event[]> {
    return this.request<Event[]>('/api/v1/events')
  }

  async createEvent(event: Omit<Event, 'id' | 'created_at' | 'updated_at'>): Promise<Event> {
    return this.request<Event>('/api/v1/events', {
      method: 'POST',
      body: JSON.stringify(event),
    })
  }

  async updateEvent(id: string, event: Partial<Event>): Promise<Event> {
    return this.request<Event>(`/api/v1/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(event),
    })
  }

  async deleteEvent(id: string): Promise<void> {
    return this.request<void>(`/api/v1/events/${id}`, {
      method: 'DELETE',
    })
  }

  async confirmEvent(id: string, confirmedSlot: any, status: string): Promise<Event> {
    return this.request<Event>(`/api/v1/events/${id}/confirm`, {
      method: 'PUT',
      body: JSON.stringify({ confirmed_slot: confirmedSlot, status }),
    })
  }
}

export const apiClient = new ApiClient()
