# RBAC System

A full-stack **Role-Based Access Control** system built as an assignment project. It demonstrates how to design and implement fine-grained permission management — from JWT authentication and permission atoms on the API, all the way to a polished admin dashboard UI.

---

## What is this project?

Most apps have simple roles like _admin_ or _user_. This project goes further — every action a user can perform (reading a list, granting permissions, viewing logs) is controlled by a discrete **permission atom** like `users:read` or `permissions:grant`. Roles give a rough grouping, but exact access is controlled atom-by-atom per user.

This pattern is known as **Dynamic RBAC** and is used in enterprise systems where different team members need different slices of access even within the same role.

---

## Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Framework | NestJS 11 (Node.js) |
| Language | TypeScript |
| Database | PostgreSQL |
| ORM | Prisma 7 |
| Auth | JWT (access + refresh tokens) via Passport.js |
| Password hashing | bcrypt |
| Rate limiting | `@nestjs/throttler` |
| Validation | `class-validator` + `class-transformer` |
| Runtime | Node.js ≥ 20 |
| Package manager | pnpm |

### Frontend
| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Design system | Obliq (warm cream + orange brand) |
| Package manager | pnpm |

---

## Features

### Authentication
- Email + password login with rate limiting (5 attempts/min per IP)
- Short-lived **access token** (15 minutes) sent in the response body
- Long-lived **refresh token** (7 days) stored in an `httpOnly` cookie — never exposed to JavaScript
- Secure logout that revokes the refresh token in the database

### User Management
- Create, read, update users
- **Suspend** a user (soft disable — blocks login, keeps data)
- **Reactivate** a suspended user
- **Ban** a user (permanent block)
- **Unban** a banned user
- Manager hierarchy — users can have a `managerId` linking them to their manager

### Permission Atoms
Each user has a set of permission atoms that control exactly what they can do:

| Atom | What it allows |
|---|---|
| `users:read` | View user list and profiles |
| `users:create` | Create new users |
| `users:update` | Edit users, suspend/reactivate |
| `users:delete` | Ban/unban users |
| `permissions:read` | View permission assignments |
| `permissions:grant` | Grant or revoke permission atoms |
| `audit:read` | View the audit log |
| `settings:manage` | Access settings |

Admins can grant or revoke any of these from any user through the UI.

### Audit Log
Every sensitive action (permission grants, user suspension, bans) is automatically recorded with:
- Who did it (actor)
- Who it was done to (target)
- What changed (before/after payload)
- When it happened (timestamp)

The audit log is read-only and append-only — nothing can be deleted through the API.

### Roles
Four roles provide a baseline grouping on top of permission atoms:

| Role | Intended for |
|---|---|
| `ADMIN` | Full system access |
| `MANAGER` | Team leads, can manage their staff |
| `AGENT` | Operational staff with limited access |
| `CUSTOMER` | End users, minimal access |

### Frontend Dashboard
- **Login page** — branded with the Obliq design, secure token handling
- **Dashboard** — stats overview (total users, permission atoms, audit events)
- **Users page** — table with suspend/ban actions
- **Permissions page** — view and toggle atoms per user
- **Audit Log page** — paginated read-only event history
- **403 page** — shown automatically when a user lacks the required atom
- Route-level permission guards — pages are hidden in the sidebar if the user lacks access

---

## Project Structure

```
rbac-system/
├── backend/                  # NestJS API
│   ├── prisma/
│   │   ├── schema.prisma     # Database models
│   │   └── seed.ts           # Demo data (admin + sample users)
│   └── src/
│       ├── auth/             # Login, refresh, logout, JWT strategy
│       ├── users/            # User CRUD + suspend/ban + permissions
│       ├── audit/            # Audit log + AuditInterceptor
│       ├── common/           # Guards, decorators (JwtAuthGuard, PermissionGuard)
│       └── prisma/           # PrismaService
│
└── frontend/                 # Next.js App Router
    └── src/
        ├── app/
        │   ├── login/        # Login page
        │   ├── dashboard/    # Main layout + all dashboard pages
        │   └── 403/          # Access denied page
        ├── components/       # Sidebar, shared UI components
        ├── context/          # AuthContext (token + user state)
        └── config/           # Navigation config, route permissions
```

---

## API Endpoints

| Method | Path | Auth | Permission needed |
|---|---|---|---|
| `POST` | `/api/auth/login` | — | — |
| `POST` | `/api/auth/refresh` | Cookie | — |
| `POST` | `/api/auth/logout` | Cookie | — |
| `GET` | `/api/users` | JWT | `users:read` |
| `POST` | `/api/users` | JWT | `users:create` |
| `GET` | `/api/users/:id` | JWT | `users:read` |
| `PATCH` | `/api/users/:id` | JWT | `users:update` |
| `PATCH` | `/api/users/:id/suspend` | JWT | `users:update` |
| `PATCH` | `/api/users/:id/reactivate` | JWT | `users:update` |
| `PATCH` | `/api/users/:id/ban` | JWT | `users:delete` |
| `PATCH` | `/api/users/:id/unban` | JWT | `users:delete` |
| `PATCH` | `/api/users/:id/permissions` | JWT | `permissions:grant` |
| `GET` | `/api/audit` | JWT | `audit:read` |

---

## Getting Started

### Prerequisites
- Node.js ≥ 20
- PostgreSQL (or Docker)
- pnpm (`npm install -g pnpm`)

### 1. Clone and install

```bash
git clone <repo-url>
cd rbac-system

# Install backend dependencies
cd backend && pnpm install

# Install frontend dependencies
cd ../frontend && pnpm install
```

### 2. Configure environment

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env — fill in DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET

# Frontend
cp frontend/.env.example frontend/.env.local
# Edit frontend/.env.local if your API runs on a different port
```

### 3. Set up the database

```bash
cd backend
pnpm prisma migrate dev   # run migrations
pnpm run seed             # create demo users
```

### 4. Start the servers

```bash
# Terminal 1 — Backend (port 3000)
cd backend && pnpm run start:dev

# Terminal 2 — Frontend (port 3001)
cd frontend && PORT=3001 pnpm run dev
```

Open [http://localhost:3001/login](http://localhost:3001/login)

### Demo credentials (after seeding)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@rbac.dev` | `Admin@1234` |
| Manager | `manager@rbac.dev` | `Manager@1234` |

---

## Who can use this?

- **Students** learning backend security, JWT auth, or database design — this project shows a real, production-style approach to all three
- **Developers** building admin panels or internal tools who need a reference for implementing permission guards in NestJS + Next.js
- **Teams** that want to fork this as a starting point for a user management service
- **Anyone** evaluating how to model fine-grained access control in a relational database (Prisma + PostgreSQL)

---

## Security notes

- Passwords are hashed with bcrypt (cost factor 10)
- Refresh tokens are stored as SHA-256 hashes — the raw token is never saved
- Access tokens expire in 15 minutes; refresh tokens expire in 7 days
- Login is rate-limited to 5 attempts per minute per IP
- All mutating endpoints validate and strip unknown fields via `class-validator`
- `.env` files are gitignored — copy `.env.example` and never commit real credentials
