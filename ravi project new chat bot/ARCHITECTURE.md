# ChatBot Platform - Architecture Documentation

## Overview

The ChatBot Platform is a full-stack web application that enables users to create and interact with custom AI chatbots. The architecture follows a modern client-server model with clear separation of concerns.

## System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                              Client Layer                               │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                     React + Vite + TypeScript                     │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │  │
│  │  │  Login   │  │Dashboard │  │   Chat   │  │ProjectSettings   │ │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘ │  │
│  │                         ▲                                         │  │
│  │                         │                                         │  │
│  │              ┌──────────────────────┐                            │  │
│  │              │   Zustand Stores     │                            │  │
│  │              │  (Auth, Projects,    │                            │  │
│  │              │   Chat State)        │                            │  │
│  │              └──────────────────────┘                            │  │
│  └───────────────────────────┬──────────────────────────────────────┘  │
└──────────────────────────────┼──────────────────────────────────────────┘
                               │ HTTP/REST + SSE
                               ▼
┌────────────────────────────────────────────────────────────────────────┐
│                              Server Layer                               │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                   Express.js + TypeScript                         │  │
│  │  ┌─────────────────────────────────────────────────────────────┐ │  │
│  │  │                    Middleware Layer                          │ │  │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │ │  │
│  │  │  │   CORS   │  │   JSON   │  │   Auth   │  │  Multer    │  │ │  │
│  │  │  │  Parser  │  │  Parser  │  │   JWT    │  │  Upload    │  │ │  │
│  │  │  └──────────┘  └──────────┘  └──────────┘  └────────────┘  │ │  │
│  │  └─────────────────────────────────────────────────────────────┘ │  │
│  │                              ▲                                    │  │
│  │  ┌───────────────────────────┴───────────────────────────────┐   │  │
│  │  │                     Route Handlers                         │   │  │
│  │  │  ┌────────┐  ┌──────────┐  ┌────────┐  ┌────────┐        │   │  │
│  │  │  │  Auth  │  │ Projects │  │  Chat  │  │ Files  │        │   │  │
│  │  │  └────────┘  └──────────┘  └────────┘  └────────┘        │   │  │
│  │  └─────────────────────────────────────────────────────────────┘ │  │
│  │                              │                                    │  │
│  │                              ▼                                    │  │
│  │  ┌─────────────────────────────────────────────────────────────┐ │  │
│  │  │                    Services Layer                           │ │  │
│  │  │  ┌────────────────────────────────────────────────────────┐│ │  │
│  │  │  │              LLM Service (OpenRouter)                  ││ │  │
│  │  │  │  • sendChatMessage() - Non-streaming                   ││ │  │
│  │  │  │  • streamChatMessage() - SSE Streaming                 ││ │  │
│  │  │  └────────────────────────────────────────────────────────┘│ │  │
│  │  └─────────────────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────┬──────────────────────────────────┘  │
└──────────────────────────────────┼──────────────────────────────────────┘
                                   │ Prisma ORM
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                              Data Layer                                 │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                         SQLite Database                           │  │
│  │  ┌────────┐  ┌────────────┐  ┌────────────────┐  ┌─────────────┐ │  │
│  │  │ Users  │──│  Projects  │──│ Conversations  │──│  Messages   │ │  │
│  │  └────────┘  └────────────┘  └────────────────┘  └─────────────┘ │  │
│  │       │            │                                              │  │
│  │       │      ┌─────┴─────┐                                       │  │
│  │       │      │           │                                       │  │
│  │       │  ┌───────┐  ┌────────┐                                   │  │
│  │       │  │Prompts│  │ Files  │                                   │  │
│  │       │  └───────┘  └────────┘                                   │  │
│  └───────┴──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          External Services                              │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                        OpenRouter API                             │  │
│  │     Provides access to: GPT-4, Claude, Gemini, Llama, etc.       │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

## Database Schema

### Entity Relationship Diagram

```
┌──────────────────┐       ┌──────────────────┐
│      User        │       │     Project      │
├──────────────────┤       ├──────────────────┤
│ id (PK)          │───┐   │ id (PK)          │
│ email (unique)   │   │   │ name             │
│ password (hash)  │   └──>│ userId (FK)      │
│ name             │       │ description      │
│ createdAt        │       │ systemPrompt     │
│ updatedAt        │       │ model            │
└──────────────────┘       │ createdAt        │
                           │ updatedAt        │
                           └────────┬─────────┘
                                    │
          ┌─────────────────────────┼───────────────────────┐
          │                         │                       │
          ▼                         ▼                       ▼
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│     Prompt       │     │   Conversation   │     │      File        │
├──────────────────┤     ├──────────────────┤     ├──────────────────┤
│ id (PK)          │     │ id (PK)          │     │ id (PK)          │
│ projectId (FK)   │     │ projectId (FK)   │     │ projectId (FK)   │
│ name             │     │ title            │     │ filename         │
│ content          │     │ createdAt        │     │ originalName     │
│ createdAt        │     │ updatedAt        │     │ mimeType         │
│ updatedAt        │     └────────┬─────────┘     │ size             │
└──────────────────┘              │               │ createdAt        │
                                  ▼               └──────────────────┘
                        ┌──────────────────┐
                        │     Message      │
                        ├──────────────────┤
                        │ id (PK)          │
                        │ conversationId   │
                        │ role             │
                        │ content          │
                        │ createdAt        │
                        └──────────────────┘
```

## Data Flow

### Authentication Flow

```
┌──────────┐         ┌──────────┐         ┌──────────┐
│  Client  │         │  Server  │         │ Database │
└────┬─────┘         └────┬─────┘         └────┬─────┘
     │                    │                    │
     │ POST /auth/login   │                    │
     │ {email, password}  │                    │
     │───────────────────>│                    │
     │                    │  Find user by      │
     │                    │  email             │
     │                    │───────────────────>│
     │                    │<───────────────────│
     │                    │  User data         │
     │                    │                    │
     │                    │ Verify bcrypt hash │
     │                    │ Generate JWT       │
     │                    │                    │
     │ {token, user}      │                    │
     │<───────────────────│                    │
     │                    │                    │
     │ Store token in     │                    │
     │ localStorage       │                    │
     │                    │                    │
```

### Chat Streaming Flow

```
┌──────────┐         ┌──────────┐         ┌──────────┐         ┌────────────┐
│  Client  │         │  Server  │         │ Database │         │ OpenRouter │
└────┬─────┘         └────┬─────┘         └────┬─────┘         └─────┬──────┘
     │                    │                    │                     │
     │ POST /chat/stream  │                    │                     │
     │ {message}          │                    │                     │
     │───────────────────>│                    │                     │
     │                    │ Get project &      │                     │
     │                    │ conversation       │                     │
     │                    │───────────────────>│                     │
     │                    │<───────────────────│                     │
     │                    │                    │                     │
     │                    │ Save user message  │                     │
     │                    │───────────────────>│                     │
     │                    │                    │                     │
     │ SSE: conversationId│                    │                     │
     │<───────────────────│                    │                     │
     │                    │                    │                     │
     │                    │ POST /chat/completions (stream)          │
     │                    │─────────────────────────────────────────>│
     │                    │                                          │
     │                    │<─ ─ ─ ─ ─ ─ ─ SSE chunks ─ ─ ─ ─ ─ ─ ─ ─│
     │ SSE: chunk         │                                          │
     │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─│                                          │
     │ SSE: chunk         │                                          │
     │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─│                                          │
     │                    │                                          │
     │                    │ Save assistant msg │                     │
     │                    │───────────────────>│                     │
     │                    │                    │                     │
     │ SSE: done          │                    │                     │
     │<───────────────────│                    │                     │
```

## Security Considerations

### Authentication
- Passwords are hashed using bcrypt with 12 salt rounds
- JWT tokens expire after 7 days
- Tokens are validated on every protected request

### Authorization
- All project/prompt/chat resources are scoped to the authenticated user
- Ownership verification before any CRUD operation

### Input Validation
- All API inputs validated using Zod schemas
- SQL injection prevented by Prisma ORM
- XSS mitigated by React's default escaping

### API Security
- CORS configured to allow only the frontend origin
- Rate limiting recommended for production

## Scalability Considerations

### Current Design (SQLite)
- Suitable for development and small deployments
- Single-file database, easy backup and migration

### Production Recommendations
1. **Database**: Migrate to PostgreSQL for better concurrency
2. **Caching**: Add Redis for session management and response caching
3. **Load Balancing**: Deploy multiple server instances behind a load balancer
4. **CDN**: Serve static frontend assets via CDN
5. **Horizontal Scaling**: Stateless server design allows easy scaling

### Database Migration Path
```prisma
// Simply change the datasource in schema.prisma
datasource db {
  provider = "postgresql"  // Change from "sqlite"
  url      = env("DATABASE_URL")
}
```

## Extensibility Points

The architecture is designed for easy extension:

| Feature | Extension Point |
|---------|-----------------|
| New LLM providers | Add to `services/llm.ts` |
| Analytics | Add new routes and database models |
| Webhooks | Add webhook service and event emitters |
| API versioning | Create `/api/v2` route prefix |
| Multi-tenancy | Add organization layer above users |

## Performance Optimizations

1. **Streaming Responses**: SSE provides low-latency perceived response time
2. **Database Indexes**: Applied on foreign keys for fast queries
3. **Connection Pooling**: Prisma manages database connection pool
4. **Client-side Caching**: Zustand persists auth state to localStorage

## Deployment Options

### Option 1: Traditional VPS
- Deploy Node.js server with PM2
- Serve React build with Nginx
- SQLite file on disk (or PostgreSQL)

### Option 2: Containerized
- Dockerfile for both server and client
- Docker Compose for local development
- Deploy to AWS ECS, GCP Cloud Run, or similar

### Option 3: Serverless
- Adapt Express to AWS Lambda with serverless-express
- Use Prisma Accelerate for connection pooling
- Deploy frontend to Vercel/Netlify

## Technology Decisions Rationale

| Choice | Reasoning |
|--------|-----------|
| **Express.js** | Mature, well-documented, extensive middleware ecosystem |
| **Prisma** | Type-safe database access, easy migrations, great DX |
| **SQLite** | Zero configuration, perfect for development/small deployments |
| **React + Vite** | Fast development, excellent TypeScript support |
| **Zustand** | Lightweight, simple API, no boilerplate |
| **OpenRouter** | Single API for multiple LLM providers, easy switching |

---

This architecture provides a solid foundation for a production chatbot platform while remaining simple enough for rapid development and iteration.
