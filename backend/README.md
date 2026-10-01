# Smart Dashboard — Backend (Express + Node.js)

REST API for the Smart Dashboard frontend. Express 5, MongoDB via Mongoose, ES modules.

## Requirements

- Node.js **22.9+** (uses built-in `--env-file` and `--watch`, so no `dotenv` / `nodemon`)
- MongoDB running locally, or a MongoDB Atlas connection string

## Setup

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

## Task split

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
