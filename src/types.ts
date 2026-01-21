export interface BotConfig {
  botToken: string
  adminChatId: string
  channelId: string
}

export interface UserRequest {
  userId: number
  username?: string
  firstName: string
  lastName?: string
  timestamp: Date
}

export interface UserState {
  userId: number
  step: 'phone' | 'poll' | 'text' | 'completed'
  phoneNumber?: string
  pollChoice?: string
  textResponse?: string
  username?: string
  firstName?: string
  lastName?: string
  startedAt: Date
}

export type SessionStorage = Map<number, UserState>
