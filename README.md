# Shipper Chat

A real-time chat application MVP built with Next.js 14, featuring instant messaging, reactions, replies, and a polished modern UI.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Socket.io](https://img.shields.io/badge/Socket.io-4-white)
![Prisma](https://img.shields.io/badge/Prisma-7-teal)

## Features

### Core Chat
- **Real-time messaging** with Socket.io
- **Optimistic UI updates** - messages appear instantly
- **Message status indicators** - Sending → Sent → Delivered → Seen
- **Typing indicators** with animated bouncing dots
- **Online/offline presence** with pulsing indicators
- **Unread message counts** with badges

### Enhanced Interactions
- **Emoji picker** - Full emoji picker in message input
- **Message reactions** - Quick reactions (👍 ❤️ 😂 😮 😢 🙏)
- **Double-tap to ❤️** - Instagram-style heart reaction
- **Reply to messages** - Quote and reply to specific messages
- **Floating action bar** - Hover (desktop) / long-press (mobile) for actions

### Animations & Polish
- **Message slide-in animations**
- **Reaction pop animations**
- **Heart burst animation** on double-tap
- **Smooth transitions** throughout the app

### Authentication
- **Email/password login** with bcrypt hashing
- **Google OAuth** integration
- **Email verification** via Resend
- **Password reset** functionality
- **JWT sessions** with NextAuth.js v5

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + ShadCN UI |
| Database | PostgreSQL (Neon) |
| ORM | Prisma 7 |
| Real-time | Socket.io |
| Auth | NextAuth.js v5 |
| State | Zustand |
| Email | Resend |

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm (recommended)
- PostgreSQL database (Neon recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/shipper-chat.git
   cd shipper-chat
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your environment variables:
   ```env
   DATABASE_URL="postgresql://..."
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   
   # Google OAuth
   GOOGLE_CLIENT_ID="..."
   GOOGLE_CLIENT_SECRET="..."
   
   # Email (Resend)
   RESEND_API_KEY="..."
   FROM_EMAIL="noreply@yourdomain.com"
   APP_NAME="Shipper Chat"
   
   # Socket.io
   NEXT_PUBLIC_SOCKET_URL="http://localhost:3000"
   ```

4. **Set up the database**
   ```bash
   pnpm db:generate
   pnpm db:push
   ```

5. **Run the development server**
   ```bash
   pnpm dev
   ```

6. **Open the app**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server with Socket.io |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:push` | Push schema to database |
| `pnpm db:studio` | Open Prisma Studio |

## Project Structure

```
├── app/
│   ├── (auth)/          # Auth pages (login, register, etc.)
│   ├── (chat)/          # Chat pages
│   └── api/             # API routes
├── components/
│   ├── chat/            # Chat components
│   ├── auth/            # Auth components
│   ├── layout/          # Layout components
│   ├── providers/       # React providers
│   └── ui/              # ShadCN UI components
├── hooks/               # Custom React hooks
├── lib/
│   ├── api/             # API client functions
│   ├── queries/         # Data fetching hooks
│   └── generated/       # Prisma client
├── stores/              # Zustand stores
├── types/               # TypeScript types
└── prisma/              # Prisma schema
```

## Database Schema

- **User** - User accounts with auth info
- **Account** - OAuth provider accounts
- **ChatSession** - Chat conversations (1:1)
- **Message** - Chat messages with reply support
- **Reaction** - Message reactions
- **Attachment** - File attachments (ready for implementation)
- **AIConversation** - AI chat history (ready for implementation)


---

Built with ❤️ as a technical showcase
