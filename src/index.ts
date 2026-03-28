import { Telegraf, Context, Markup } from 'telegraf'
import 'dotenv/config'
import { formatUserInfo, formatAdminMessage, clearUserSession } from './utils'
import { BotConfig, UserState } from './types'
import logger from './pino'

// Validate environment variables
if (!process.env.BOT_TOKEN) {
  throw new Error('BOT_TOKEN обязателен в переменных окружения')
}

if (!process.env.ADMIN_CHAT_ID) {
  throw new Error('ADMIN_CHAT_ID обязателен в переменных окружения')
}

if (isNaN(Number(process.env.ADMIN_CHAT_ID))) {
  throw new Error('ADMIN_CHAT_ID должен быть числовым значением')
}

if (!process.env.CHANNEL_ID) {
  throw new Error('CHANNEL_ID обязателен в переменных окружения')
}

// Bot configuration
const config: BotConfig = {
  botToken: process.env.BOT_TOKEN,
  adminChatId: process.env.ADMIN_CHAT_ID,
  channelId: process.env.CHANNEL_ID,
}

const pollOptions = ['114A', '116Б', 'Староалексеевская, 4 (домик)']

// Initialize bot
const bot = new Telegraf(config.botToken)

// Create session storage
const sessions = new Map<number, UserState>()

// Helper function to send application to admin
async function sendToAdmin(
  bot: Telegraf,
  session: UserState,
  adminChatId: string,
): Promise<void> {
  try {
    const adminMessage = formatAdminMessage(session)

    await bot.telegram.sendMessage(adminChatId, adminMessage, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ Одобрить', callback_data: `approve:${session.userId}` },
            { text: '❌ Отклонить', callback_data: `reject:${session.userId}` },
          ],
        ],
      },
    })

    logger.info(`[Admin] Sent application for user ${session.userId} to admin`)
  } catch (error) {
    logger.error('[Admin] Error sending to admin:', error)
    throw error // Re-throw so caller can handle
  }
}

// Start command
bot.command('start', async (ctx: Context) => {
  if (!ctx.from) {
    return ctx.reply('Невозможно идентифицировать пользователя.')
  }

  // Initialize new UserState in sessions
  const userId = ctx.from.id
  sessions.set(userId, {
    userId: userId,
    step: 'phone',
    username: ctx.from.username,
    firstName: ctx.from.first_name,
    lastName: ctx.from.last_name,
    startedAt: new Date(),
  })

  // Send welcome message explaining the process
  await ctx.reply(
    '👋 Это бот для входа в чат шлагбаума домов 116Б 114А!\n\n' +
    'Для получения доступа к чату необходимо предоставить свои данные:\n\n' +
    '📱 Шаг 1: Поделитесь своим номером телефона\n' +
    '📊 Шаг 2: Выберите номер дома, где вы живёте/работаете\n' +
    '💬 Шаг 3: Введите номер квартиры/офиса (можно название компании)\n\n' +
    'Давайте начнем!',
  )

  // Request phone number with keyboard button
  await ctx.reply(
    '📱 Шаг 1/3: Пожалуйста, поделитесь своим номером телефона',
    Markup.keyboard([
      Markup.button.contactRequest('📱 Поделиться номером телефона'),
    ])
      .oneTime()
      .resize(),
  )
})

// Contact handler - receive phone number
bot.on('contact', async (ctx: Context) => {
  if (!ctx.from || !ctx.message || !('contact' in ctx.message)) {
    return ctx.reply('Невозможно обработать контактную информацию.')
  }

  const userId = ctx.from.id
  const session = sessions.get(userId)

  // Check if user has a session
  if (!session) {
    return ctx.reply(
      'Пожалуйста, сначала начните процесс авторизации с помощью /start',
    )
  }

  // Check if user is on the correct step
  if (session.step !== 'phone') {
    if (session.step === 'poll') {
      return ctx.reply('Пожалуйста, сначала ответьте на опрос.')
    } else if (session.step === 'text') {
      return ctx.reply('Пожалуйста, предоставьте текстовый ответ.')
    } else {
      return ctx.reply('Вы уже завершили процесс авторизации.')
    }
  }

  // Validate that user shared their own contact, not someone else's
  if (ctx.message.contact.user_id !== userId) {
    return ctx.reply(
      '❌ Пожалуйста, поделитесь своим собственным номером телефона, а не чужим.\n\n' +
      'Используйте кнопку ниже, чтобы поделиться своим контактом.',
      Markup.keyboard([
        Markup.button.contactRequest('📱 Поделиться номером телефона'),
      ])
        .oneTime()
        .resize(),
    )
  }

  // Store phone number and update step
  session.phoneNumber = ctx.message.contact.phone_number
  session.step = 'poll'

  // Confirm receipt and remove keyboard
  await ctx.reply('✅ Номер телефона получен!', Markup.removeKeyboard())

  // Proceed to step 2 - send poll
  await ctx.reply('📊 Шаг 2/3: Пожалуйста, ответьте на этот вопрос опроса')

  await ctx.replyWithPoll('Выберите номер дома', pollOptions, {
    is_anonymous: false,
  })
})

// Poll answer handler - receive poll response
bot.on('poll_answer', async (ctx: Context) => {
  if (!ctx.pollAnswer || !ctx.from) {
    return
  }

  const userId = ctx.from.id
  const session = sessions.get(userId)

  // Check if user has a session
  if (!session) {
    return bot.telegram.sendMessage(
      userId,
      'Пожалуйста, сначала начните процесс авторизации с помощью /start',
    )
  }

  // Check if user is on the correct step
  if (session.step !== 'poll') {
    return
  }

  // Validate that user selected an option (array should not be empty)
  if (ctx.pollAnswer.option_ids.length === 0) {
    return bot.telegram.sendMessage(
      userId,
      '❌ Пожалуйста, выберите вариант из опроса.',
    )
  }

  // Store poll choice and update step
  const selectedOption = ctx.pollAnswer.option_ids[0]
  logger.info(pollOptions)
  logger.info(ctx.pollAnswer)
  session.pollChoice = pollOptions[selectedOption]
  logger.info(session)
  session.step = 'text'

  await bot.telegram.sendMessage(userId, '✅ Ответ на опрос получен!')
  await bot.telegram.sendMessage(
    userId,
    '💬 Шаг 3/3: Номер квартиры (офиса).\n\n' +
    'Введите ваше сообщение ниже (или используйте /cancel для перезапуска):',
  )
})

bot.command('cancel', async (ctx: Context) => {
  if (!ctx.from) {
    return ctx.reply('Невозможно идентифицировать пользователя.')
  }

  const userId = ctx.from.id
  clearUserSession(userId, sessions)

  await ctx.reply(
    '❌ Процесс авторизации отменен.\n\n' +
    'Используйте /start, чтобы начать заново.',
  )
})

bot.on('text', async (ctx: Context) => {
  if (!ctx.from || !ctx.message || !('text' in ctx.message)) {
    return
  }

  // Ignore if message is a command (already handled by command handlers)
  if (ctx.message.text.startsWith('/')) {
    return
  }

  const userId = ctx.from.id
  const session = sessions.get(userId)

  // Check if user has a session
  if (!session) {
    return ctx.reply(
      'Пожалуйста, сначала начните процесс авторизации с помощью /start',
    )
  }

  // Check if user is on the correct step
  if (session.step !== 'text') {
    if (session.step === 'phone') {
      return ctx.reply(
        'Пожалуйста, поделитесь своим номером телефона, используя предоставленную кнопку.',
      )
    } else if (session.step === 'poll') {
      return ctx.reply('Пожалуйста, сначала ответьте на опрос.')
    } else {
      return ctx.reply('Вы уже завершили процесс авторизации.')
    }
  }

  // Validate text response
  const textResponse = ctx.message.text.trim()

  if (textResponse.length < 1) {
    return ctx.reply(
      '❌ Ваш ответ слишком короткий. Пожалуйста, введите не менее 1 символа.\n\n' +
      'Попробуйте еще раз:',
    )
  }

  if (textResponse.length > 500) {
    return ctx.reply(
      '❌ Ваш ответ слишком длинный. Пожалуйста, ограничьте его до 500 символов.\n\n' +
      'Попробуйте еще раз:',
    )
  }

  // Store text response and update step to completed
  session.textResponse = textResponse
  session.step = 'completed'

  // Send confirmation to user
  await ctx.reply(
    '✅ Спасибо! Ваша заявка ожидает ручного рассмотрения ответственного за шлагбаум',
  )

  // Send data to admin using helper function
  try {
    await sendToAdmin(bot, session, config.adminChatId)
  } catch (error) {
    logger.error('[Text Handler] Error sending to admin:', error)
    await ctx.reply('⚠️ Произошла ошибка при отправке вашей заявки.')
  }

  // Keep session in Map until admin responds (don't clear yet)
})

// Callback query handler - admin approval/rejection via inline buttons
bot.on('callback_query', async (ctx: Context) => {
  if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
    return
  }

  const callbackData = ctx.callbackQuery.data
  const adminId = ctx.from?.id.toString()

  // Verify admin
  if (adminId !== config.adminChatId) {
    return ctx.answerCbQuery('⛔ Неавторизовано. Только для администратора.', {
      show_alert: true,
    })
  }

  // Parse callback data: "approve:userId" or "reject:userId"
  const [action, userIdStr] = callbackData.split(':')
  const userId = parseInt(userIdStr)

  if (!action || !userId) {
    return ctx.answerCbQuery('Неверные данные запроса', { show_alert: true })
  }

  // Get user session
  const session = sessions.get(userId)
  if (!session) {
    return ctx.answerCbQuery('⚠️ Сессия пользователя не найдена', {
      show_alert: true,
    })
  }

  try {
    if (action === 'approve') {
      // Create invite link for the channe24l
      const invite = await bot.telegram.createChatInviteLink(config.channelId, {
        member_limit: 1,
        expire_date: Math.floor(Date.now() / 1000) + 3600 * 24, // 10 hour expiry
      })

      // Send invite to user
      await bot.telegram.sendMessage(
        userId,
        `✅ Ваш запрос на авторизацию был одобрен!\n\n` +
        `Присоединяйтесь к каналу по этой ссылке: ${invite.invite_link}\n\n` +
        `Примечание: Срок действия этой ссылки истекает через 1 час.`,
      )

      // Update admin message
      await ctx.editMessageReplyMarkup({ inline_keyboard: [] })
      // const originalText = 'Заявка'
      // await ctx.editMessageText(originalText + '\n\n✅ <b>ОДОБРЕНО</b>', {
      //   parse_mode: 'HTML',
      // })

      // Clear user session
      clearUserSession(userId, sessions)

      await ctx.answerCbQuery(
        '✅ Пользователь одобрен и приглашение отправлено!',
      )
      logger.info(`[Admin] User ${userId} approved by admin`)
    } else if (action === 'reject') {
      // Notify user of rejection
      await bot.telegram.sendMessage(
        userId,
        '❌ Ваш запрос на авторизацию был отклонен.\n',
      )

      // Update admin message
      await ctx.editMessageReplyMarkup({ inline_keyboard: [] })
      // const originalText = 'Заявка'
      // await ctx.editMessageText(originalText + '\n\n❌ <b>ОТКЛОНЕНО</b>', {
      //   parse_mode: 'HTML',
      // })

      // Clear user session
      clearUserSession(userId, sessions)

      await ctx.answerCbQuery('❌ Пользователь отклонен и уведомлен.')
      logger.info(`[Admin] User ${userId} rejected by admin`)
    } else {
      await ctx.answerCbQuery('Неизвестное действие', { show_alert: true })
    }
  } catch (error) {
    logger.error('[Callback] Error processing admin action:', error)
    await ctx.answerCbQuery('⚠️ Ошибка обработки запроса', { show_alert: true })
  }
})

// Request command - users send authorization requests
bot.command('request', async (ctx: Context) => {
  const userInfo = formatUserInfo(ctx)

  try {
    // Send request to admin
    await bot.telegram.sendMessage(
      config.adminChatId,
      `📝 Новый запрос на доступ:\n\n${userInfo}\n\n` +
      `Используйте /approve ${ctx.from?.id} или /deny ${ctx.from?.id} для ответа.`,
    )

    await ctx.reply('Ваш запрос был отправлен администратору на рассмотрение.')
  } catch (error) {
    logger.error('Error sending request to admin:', error)
    await ctx.reply(
      'Не удалось отправить запрос. Пожалуйста, попробуйте позже.',
    )
  }
})

// Approve command - admin approves user
// bot.command('approve', async (ctx: Context) => {
//   if (ctx.chat?.id.toString() !== config.adminChatId) {
//     return ctx.reply('Unauthorized. This command is admin-only.')
//   }
//
//   // const userId = ctx.message?.text.split(' ')[1]
//   if (!userId) {
//     return ctx.reply('Usage: /approve <user_id>')
//   }
//
//   try {
//     // Create invite link for the channel
//     const invite = await bot.telegram.createChatInviteLink(config.channelId, {
//       member_limit: 1,
//       expire_date: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
//     })
//
//     // Send invite to user
//     await bot.telegram.sendMessage(
//       userId,
//       `✅ Your access request has been approved!\n\n` +
//         `Join the channel using this link: ${invite.invite_link}\n\n` +
//         `Note: This link expires in 1 hour.`,
//     )
//
//     await ctx.reply(`User ${userId} has been approved and sent an invite link.`)
//   } catch (error) {
//     logger.error('Error approving user:', error)
//     await ctx.reply(`Failed to approve user ${userId}. Error: ${error}`)
//   }
// })

// Deny command - admin denies user
// bot.command('deny', async (ctx: Context) => {
//   if (ctx.chat?.id.toString() !== config.adminChatId) {
//     return ctx.reply('Unauthorized. This command is admin-only.')
//   }
//
//   const userId = ctx.message?.text.split(' ')[1]
//   if (!userId) {
//     return ctx.reply('Usage: /deny <user_id>')
//   }
//
//   try {
//     await bot.telegram.sendMessage(
//       userId,
//       '❌ Your access request has been denied.',
//     )
//
//     await ctx.reply(`User ${userId} has been notified of denial.`)
//   } catch (error) {
//     logger.error('Error denying user:', error)
//     await ctx.reply(`Failed to notify user ${userId}. Error: ${error}`)
//   }
// })

// Help command
bot.help(async (ctx: Context) => {
  const isAdmin = ctx.chat?.id.toString() === config.adminChatId

  let helpText =
    '🤖 Команды бота:\n\n' +
    '/start - Запустить бота\n' +
    '/request - Запросить доступ к каналу\n' +
    '/help - Показать это справочное сообщение'

  if (isAdmin) {
    helpText +=
      '\n\nКоманды администратора:\n' +
      '/approve <user_id> - Одобрить запрос пользователя\n' +
      '/deny <user_id> - Отклонить запрос пользователя'
  }

  await ctx.reply(helpText)
})

// Error handling
bot.catch((err: unknown, ctx: Context) => {
  logger.error('Bot error:', err)
  ctx.reply('Произошла ошибка. Пожалуйста, попробуйте позже.')
})

// Launch bot
bot
  .launch()
  .then(() => {
    // This won't execute until bot stops
  })
  .catch(err => {
    logger.error('❌ Failed to start bot:', err)
    process.exit(1)
  })

logger.info('✅ Бот запущен и слушает сообщения...')

// Enable graceful shutdown
process.once('SIGINT', () => {
  logger.info('Получен SIGINT, корректное завершение...')
  bot.stop('SIGINT')
  process.exit(0)
})

process.once('SIGTERM', () => {
  logger.info('Получен SIGTERM, корректное завершение...')
  bot.stop('SIGTERM')
  process.exit(0)
})
