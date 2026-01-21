import { Context } from 'telegraf';
import { UserState, SessionStorage } from './types';

export function formatUserInfo(ctx: Context): string {
  const user = ctx.from;
  if (!user) return 'Unknown user';

  const parts = [
    `User ID: ${user.id}`,
    `Username: ${user.username ? '@' + user.username : 'N/A'}`,
    `Name: ${user.first_name}${user.last_name ? ' ' + user.last_name : ''}`,
  ];

  return parts.join('\n');
}

export function validateEnv(): void {
  const required = ['BOT_TOKEN', 'ADMIN_CHAT_ID', 'CHANNEL_ID'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

export function formatAdminMessage(userData: UserState): string {
  const displayName = getUserDisplayName(userData);
  const username = userData.username ? `@${userData.username}` : 'N/A';

  const pollChoiceText = userData.pollChoice === 'option_a' ? 'Option A' :
                         userData.pollChoice === 'option_b' ? 'Option B' : 'N/A';

  return `<b>📋 New User Submission</b>\n\n` +
    `<b>User Info:</b>\n` +
    `👤 Name: <code>${displayName}</code>\n` +
    `🆔 Username: <code>${username}</code>\n` +
    `🔢 User ID: <code>${userData.userId}</code>\n\n` +
    `<b>Responses:</b>\n` +
    `📞 Phone: <code>${userData.phoneNumber || 'N/A'}</code>\n` +
    `📊 Poll Choice: <i>${pollChoiceText}</i>\n` +
    `💬 Text Response: <i>${userData.textResponse || 'N/A'}</i>\n\n` +
    `⏰ Started: ${userData.startedAt.toLocaleString()}`;
}

export function getUserDisplayName(user: UserState): string {
  if (user.username) {
    return user.username;
  }

  const firstName = user.firstName || '';
  const lastName = user.lastName || '';

  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }

  return firstName || lastName || 'Unknown User';
}

export function isValidPhoneNumber(phone: string): boolean {
  // Remove all non-digit characters for validation
  const digitsOnly = phone.replace(/\D/g, '');

  // Check if it has between 10 and 15 digits (international phone number range)
  if (digitsOnly.length < 10 || digitsOnly.length > 15) {
    return false;
  }

  // Optional: Check if it starts with + or a digit
  const startsValid = /^[\+\d]/.test(phone);

  return startsValid;
}

export function clearUserSession(userId: number, sessions: SessionStorage): void {
  const deleted = sessions.delete(userId);

  if (deleted) {
    console.log(`[Session] Cleared session for user ${userId}`);
  } else {
    console.log(`[Session] No session found for user ${userId}`);
  }
}
