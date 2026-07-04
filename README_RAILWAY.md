# UNIQ Prism Ticket Bot

This version is prepared for Railway deployment and local development.

## What changed

- Users choose the ticket type before a private channel is created.
- Ticket panel has a cleaner embed and a support guide button.
- Tickets now include Claim Ticket and Close Ticket controls.
- Closing a ticket now requires confirmation.
- Ticket logs include a better embed with opened by, closed by, claimed by, type, duration, and transcript file.
- Admin commands include `!help`, `!checkbot`, `!setlogchannel`, and `!logchannel`.
- Firebase supports Railway variables and local `serviceAccountKey.json` testing.
- Local development supports nodemon through `npm run dev`.
- Syntax checking works on Windows, macOS, and Linux through `npm run check`.

## Required Railway variables

Add these in Railway > Service > Variables.

```env
DISCORD_TOKEN=your_new_discord_bot_token
PORT=3000
```

`OWNER_ID` is optional. You can skip it if you have Administrator permission in Discord.

```env
OWNER_ID=your_discord_user_id
```

## Firebase options

Use one of these.

### Option 1: full JSON

```env
FIREBASE_KEY={"type":"service_account","project_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-...@your-project.iam.gserviceaccount.com"}
```

### Option 2: base64 JSON

On Git Bash, WSL, macOS, or Linux:

```bash
base64 -w 0 serviceAccountKey.json
```

Then set:

```env
FIREBASE_KEY_BASE64=paste_the_base64_output_here
```

### Option 3: separate fields

```env
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## Local testing

Install dependencies:

```bash
npm install
```

Run with nodemon:

```bash
npm run dev
```

Run normally:

```bash
npm start
```

Check JavaScript syntax:

```bash
npm run check
```

For local testing, you can use either `.env` Firebase variables or put `serviceAccountKey.json` in the project root. Do not push `serviceAccountKey.json` to GitHub.

## Discord setup commands

Send these inside your Discord server.

```text
!help
!checkbot
!addsupport @Support
!listsupport
!setlogchannel #ticket-logs
!logchannel
!addcategory CATEGORY_ID default
!addcategory CATEGORY_ID report
!addcategory CATEGORY_ID support
!addcategory CATEGORY_ID account
!addcategory CATEGORY_ID partnership
!addcategory CATEGORY_ID other
!listcategories
!panel
```

For category IDs, enable Developer Mode in Discord, right-click the category, then Copy ID.

## Required Discord bot permissions

The bot should have these permissions:

- Manage Channels
- View Channels
- Send Messages
- Embed Links
- Attach Files
- Read Message History
- Manage Messages

Run `!checkbot` to verify permissions in Discord.

## Security notes

Do not commit these files:

- `.env`
- `config.json`
- `serviceAccountKey.json`

If your Discord token was ever pasted or uploaded, reset it in the Discord Developer Portal before deployment.
