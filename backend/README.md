# Smart Dashboard — Backend (Express + Node.js)

REST API for the Smart Dashboard frontend. Express 5, MongoDB via Mongoose, ES modules.

## Requirements

- Node.js **22.9+** (uses built-in `--env-file` and `--watch`, so no `dotenv` / `nodemon`)
- MongoDB running locally, or a MongoDB Atlas connection string

A web-based Smart Dashboard for managing services, categories, user accounts, settings, and subscription/service analytics.

## Tech Stack

### Frontend

* React
* Vite
* React Router
* JavaScript
* Vitest

### Backend

* Node.js
* Express.js
* MySQL
* JWT authentication
* bcrypt
* dotenv

### Database

* MySQL
* XAMPP for local development

> The project originally included a Django backend, but the team is implementing the backend using Express.js/Node.js.

---

# Project Structure

```text
Smart_Dashboard/
│
├── frontend/
│   └── React/Vite application
│
├── backend/
│   ├── express-app/
│   │   ├── src/
│   │   │   ├── config/
│   │   │   ├── middleware/
│   │   │   ├── routes/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   └── app.js
│   │   │
│   │   ├── server.js
│   │   ├── package.json
│   │   └── .env.example
│   │
│   └── database/
│       ├── schema.sql
│       └── seed.sql
│
└── README.md
```

---

# Team Work Division

## Member 1 – Accounts & User Management

### Backend

* Authentication using Express
* Register
* Login
* Logout
* JWT authentication
* Authentication middleware
* Current user `/me`
* Profile management
* Password change
* User settings

### Database

* `users`
* `user_settings`

### User Settings

* Notifications
* Theme
* Currency
* Default status
* Date format

### Frontend

* Login page
* Profile/account API integration
* Settings API integration
* Shared frontend API client

### Security

* bcrypt password hashing
* JWT authentication
* Input validation
* User authorization
* Users can only access their own data
* Password hashes are never returned
* Secrets stored in `.env`

### Testing

* Authentication tests
* Profile tests
* Password tests
* Settings tests
* Account functionality tests

### Report

* Problem Definition
* Requirements Analysis
* Future Enhancements
* Appendix

---

## Services & Categories

### Backend

* Category management
* Service management
* CRUD operations
* Search
* Filtering
* Input validation
* Business rules

### Database

* `categories`
* `services`

### Rules

* Prevent duplicate category names
* Prevent deletion of categories currently in use
* Users can only access their own services/categories
* Protected endpoints require authentication

### Frontend

* Services API integration
* Category management
* Service management
* Search and filtering

### Testing

* Category tests
* Service tests
* Validation tests
* Business-rule tests

### Report

* Solution Design
* Technology Stack Justification

---

## Member 3 – Dashboard & Analytics

### Backend

* Dashboard statistics
* Spending calculations
* Renewal calculations

### API

* Summary statistics
* Spending by category
* Upcoming renewals
* Overdue renewals

### Calculations

* Monthly spending
* Yearly spending
* Category-based spending
* Upcoming renewals
* Overdue renewals

### Frontend

* Dashboard API integration
* Summary statistics
* Spending information
* Renewal information
* Charts and visualisations

### Testing

* Monthly calculations
* Yearly calculations
* Category spending
* Renewal calculations

### Report

* Implementation Overview
* Testing and Evaluation

---

# Database

The project uses MySQL for persistent data storage.

The main Member 1 tables are:

### `users`

Stores account information.

```text
id
name
email
password_hash
created_at
updated_at
```

### `user_settings`

Stores user-specific settings.

```text
id
user_id
notifications
theme
currency
default_status
date_format
created_at
updated_at
```

`user_settings.user_id` references `users.id`.

The database schema is stored separately in:

```text
backend/database/schema.sql
```

Sample/fake data can be stored in:

```text
backend/database/seed.sql
```

No real passwords, JWT secrets, API keys, or other credentials should be stored in either file.

---

# Authentication

The project uses JWT-based authentication.

Authentication flow:

```text
User
  ↓
Register / Login
  ↓
Express Authentication API
  ↓
bcrypt password verification
  ↓
JWT generated
  ↓
Frontend stores authentication token
  ↓
Protected API request
  ↓
Authorization: Bearer <token>
  ↓
Authentication Middleware
  ↓
req.user
  ↓
Protected endpoint
```

Passwords are stored as bcrypt hashes.

Passwords are never stored as plaintext and are never returned by the API.

The JWT secret is stored in the local `.env` file.

---

# Current API Plan

## Authentication

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

## Profile

```text
GET /api/profile
PUT /api/profile
PUT /api/profile/password
```

## Settings

```text
GET /api/settings
PUT /api/settings
```

## Services

```text
POST   /api/services
GET    /api/services
PUT    /api/services/:id
DELETE /api/services/:id
```

## Categories

```text
POST   /api/categories
GET    /api/categories
PUT    /api/categories/:id
DELETE /api/categories/:id
```

## Dashboard

```text
GET /api/dashboard/summary
GET /api/dashboard/spending-by-category
GET /api/dashboard/upcoming-renewals
GET /api/dashboard/overdue-renewals
```

---

# Current Development Progress

## Member 1 – Accounts

### Completed

* [x] Repository/project structure inspected
* [x] Express backend foundation created
* [x] MySQL connection configured
* [x] Environment configuration created
* [x] Users database table created
* [x] User settings database table created
* [x] Users repository/data-access layer implemented
* [x] Find user by ID
* [x] Find user by email
* [x] Create user
* [x] Update user name
* [x] Update user email
* [x] Update password hash
* [x] Duplicate email handling
* [x] Database transaction testing
* [x] Repository tests completed
* [x] No test users left in database after rollback

### In Progress

* [ ] Registration API
* [ ] Login API
* [ ] JWT authentication
* [ ] Authentication middleware
* [ ] `/me`
* [ ] Logout
* [ ] Profile API
* [ ] Password change API
* [ ] Settings API
* [ ] Login frontend
* [ ] Profile frontend integration
* [ ] Settings frontend integration
* [ ] Authentication tests
* [ ] Profile/settings tests
* [ ] Sample data script

---

## Services & Categories

### Completed

* [ ] Services backend
* [ ] Categories backend
* [ ] Service CRUD
* [ ] Category CRUD
* [ ] Search
* [ ] Filtering
* [ ] Validation
* [ ] Business rules
* [ ] Frontend integration
* [ ] Testing

---

## Member 3 – Dashboard & Analytics

### Completed

* [ ] Dashboard backend
* [ ] Summary statistics
* [ ] Monthly calculations
* [ ] Yearly calculations
* [ ] Category spending
* [ ] Upcoming renewals
* [ ] Overdue renewals
* [ ] Dashboard frontend integration
* [ ] Charts
* [ ] Testing

---

# Git Workflow

Each team member should work on their own feature branch.

Example:

```bash
git checkout -b feature/member1-auth
```

```bash
git checkout -b feature/services-categories
```

```bash
git checkout -b feature/member3-dashboard
```

### Rules

* Do not work directly on `main`.
* Do not merge other members' work without review.
* Commit logical completed changes.
* Do not commit `.env`.
* Do not commit `node_modules`.
* Do not commit `.DS_Store`.
* Do not commit real user data or passwords.
* Review staged files before committing.

Useful commands:

```bash
git status
```

```bash
git diff
```

```bash
cd backend
npm install
copy .env.example .env      # macOS/Linux: cp .env.example .env
npm run dev                 # http://localhost:5000  (auto-restarts on change)
```

Check it works: `GET http://localhost:5000/api/health` → `{ "status": "ok" }`

| Command | What it does |
|---|---|
| `npm run dev` | start with file watching |
| `npm start` | start without watching |
| `npm test` | run tests in `tests/` (Node test runner + supertest) |

## Environment variables (`.env`)

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `5000` | API port |
| `NODE_ENV` | `development` | `development` shows error stacks in responses |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/smart_dashboard` | database connection |
| `CORS_ORIGIN` | `http://localhost:5173` | comma-separated allowed frontend origins |

## Structure

```bash
git commit -m "feat: description"
```
backend/
├── src/
│   ├── server.js            # connects to MongoDB, starts the server
│   ├── app.js               # Express app: middleware + route mounting
│   ├── config/              # env.js, db.js
│   ├── middleware/          # notFound, errorHandler (shared)
│   └── modules/
│       ├── accounts/        # Member 1
│       ├── services/        # Member 2
│       └── dashboard/       # Member 3
├── tests/
├── .env.example
└── package.json
```

Each module's router is already mounted in `src/app.js`:

| Module | URL prefix |
|---|---|
| accounts | `/api/accounts` |
| services | `/api/services` |
| dashboard | `/api/dashboard` |

Inside your module, use this naming: `<name>.routes.js`, `<name>.controller.js`, `<name>.model.js`
(and `<name>.middleware.js` if needed). Tests go in `tests/<module>.test.js`.

# Project Status

Each member writes tests for their own endpoints and connects their part of the frontend to the API.

**Member 1 — `modules/accounts` (auth + user settings)**
- `User` model (name, email, hashed password)
- JWT auth: register, login, `me` endpoint
- `requireAuth` middleware that sets `req.user`. Export it so the other modules can protect their routes
- Profile: view/update name + email, change password
- `UserSettings` (one per user): notifications, theme, currency, default status, date format
- Settings endpoint (GET / PATCH) with defaults matching `frontend/src/services/settingsService.js`
- Frontend: login page + `settingsService.js` → API

**Member 2 — `modules/services` (core data)**
- `Category` model (name, color, owner) + CRUD, with duplicate-name and "in use" delete guards
- `Service` model (name, category, cost, billingCycle, renewalDate, status, notes, owner, timestamps) + CRUD
- Validation matching `frontend/src/lib/validateService.js`
- Search by name, filter by category/status; users only see their own records
- Frontend: `servicesService.js` → API

**Member 3 — `modules/dashboard` (stats + data)**
- Summary endpoint: service count, monthly spend, yearly estimate, next renewal
- Spend-by-category endpoint (for the category chart)
- Upcoming renewals + overdue services endpoint
- Seed script (`npm run seed`) loading `frontend/src/data/services.json`
- Shared frontend API client (base URL from env, auth token header, error handling)
- Frontend: dashboard page → API

**Order:** Member 2 pushes the `Category` + `Service` models first (Member 3 queries them).
Member 1 pushes `requireAuth` early so everyone can lock endpoints to the logged-in user.

## Ground rules
- Work only inside your own `modules/<name>/` folder. Ask before editing `app.js`, `config/` or `middleware/`.
- Install packages from `backend/` with `npm install <pkg>`, and commit both `package.json` and `package-lock.json`.
- Never commit `.env`. Add new variables to `.env.example` instead.
- API field names use the frontend's camelCase shape (`billingCycle`, `renewalDate`, …).
