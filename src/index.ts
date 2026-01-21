import { Telegraf, Context, Markup } from 'telegraf'
import 'dotenv/config'
import { formatUserInfo, formatAdminMessage, clearUserSession } from './utils'
import { BotConfig, UserState } from './types'

// Validate environment variables
if (!process.env.BOT_TOKEN) {
  throw new Error('BOT_TOKEN is required in environment variables')
}

if (!process.env.ADMIN_CHAT_ID) {
  throw new Error('ADMIN_CHAT_ID is required in environment variables')
}

if (isNaN(Number(process.env.ADMIN_CHAT_ID))) {
  throw new Error('ADMIN_CHAT_ID must be a numeric value')
}

if (!process.env.CHANNEL_ID) {
  throw new Error('CHANNEL_ID is required in environment variables')
}

// Bot configuration
const config: BotConfig = {
  botToken: process.env.BOT_TOKEN,
  adminChatId: process.env.ADMIN_CHAT_ID,
  channelId: process.env.CHANNEL_ID,
}

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
            { text: '✅ Approve', callback_data: `approve:${session.userId}` },
            { text: '❌ Reject', callback_data: `reject:${session.userId}` },
          ],
        ],
      },
    })

    console.log(`[Admin] Sent application for user ${session.userId} to admin`)
  } catch (error) {
    console.error('[Admin] Error sending to admin:', error)
    throw error // Re-throw so caller can handle
  }
}

// Start command
bot.command('start', async (ctx: Context) => {
  if (!ctx.from) {
    return ctx.reply('Unable to identify user.')
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
    '👋 Welcome to the authorization bot!\n\n' +
      'To gain access to our channel, please complete the following 3 steps:\n\n' +
      '📱 Step 1: Share your phone number\n' +
      '📊 Step 2: Answer a quick poll\n' +
      '💬 Step 3: Provide a text response\n\n' +
      "Let's get started!",
  )

  // Request phone number with keyboard button
  await ctx.reply(
    '📱 Step 1/3: Please share your phone number',
    Markup.keyboard([Markup.button.contactRequest('📱 Share Phone Number')])
      .oneTime()
      .resize(),
  )
})

// Contact handler - receive phone number
bot.on('contact', async (ctx: Context) => {
  if (!ctx.from || !ctx.message || !('contact' in ctx.message)) {
    return ctx.reply('Unable to process contact information.')
  }

  const userId = ctx.from.id
  const session = sessions.get(userId)

  // Check if user has a session
  if (!session) {
    return ctx.reply(
      'Please start the authorization process first using /start',
    )
  }

  // Check if user is on the correct step
  if (session.step !== 'phone') {
    if (session.step === 'poll') {
      return ctx.reply('Please answer the poll first.')
    } else if (session.step === 'text') {
      return ctx.reply('Please provide your text response.')
    } else {
      return ctx.reply('You have already completed the authorization process.')
    }
  }

  // Validate that user shared their own contact, not someone else's
  if (ctx.message.contact.user_id !== userId) {
    return ctx.reply(
      "❌ Please share your own phone number, not someone else's.\n\n" +
        'Use the button below to share your contact.',
      Markup.keyboard([Markup.button.contactRequest('📱 Share Phone Number')])
        .oneTime()
        .resize(),
    )
  }

  // Store phone number and update step
  session.phoneNumber = ctx.message.contact.phone_number
  session.step = 'poll'

  // Confirm receipt and remove keyboard
  await ctx.reply('✅ Phone number received!', Markup.removeKeyboard())

  // Proceed to step 2 - send poll
  await ctx.reply('📊 Step 2/3: Please answer this poll question')

  await ctx.replyWithPoll(
    'Which option do you prefer?',
    ['Option A', 'Option B'],
    {
      is_anonymous: false,
    },
  )
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
      'Please start the authorization process first using /start',
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
      '❌ Please select an option from the poll.',
    )
  }

  // Store poll choice and update step
  const selectedOption = ctx.pollAnswer.option_ids[0]
  session.pollChoice = selectedOption === 0 ? 'option_a' : 'option_b'
  session.step = 'text'

  // Confirm receipt and proceed to step 3
  await bot.telegram.sendMessage(userId, '✅ Poll answer received!')
  await bot.telegram.sendMessage(
    userId,
    '💬 Step 3/3: Please provide a text response.\n\n' +
      'Type your message below (or use /cancel to restart):',
  )
})

// Cancel command - clear session and restart
bot.command('cancel', async (ctx: Context) => {
  if (!ctx.from) {
    return ctx.reply('Unable to identify user.')
  }

  const userId = ctx.from.id
  clearUserSession(userId, sessions)

  await ctx.reply(
    '❌ Authorization process cancelled.\n\n' + 'Use /start to begin again.',
  )
})

// Text message handler - receive text response
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
      'Please start the authorization process first using /start',
    )
  }

  // Check if user is on the correct step
  if (session.step !== 'text') {
    if (session.step === 'phone') {
      return ctx.reply(
        'Please share your phone number using the button provided.',
      )
    } else if (session.step === 'poll') {
      return ctx.reply('Please answer the poll first.')
    } else {
      return ctx.reply('You have already completed the authorization process.')
    }
  }

  // Validate text response
  const textResponse = ctx.message.text.trim()

  if (textResponse.length < 10) {
    return ctx.reply(
      '❌ Your response is too short. Please provide at least 10 characters.\n\n' +
        'Try again:',
    )
  }

  if (textResponse.length > 500) {
    return ctx.reply(
      '❌ Your response is too long. Please keep it under 500 characters.\n\n' +
        'Try again:',
    )
  }

  // Store text response and update step to completed
  session.textResponse = textResponse
  session.step = 'completed'

  // Send confirmation to user
  await ctx.reply('✅ Thank you! Your application is being reviewed.')

  // Send data to admin using helper function
  try {
    await sendToAdmin(bot, session, config.adminChatId)
  } catch (error) {
    console.error('[Text Handler] Error sending to admin:', error)
    await ctx.reply(
      '⚠️ There was an error submitting your application. Please contact support.',
    )
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
    return ctx.answerCbQuery('⛔ Unauthorized. Admin only.', {
      show_alert: true,
    })
  }

  // Parse callback data: "approve:userId" or "reject:userId"
  const [action, userIdStr] = callbackData.split(':')
  const userId = parseInt(userIdStr)

  if (!action || !userId) {
    return ctx.answerCbQuery('Invalid callback data', { show_alert: true })
  }

  // Get user session
  const session = sessions.get(userId)
  if (!session) {
    return ctx.answerCbQuery('⚠️ User session not found', { show_alert: true })
  }

  try {
    if (action === 'approve') {
      // Create invite link for the channel
      const invite = await bot.telegram.createChatInviteLink(config.channelId, {
        member_limit: 1,
        expire_date: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
      })

      // Send invite to user
      await bot.telegram.sendMessage(
        userId,
        `✅ Your authorization request has been approved!\n\n` +
          `Join the channel using this link: ${invite.invite_link}\n\n` +
          `Note: This link expires in 1 hour.`,
      )

      // Update admin message
      await ctx.editMessageReplyMarkup({ inline_keyboard: [] })
      await ctx.editMessageText(
        ctx.callbackQuery.message?.date + '\n\n✅ <b>APPROVED</b>',
        { parse_mode: 'HTML' },
      )

      // Clear user session
      clearUserSession(userId, sessions)

      await ctx.answerCbQuery('✅ User approved and invite sent!')
      console.log(`[Admin] User ${userId} approved by admin`)
    } else if (action === 'reject') {
      // Notify user of rejection
      await bot.telegram.sendMessage(
        userId,
        '❌ Your authorization request has been rejected.\n\n' +
          'If you believe this is an error, please contact support.',
      )

      // Update admin message
      await ctx.editMessageReplyMarkup({ inline_keyboard: [] })
      await ctx.editMessageText(
        ctx.callbackQuery.message?.date + '\n\n❌ <b>REJECTED</b>',
        { parse_mode: 'HTML' },
      )

      // Clear user session
      clearUserSession(userId, sessions)

      await ctx.answerCbQuery('❌ User rejected and notified.')
      console.log(`[Admin] User ${userId} rejected by admin`)
    } else {
      await ctx.answerCbQuery('Unknown action', { show_alert: true })
    }
  } catch (error) {
    console.error('[Callback] Error processing admin action:', error)
    await ctx.answerCbQuery('⚠️ Error processing request', { show_alert: true })
  }
})

// Request command - users send authorization requests
bot.command('request', async (ctx: Context) => {
  const userInfo = formatUserInfo(ctx)

  try {
    // Send request to admin
    await bot.telegram.sendMessage(
      config.adminChatId,
      `📝 New Access Request:\n\n${userInfo}\n\n` +
        `Use /approve ${ctx.from?.id} or /deny ${ctx.from?.id} to respond.`,
    )

    await ctx.reply('Your request has been submitted to the admin for review.')
  } catch (error) {
    console.error('Error sending request to admin:', error)
    await ctx.reply('Failed to submit request. Please try again later.')
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
//     console.error('Error approving user:', error)
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
//     console.error('Error denying user:', error)
//     await ctx.reply(`Failed to notify user ${userId}. Error: ${error}`)
//   }
// })

// Help command
bot.help(async (ctx: Context) => {
  const isAdmin = ctx.chat?.id.toString() === config.adminChatId

  let helpText =
    '🤖 Bot Commands:\n\n' +
    '/start - Start the bot\n' +
    '/request - Request channel access\n' +
    '/help - Show this help message'

  if (isAdmin) {
    helpText +=
      '\n\nAdmin Commands:\n' +
      '/approve <user_id> - Approve user request\n' +
      '/deny <user_id> - Deny user request'
  }

  await ctx.reply(helpText)
})

// Error handling
bot.catch((err: unknown, ctx: Context) => {
  console.error('Bot error:', err)
  ctx.reply('An error occurred. Please try again later.')
})

console.log(1234)
// Launch bot
bot
  .launch()
  .then(() => {
    console.log('Bot started successfully!')
  })
  .catch(err => {
    console.error('Failed to start bot:', err)
    process.exit(1)
  })

// Enable graceful shutdown
process.once('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...')
  bot.stop('SIGINT')
  process.exit(0)
})

process.once('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...')
  bot.stop('SIGTERM')
  process.exit(0)
})
