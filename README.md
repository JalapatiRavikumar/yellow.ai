# ChatBot Platform

A modern, full-stack AI chatbot platform that enables users to create custom AI-powered agents with personalized prompts and conversational interfaces.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![React](https://img.shields.io/badge/React-18-blue.svg)

## ✨ Features

- **User Authentication** - Secure JWT-based registration and login
- **Project Management** - Create and manage multiple AI chatbot projects
- **Custom System Prompts** - Define unique personalities for each agent
- **Multiple LLM Support** - Use GPT-4, Claude, Gemini, Llama, and more via OpenRouter
- **Real-time Streaming** - See AI responses as they're generated
- **Conversation History** - All chats are saved and organized by project
- **Prompt Templates** - Add reusable context prompts to your projects
- **File Uploads** - Associate files with projects for reference

## 🏗️ Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: SQLite with Prisma ORM
- **Authentication**: JWT (JSON Web Tokens)
- **LLM Integration**: OpenRouter API

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand
- **Routing**: React Router v6
- **Icons**: Lucide React

## 🚀 Quick Start

### Prerequisites
- Node.js 18 or higher
- npm or yarn
- OpenRouter API key (get one at [openrouter.ai](https://openrouter.ai))

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd "ravi project new chat bot"
```

### 2. Setup Backend

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Copy environment file and configure
cp .env.example .env
# Edit .env and add your OPENROUTER_API_KEY

# Setup database
npm run db:generate
npm run db:push

# Start development server
npm run dev
```

The backend will start at `http://localhost:3001`

### 3. Setup Frontend

```bash
# Open a new terminal and navigate to client directory
cd client

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will start at `http://localhost:5173`

### 4. Open in Browser

Navigate to `http://localhost:5173` and create an account to get started!

## 📁 Project Structure

```
├── server/                 # Backend API
│   ├── src/
│   │   ├── index.ts       # Express app entry point
│   │   ├── middleware/    # Auth middleware
│   │   ├── routes/        # API route handlers
│   │   │   ├── auth.ts    # Authentication routes
│   │   │   ├── projects.ts # Project CRUD
│   │   │   ├── prompts.ts # Prompt management
│   │   │   ├── chat.ts    # Chat & streaming
│   │   │   └── files.ts   # File uploads
│   │   └── services/      # Business logic
│   │       └── llm.ts     # OpenRouter integration
│   └── prisma/
│       └── schema.prisma  # Database schema
│
├── client/                 # Frontend React app
│   ├── src/
│   │   ├── main.tsx       # App entry point
│   │   ├── App.tsx        # Root component with routing
│   │   ├── store/         # Zustand state stores
│   │   └── pages/         # Page components
│   │       ├── Login.tsx
│   │       ├── Register.tsx
│   │       ├── Dashboard.tsx
│   │       ├── Chat.tsx
│   │       └── ProjectSettings.tsx
│   └── index.html
│
├── README.md
└── ARCHITECTURE.md
```

## 🔧 Configuration

### Environment Variables (server/.env)

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | SQLite database path | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `OPENROUTER_API_KEY` | Your OpenRouter API key | Yes |
| `PORT` | Server port (default: 3001) | No |
| `FRONTEND_URL` | Frontend URL for CORS | No |

## 📖 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user info

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Chat
- `POST /api/chat/project/:id/send` - Send message (non-streaming)
- `POST /api/chat/project/:id/stream` - Send message (streaming)
- `GET /api/chat/project/:id/conversations` - List conversations
- `GET /api/chat/conversations/:id/messages` - Get messages

### Prompts
- `GET /api/prompts/project/:id` - List prompts
- `POST /api/prompts/project/:id` - Create prompt
- `PUT /api/prompts/:id` - Update prompt
- `DELETE /api/prompts/:id` - Delete prompt

### Files
- `GET /api/files/project/:id` - List files
- `POST /api/files/project/:id` - Upload file
- `DELETE /api/files/:id` - Delete file

## 🎨 Supported LLM Models

Through OpenRouter, you can use:
- OpenAI GPT-3.5 Turbo, GPT-4, GPT-4 Turbo
- Anthropic Claude 3 (Haiku, Sonnet, Opus)
- Google Gemini Pro
- Meta Llama 2
- And many more!

## 🔐 Security Features

- Password hashing with bcrypt (12 rounds)
- JWT token authentication
- Protected API routes
- Input validation with Zod
- CORS configuration
- SQL injection prevention via Prisma

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Built with ❤️ using React, Express, and OpenRouter
