# Testing Checklist - Telegram Authorization Bot

Use this checklist to verify all bot functionality before production deployment.

## Pre-Testing Setup

- [ ] `.env` file created with valid credentials
- [ ] Bot token configured correctly
- [ ] Admin chat ID is your user ID
- [ ] Channel ID configured (bot added as admin)
- [ ] Bot started successfully (`yarn start:auth-bot:dev`)
- [ ] No errors in console on startup

## Core Authorization Flow

### Step 1: Start Command
- [ ] `/start` command works
- [ ] Welcome message displays correctly
- [ ] Explains 3-step process clearly
- [ ] "Share Phone Number" button appears
- [ ] Session created (check logs)

### Step 2: Phone Number Collection
- [ ] Tapping button shares phone number
- [ ] Phone number accepted if it's user's own number
- [ ] ✅ Confirmation message appears
- [ ] Keyboard removed after sharing
- [ ] Poll question appears immediately (Step 2)

### Step 3: Phone Validation
- [ ] Sharing someone else's phone number is rejected
- [ ] Error message displays explaining the issue
- [ ] Button re-appears to try again
- [ ] User can successfully share own number after error

### Step 4: Poll Response
- [ ] Poll displays with two options
- [ ] Poll is non-anonymous
- [ ] Selecting Option A stores choice correctly
- [ ] Selecting Option B stores choice correctly
- [ ] ✅ Confirmation message appears
- [ ] Text input prompt appears (Step 3)

### Step 5: Text Input Validation
- [ ] Text under 10 characters is rejected
- [ ] Error message explains minimum length
- [ ] Text over 500 characters is rejected
- [ ] Error message explains maximum length
- [ ] Valid text (10-500 chars) is accepted
- [ ] ✅ "Thank you" confirmation appears

## Admin Review Process

### Admin Receives Application
- [ ] Admin receives formatted message
- [ ] Message includes user info (ID, username, name)
- [ ] Phone number displayed correctly
- [ ] Poll choice displayed correctly
- [ ] Text response displayed correctly
- [ ] Timestamp included
- [ ] Two inline buttons appear (✅ Approve, ❌ Reject)

### Approval Flow
- [ ] Clicking ✅ Approve button works
- [ ] Admin sees popup confirmation
- [ ] Buttons disappear from admin message
- [ ] Message updates with "APPROVED" status
- [ ] User receives approval notification
- [ ] User receives channel invite link
- [ ] Invite link works and adds user to channel
- [ ] Invite link expires after 1 hour
- [ ] Session cleared after approval

### Rejection Flow
- [ ] Clicking ❌ Reject button works
- [ ] Admin sees popup confirmation
- [ ] Buttons disappear from admin message
- [ ] Message updates with "REJECTED" status
- [ ] User receives rejection notification
- [ ] User NOT added to channel
- [ ] Session cleared after rejection

## Command Testing

### User Commands
- [ ] `/help` shows user commands correctly
- [ ] `/cancel` cancels current session
- [ ] `/cancel` clears session (check logs)
- [ ] `/cancel` prompts user to `/start` again
- [ ] User can restart after `/cancel`

### Admin Commands (Legacy)
- [ ] `/help` shows admin commands when sent by admin
- [ ] `/approve <user_id>` works manually
- [ ] `/deny <user_id>` works manually
- [ ] Non-admin cannot use admin commands

## Error Handling & Edge Cases

### Session Management
- [ ] User without session prompted to `/start`
- [ ] User at phone step cannot skip to poll
- [ ] User at poll step cannot skip to text
- [ ] User at text step cannot go back to phone
- [ ] Completed users told process is done

### Invalid Input
- [ ] Commands during text input ignored properly
- [ ] Random text at wrong step handled gracefully
- [ ] Contact shared at wrong step rejected properly
- [ ] Poll answer at wrong step ignored

### Bot Restart Scenarios
- [ ] Bot restart clears in-memory sessions
- [ ] Users get "session not found" if mid-process
- [ ] Users can restart flow after bot restart
- [ ] No crashes or data corruption

### Network & API Errors
- [ ] Bot handles Telegram API failures gracefully
- [ ] User notified if admin message fails
- [ ] Error logged to console with details
- [ ] Bot continues running after errors
- [ ] Admin notified if invite link creation fails

## Security Testing

### Phone Number Security
- [ ] Cannot share someone else's phone
- [ ] Phone validation checks `user_id` match
- [ ] Error message doesn't leak sensitive info

### Admin Authorization
- [ ] Non-admin cannot click approve button
- [ ] Non-admin cannot click reject button
- [ ] Callback query verifies admin ID
- [ ] Admin commands verify sender ID

### Input Sanitization
- [ ] Long text (>500 chars) rejected
- [ ] Short text (<10 chars) rejected
- [ ] Special characters in text handled properly
- [ ] HTML/script tags don't break formatting

## Performance Testing

### Response Times
- [ ] Bot responds to `/start` within 1 second
- [ ] Phone submission processed quickly
- [ ] Poll answer processed immediately
- [ ] Text submission processed quickly
- [ ] Admin buttons respond instantly

### Concurrent Users
- [ ] Multiple users can use bot simultaneously
- [ ] Sessions don't interfere with each other
- [ ] Admin receives applications in order
- [ ] No race conditions observed

## UI/UX Testing

### Message Formatting
- [ ] All messages display correctly
- [ ] Emojis render properly
- [ ] Text formatting (bold, italic, code) works
- [ ] Admin message uses HTML formatting
- [ ] Long messages don't overflow

### User Experience
- [ ] Instructions are clear at each step
- [ ] Error messages are helpful
- [ ] Progress indicators show current step (1/3, 2/3, 3/3)
- [ ] Buttons are clearly labeled
- [ ] Flow feels natural and intuitive

### Admin Experience
- [ ] Admin messages easy to read
- [ ] User data clearly presented
- [ ] Buttons clearly labeled
- [ ] Feedback immediate on button click
- [ ] Easy to process multiple applications

## Logging & Debugging

### Console Logs
- [ ] Startup logs show successful initialization
- [ ] Session creation logged
- [ ] Session clearing logged
- [ ] Admin actions logged with user ID
- [ ] Errors logged with stack traces

### Log Prefixes Work
- [ ] `[Admin]` prefix on admin logs
- [ ] `[Session]` prefix on session logs
- [ ] `[Callback]` prefix on button clicks
- [ ] `[Text Handler]` prefix on text processing

## Cleanup & Maintenance

### Session Cleanup
- [ ] Sessions cleared on approval
- [ ] Sessions cleared on rejection
- [ ] Sessions cleared on `/cancel`
- [ ] Memory usage stable over time

### Bot Shutdown
- [ ] SIGINT (Ctrl+C) triggers graceful shutdown
- [ ] SIGTERM triggers graceful shutdown
- [ ] Bot stops cleanly without errors
- [ ] Shutdown message logged

## Documentation Verification

- [ ] README.md includes all setup steps
- [ ] Environment variables documented
- [ ] Commands listed in README
- [ ] Troubleshooting section complete
- [ ] TESTING.md checklist complete

## Pre-Production Checklist

- [ ] All tests above passed
- [ ] Environment variables secured
- [ ] Error handling tested thoroughly
- [ ] Bot permissions verified on channel
- [ ] Admin ID verified correct
- [ ] Logs reviewed for warnings
- [ ] Memory leaks checked
- [ ] Performance acceptable under load

---

## Test Results

**Date Tested**: _______________

**Tested By**: _______________

**Environment**: [ ] Development  [ ] Staging  [ ] Production

**Overall Status**: [ ] PASS  [ ] FAIL

**Notes**:
_______________________________________________________________
_______________________________________________________________
_______________________________________________________________

**Issues Found**:
_______________________________________________________________
_______________________________________________________________
_______________________________________________________________

**Sign-off**: _______________
