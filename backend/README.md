# Goal Tracking Portal — Backend API

Node.js + Express + MongoDB REST API with JWT auth and role-based access control.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

# 3. Seed the database (optional)
npm run seed

# 4. Start the server
npm run dev       # development (nodemon)
npm start         # production
```

---

## 📁 Folder Structure

```
src/
├── config/
│   └── db.js               # MongoDB connection
├── controllers/
│   ├── authController.js
│   ├── userController.js
│   ├── goalController.js
│   ├── checkinController.js
│   └── auditController.js
├── middleware/
│   ├── auth.js             # JWT authenticate + authorize
│   ├── errorHandler.js     # Global error + 404 handler
│   └── validate.js         # express-validator result handler
├── models/
│   ├── User.js
│   ├── Goal.js
│   ├── Checkin.js
│   └── AuditLog.js
├── routes/
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── goalRoutes.js
│   ├── checkinRoutes.js
│   └── auditRoutes.js
├── utils/
│   ├── auditLog.js         # Audit logger helper
│   └── seed.js             # DB seeder
├── app.js                  # Express app
└── server.js               # Entry point
```

---

## 🔐 Auth

All protected routes require:
```
Authorization: Bearer <token>
```

---

## 📡 API Reference

### Auth

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/api/auth/register` | Public | Register a new user |
| POST | `/api/auth/login` | Public | Login and get token |
| GET | `/api/auth/me` | All | Get current user |
| PATCH | `/api/auth/change-password` | All | Change password |

### Users

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/api/users` | Admin, Manager | List users (Manager sees team only) |
| GET | `/api/users/:id` | Admin, Manager | Get user |
| PATCH | `/api/users/:id` | Admin | Update user |
| DELETE | `/api/users/:id` | Admin | Deactivate user |

### Goals

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/api/goals` | Employee | Create goal (max 8, weight ≥10%, total ≤100%) |
| GET | `/api/goals` | All | List goals (filtered by role) |
| GET | `/api/goals/:id` | All | Get single goal |
| PATCH | `/api/goals/:id` | Employee | Edit draft/rejected goal |
| PATCH | `/api/goals/:id/submit` | Employee | Submit for manager approval |
| DELETE | `/api/goals/:id` | Employee, Admin | Delete non-locked goal |
| PATCH | `/api/goals/:id/approve` | Manager | Approve → locks goal |
| PATCH | `/api/goals/:id/reject` | Manager | Reject (comment required) |
| PATCH | `/api/goals/:id/manager-edit` | Manager | Edit before approval |
| GET | `/api/goals/summary/:userId` | All | Weightage summary |

### Check-ins

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/api/checkins` | Employee | Submit quarterly check-in |
| GET | `/api/checkins` | All | List check-ins |
| GET | `/api/checkins/:id` | All | Get check-in |
| PATCH | `/api/checkins/:id` | Employee | Update check-in |
| GET | `/api/checkins/goal/:goalId` | All | All check-ins for a goal |

### Audit Logs

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/api/audit` | Admin | View all audit logs (paginated) |

Query params: `userId`, `action`, `targetModel`, `from`, `to`, `page`, `limit`

---

## 🏗️ Business Rules Enforced

| Rule | Where enforced |
|------|---------------|
| Max 8 goals per employee | `goalController.createGoal` |
| Each goal ≥ 10% weightage | Model validation + controller |
| Total weightage ≤ 100% | `validateWeightage()` helper |
| Goals locked after approval | `Goal.locked = true` on approve |
| Only draft/rejected goals editable | `goalController.updateGoal` |
| Rejection requires a comment | Route-level validation |
| Check-ins only on approved goals | `checkinController.createCheckin` |
| One check-in per goal per quarter | MongoDB unique index |
| Manager can only manage their team | `assertManagerAccess()` helper |

---

## 👥 Roles

| Role | Capabilities |
|------|-------------|
| **Employee** | Create/edit/submit/delete own goals; submit quarterly check-ins |
| **Manager** | View team goals; approve/reject/edit submitted goals; view team check-ins |
| **Admin** | Full access to all resources; manage users; view audit logs |

---

## 🌱 Seed Credentials

After running `npm run seed`:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | Admin@1234 |
| Manager | manager@example.com | Manager@1234 |
| Employee | alice@example.com | Alice@1234 |
| Employee | bob@example.com | Bob@1234 |
