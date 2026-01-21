# Telegram Authorization Bot

A Telegram bot that manages channel access through a 3-step authorization process. Users must share their phone number, answer a poll, and provide a text response before being reviewed by an admin.

## Features

- **Multi-step Authorization Flow**
  - Step 1: Phone number collection with validation
  - Step 2: Interactive poll response
  - Step 3: Text response with validation (10-500 characters)

- **Admin Dashboard**
  - Receive formatted user applications with all collected data
  - One-click Approve/Reject via inline buttons
  - Automatic channel invite link generation (1-hour expiry)

- **Session Management**
  - In-memory session storage
  - State tracking per user
  - Cancel command to restart process

- **Security**
  - Phone number ownership validation
  - Admin-only command protection
  - Input validation at each step

## Prerequisites

- Node.js 16+ or Yarn
- A Telegram Bot Token from [@BotFather](https://t.me/BotFather)
- Admin Telegram User ID
- Telegram Channel ID or username

## Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd concierge-bot
```

2. Install dependencies:
```bash
yarn install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your configuration:
```env
BOT_TOKEN=your_bot_token_from_botfather
ADMIN_CHAT_ID=your_telegram_user_id
CHANNEL_ID=@your_channel_or_channel_id
```

## Getting Your Configuration Values

### Bot Token
1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Send `/newbot` command
3. Follow prompts to create your bot
4. Copy the provided token

### Admin Chat ID
1. Message [@userinfobot](https://t.me/userinfobot) on Telegram
2. Copy your numeric user ID

### Channel ID
- For public channels: Use `@channelname`
- For private channels: Use the numeric ID (e.g., `-1001234567890`)
- Make sure the bot is added as an administrator to the channel

## Usage

### Development Mode (with hot reload)
```bash
yarn start:auth-bot:dev
```

### Production Mode
```bash
# Build TypeScript
yarn build:auth-bot

# Run compiled code
yarn start:auth-bot
```

## Bot Commands

### User Commands
- `/start` - Start the authorization process
- `/cancel` - Cancel and restart the authorization process
- `/help` - Display help information

### Admin Commands
- `/approve <user_id>` - Manually approve a user (legacy)
- `/deny <user_id>` - Manually deny a user (legacy)
- **Inline Buttons** (recommended) - Click Approve/Reject on application messages

## Authorization Flow

1. **User starts the bot**
   - `/start` command initializes session
   - Bot explains 3-step process

2. **Step 1: Phone Number**
   - User taps "Share Phone Number" button
   - Bot validates ownership (must be user's own number)
   - Phone stored in session

3. **Step 2: Poll**
   - Bot sends non-anonymous poll
   - User selects Option A or Option B
   - Choice stored in session

4. **Step 3: Text Response**
   - User types a message (10-500 characters)
   - Validation enforced
   - Application submitted to admin

5. **Admin Review**
   - Admin receives formatted message with all data
   - Clicks ✅ Approve or ❌ Reject
   - User receives notification

6. **Approval**
   - User gets channel invite link (expires in 1 hour)
   - Session cleared

## Project Structure

```
concierge-bot/
├── src/
│   ├── index.ts       # Main bot logic and handlers
│   ├── types.ts       # TypeScript interfaces
│   └── utils.ts       # Helper functions
├── .env.example       # Environment template
├── .env               # Your configuration (gitignored)
├── package.json       # Dependencies and scripts
├── tsconfig.json      # TypeScript configuration
└── README.md          # This file
```

## Development

### Adding New Features

1. **New validation rules**: Edit validation in `src/index.ts` handlers
2. **Custom message formatting**: Modify `formatAdminMessage()` in `src/utils.ts`
3. **Additional steps**: Extend `UserState` interface in `src/types.ts`

### Debugging

Enable debug logging by checking console output:
- `[Admin]` - Admin-related actions
- `[Session]` - Session management
- `[Callback]` - Inline button handling
- `[Text Handler]` - Text message processing

## Error Handling

The bot includes comprehensive error handling:
- Invalid environment variables → Descriptive errors on startup
- Missing sessions → User prompted to `/start`
- Wrong step → User redirected to correct step
- API failures → User notified, errors logged
- Admin actions → Feedback via popup notifications

## Security Considerations

- **Phone Validation**: Only accepts user's own phone number
- **Admin Protection**: Commands and callbacks verified against `ADMIN_CHAT_ID`
- **Input Sanitization**: Text length limits enforced
- **Session Isolation**: Each user has independent session state

## Troubleshooting

### Bot doesn't respond
- Check `BOT_TOKEN` is correct
- Verify bot is running (`yarn start:auth-bot:dev`)
- Check console for error messages

### Admin doesn't receive messages
- Verify `ADMIN_CHAT_ID` is your numeric user ID
- Check bot has permission to message you

### Invite links don't work
- Ensure bot is added as administrator to the channel
- Verify `CHANNEL_ID` is correct (include `@` for public channels)
- Check bot has "Invite Users via Link" permission

### "Session not found" errors
- Sessions are stored in memory and cleared on bot restart
- Users must complete flow in one session
- Consider implementing persistent storage for production

## Production Deployment

### Environment Variables
Ensure all required variables are set:
- `BOT_TOKEN` - Bot authentication token
- `ADMIN_CHAT_ID` - Admin user ID (numeric)
- `CHANNEL_ID` - Target channel identifier

### Process Management
Use a process manager like PM2:
```bash
yarn global add pm2
yarn build:auth-bot
pm2 start dist/index.js --name telegram-auth-bot
pm2 save
```

### Docker Support (Optional)
See Docker section below for containerized deployment.

## License

MIT

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review console logs for specific errors
3. Verify all environment variables are correct
4. Ensure bot has proper channel permissions

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

---

**Note**: This bot uses in-memory session storage. For production use with multiple instances or high traffic, consider implementing persistent storage (Redis, database, etc.).
