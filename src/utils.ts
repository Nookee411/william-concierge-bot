import { Context } from 'telegraf'
import { UserState, SessionStorage } from './types'

export function formatUserInfo(ctx: Context): string {
  const user = ctx.from
  if (!user) return 'Неизвестный пользователь'

  const parts = [
    `ID пользователя: ${user.id}`,
    `Имя пользователя: ${user.username ? '@' + user.username : 'Н/Д'}`,
    `Имя: ${user.first_name}${user.last_name ? ' ' + user.last_name : ''}`,
  ]

  return parts.join('\n')
}

export function validateEnv(): void {
  const required = ['BOT_TOKEN', 'ADMIN_CHAT_ID', 'CHANNEL_ID']
  const missing = required.filter(key => !process.env[key])

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`,
    )
  }
}

export function formatAdminMessage(userData: UserState): string {
  const displayName = getUserDisplayName(userData)
  const username = userData.username ? `@${userData.username}` : 'Н/Д'
  const pollChoiceText = userData.pollChoice

  return (
    `<b>📋 Новая заявка пользователя</b>\n\n` +
    `<b>Информация о пользователе:</b>\n` +
    `👤 Имя: <code>${displayName}</code>\n` +
    `🆔 Имя пользователя: <code>${username}</code>\n` +
    `🔢 ID пользователя: <code>${userData.userId}</code>\n\n` +
    `<b>Ответы:</b>\n` +
    `📞 Телефон: <code>${userData.phoneNumber || 'Н/Д'}</code>\n` +
    `📊 Выбор в опросе: <i>${pollChoiceText || 'Н/Д'}</i>\n` +
    `💬 Текстовый ответ: <i>${userData.textResponse || 'Н/Д'}</i>\n\n` +
    `⏰ Начато: ${userData.startedAt.toLocaleString('ru-RU')}`
  )
}

export function getUserDisplayName(user: UserState): string {
  if (user.username) {
    return user.username
  }

  const firstName = user.firstName || ''
  const lastName = user.lastName || ''

  if (firstName && lastName) {
    return `${firstName} ${lastName}`
  }

  return firstName || lastName || 'Неизвестный пользователь'
}

export function isValidPhoneNumber(phone: string): boolean {
  // Remove all non-digit characters for validation
  const digitsOnly = phone.replace(/\D/g, '')

  // Check if it has between 10 and 15 digits (international phone number range)
  if (digitsOnly.length < 10 || digitsOnly.length > 15) {
    return false
  }

  // Optional: Check if it starts with + or a digit
  const startsValid = /^[\+\d]/.test(phone)

  return startsValid
}

export function clearUserSession(
  userId: number,
  sessions: SessionStorage,
): void {
  const deleted = sessions.delete(userId)

  if (deleted) {
    console.log(`[Session] Cleared session for user ${userId}`)
  } else {
    console.log(`[Session] No session found for user ${userId}`)
  }
}
