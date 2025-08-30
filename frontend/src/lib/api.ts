import { getAccessToken } from './supabase'
import { Company, Event } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

class ApiClient {
  private async getHeaders(): Promise<HeadersInit> {
    const token = await getAccessToken()
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    const headers = await this.getHeaders()
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API Error: ${response.status} - ${errorText}`)
    }

    return response.json()
  }

  // Company API
  async getCompanies(): Promise<Company[]> {
    return this.request<Company[]>('/api/v1/companies')
  }

  async createCompany(company: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>): Promise<Company> {
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

  async createEvent(event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event> {
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
