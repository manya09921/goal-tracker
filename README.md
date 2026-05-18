# Goal Tracking Portal — Full-Stack

A full-stack goal tracking application with role-based dashboards for Employees, Managers, and Admins.

```
goal-tracker-fullstack/
├── backend/          # Node.js + Express + MongoDB REST API
├── frontend/         # React + Vite + Tailwind CSS SPA
├── package.json      # Root: runs both servers with one command
└── README.md
```

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | v18+ |
| npm | v9+ |
| MongoDB | v6+ (local) or MongoDB Atlas URI |

---

## Quick Start

### 1. Clone / unzip and install everything

```bash
cd goal-tracker-fullstack

# Install root dev tools (concurrently) + both apps
npm install
npm run install:all
```

### 2. Configure the backend environment

```bash
cp backend/.env.example backend/.env   # if .env doesn't already exist
```

Open `backend/.env` and set:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/goal_tracker   # or your Atlas URI
JWT_SECRET=replace_with_a_long_random_string
JWT_EXPIRES_IN=7d
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### 3. (Optional) Seed demo users

```bash
npm run seed
```

Creates three accounts:

| Email | Password | Role |
|-------|----------|------|
| admin@company.com | Admin1234! | Admin |
| manager@company.com | Manager1234! | Manager |
| employee@company.com | Employee1234! | Employee |

### 4. Run both servers

```bash
npm run dev
```

| Service | URL |
|---------|-----|
| React frontend | http://localhost:3000 |
| Express API | http://localhost:5000 |
| API health check | http://localhost:5000/health |

> The Vite dev server proxies all `/api` requests to the Express backend automatically — no CORS issues during development.

---

## Individual Commands

```bash
npm run dev:backend    # backend only
npm run dev:frontend   # frontend only
npm run build:frontend # production build → frontend/dist/
npm run seed           # seed demo users
npm run start          # production: node backend/src/server.js
```

---

## Architecture

### Backend (`/backend`)

```
src/
├── config/db.js             # Mongoose connection
├── controllers/             # Business logic
│   ├── authController.js
│   ├── goalController.js
│   ├── checkinController.js
│   ├── userController.js
│   └── auditController.js
├── middleware/
│   ├── auth.js              # JWT authenticate + authorize(roles)
│   ├── validate.js          # express-validator errors
│   └── errorHandler.js
├── models/
│   ├── User.js
│   ├── Goal.js
│   ├── Checkin.js
│   └── AuditLog.js
├── routes/                  # Express routers
├── utils/
│   ├── auditLog.js
│   └── seed.js
├── app.js                   # Express app (CORS, middleware, routes)
└── server.js                # Entry point
```

### Frontend (`/frontend`)

```
src/
├── services/api.js          # Axios instance, JWT interceptor, all API methods
├── context/AuthContext.jsx  # Auth state, login/logout
├── routes/ProtectedRoute.jsx
├── components/
│   ├── UI.jsx               # Toast, Modal, StatCard, WeightageBar, etc.
│   ├── Navbar.jsx           # Role-aware navigation
│   ├── GoalForm.jsx         # Reusable create/edit form
│   └── GoalsTable.jsx       # Reusable goals table
└── pages/
    ├── Login.jsx
    ├── EmployeeDashboard.jsx
    ├── EmployeeCheckins.jsx
    ├── ManagerDashboard.jsx
    ├── ManagerCheckins.jsx
    ├── AdminDashboard.jsx
    └── AdminGoals.jsx
```

---

## API Reference

### Auth
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/auth/login` | Public |
| POST | `/api/auth/register` | Public |
| GET | `/api/auth/me` | Authenticated |

### Goals
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/goals` | All roles (filtered by role) |
| POST | `/api/goals` | Employee |
| PATCH | `/api/goals/:id` | Employee (draft only) |
| PATCH | `/api/goals/:id/submit` | Employee |
| DELETE | `/api/goals/:id` | Employee / Admin |
| PATCH | `/api/goals/:id/approve` | Manager |
| PATCH | `/api/goals/:id/reject` | Manager |
| PATCH | `/api/goals/:id/manager-edit` | Manager |
| GET | `/api/goals/summary/:userId` | All roles |

### Check-ins
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/checkins` | All roles |
| POST | `/api/checkins` | Employee |
| PATCH | `/api/checkins/:id` | Employee |
| GET | `/api/checkins/goal/:goalId` | All roles |

### Users
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/users` | Admin / Manager |
| GET | `/api/users/:id` | Admin / Manager |
| PATCH | `/api/users/:id` | Admin |
| DELETE | `/api/users/:id` | Admin |

---

## Role Permissions Summary

| Feature | Employee | Manager | Admin |
|---------|----------|---------|-------|
| Create goals | ✓ | — | — |
| Submit goals | ✓ | — | — |
| Edit own draft goals | ✓ | — | — |
| Log quarterly check-ins | ✓ | — | — |
| View team goals | — | ✓ | ✓ |
| Approve / Reject goals | — | ✓ | — |
| Edit team goals (pre-lock) | — | ✓ | — |
| View team check-ins | — | ✓ | ✓ |
| View all users | — | ✓ | ✓ |
| Deactivate users | — | — | ✓ |
| Unlock approved goals | — | — | ✓ |
| Delete any goal | — | — | ✓ |

---

## Production Deployment Notes

1. Set `NODE_ENV=production` in `backend/.env`
2. Use a strong random `JWT_SECRET` (32+ chars)
3. Set `CORS_ORIGIN` to your actual frontend domain
4. Build the frontend: `npm run build:frontend` → serve `frontend/dist/` via nginx or Express static
5. Use a process manager like PM2 for the backend: `pm2 start backend/src/server.js`
