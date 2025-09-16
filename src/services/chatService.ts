import { apiClient } from './api'

export interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  queryType?: 'analytics' | 'categorization' | 'general'
  executionTimeMs?: number
}

export interface ChatResponse {
  response: string
  queryType: string
  executionTimeMs: number
  data?: any
}

export const chatService = {
  async sendMessage(message: string): Promise<ChatResponse> {
    return apiClient.post<ChatResponse>('/api/chat/message', { message })
  },

  async getChatHistory(limit: number = 50): Promise<ChatMessage[]> {
    return apiClient.get<ChatMessage[]>(`/api/chat/history?limit=${limit}`)
  },

  async clearChatHistory(): Promise<void> {
    return apiClient.delete<void>('/api/chat/history')
  },

  async getSuggestions(): Promise<string[]> {
    return apiClient.get<string[]>('/api/chat/suggestions')
  },
}
