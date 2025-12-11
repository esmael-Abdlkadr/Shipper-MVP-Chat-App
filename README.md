# 🚀 Shipper Chat

A modern real-time chat application with AI-powered features, group collaboration, and smart task management.


---

## 📺 Demo Video

[![Watch Demo](https://img.shields.io/badge/▶️_Watch_Demo_on_Loom-FF0000?style=for-the-badge&logo=loom&logoColor=white)](https://www.loom.com/share/e6ce43ef72d24ca89f715a2ca0285789)

<a href="https://www.loom.com/share/e6ce43ef72d24ca89f715a2ca0285789">
  <img src="https://cdn.loom.com/sessions/thumbnails/e6ce43ef72d24ca89f715a2ca0285789-with-play.gif" alt="Shipper Chat Demo" width="600" />
</a>

> *Click above to watch a full walkthrough of Shipper Chat*

---

## ✨ Features

### 💬 Real-Time Messaging
- Instant message delivery with live updates
- See when messages are sent, delivered, and read
- Know when someone is typing
- Online/offline status indicators

### 👥 Group Chats
- Create groups and invite members
- Collaborative conversations with your team
- Mention users with `@username`
- Group-specific settings and roles

### 🤖 AI Assistant (Shipper)
- Chat with AI in 1-on-1 conversations
- Mention `@shipper` in group chats for AI help
- Switch between **GPT-4o** and **Gemini** models
- Smart context-aware responses

### ✅ Smart Task Tracking
- AI automatically detects task commitments in messages
- Assign tasks with `@shipper:assign @user task description`
- View tasks with `@shipper:tasks`
- Get daily summaries with `@shipper:summarize`

### 🎯 Rich Interactions
- React to messages with emojis (👍 ❤️ 😂 😮 😢 🙏)
- Double-tap to ❤️ (Instagram-style)
- Reply to specific messages
- Edit and delete your messages

### 🔐 Secure Authentication
- Sign up with email or Google
- Email verification
- Password reset
- Remember me option

---

## 🖼️ Screenshots

| Chat | Groups | AI Assistant |
|:----:|:------:|:------------:|
| ![Chat](https://via.placeholder.com/250x500/1a1a2e/ffffff?text=Chat) | ![Groups](https://via.placeholder.com/250x500/1a1a2e/ffffff?text=Groups) | ![AI](https://via.placeholder.com/250x500/1a1a2e/ffffff?text=AI) |

---

## 🌐 Live Demo

Try it now: **[shipper-chat-app.fly.dev](https://shipper-chat-app.fly.dev)**

---

## 🛠️ Run Locally

Want to run Shipper Chat on your own machine?

### Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/esmael-Abdlkadr/Shipper-MVP-Chat-App.git
cd Shipper-MVP-Chat-App

# 2. Install dependencies
pnpm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# 4. Set up database
pnpm db:generate
pnpm db:push

# 5. Start the app
pnpm dev
```

### Environment Variables

Create a `.env` file with:

```env
# Database (PostgreSQL)
DATABASE_URL="your-database-url"

# Auth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# AI APIs
GOOGLE_GENERATIVE_AI_API_KEY="your-gemini-key"
OPENAI_API_KEY="your-openai-key"

# Email (Resend)
RESEND_API_KEY="your-resend-key"
EMAIL_FROM="noreply@yourdomain.com"
```

---

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit PRs.

---



---

<p align="center">
  Built with ❤️ by <a href="https://github.com/esmael-Abdlkadr">Esmael Abdlkadr</a>
</p>
