# Smart Dashboard

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

## Member 2 – Services & Categories

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

## Member 2 – Services & Categories

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
git checkout -b feature/member2-services
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
git diff --cached
```

```bash
git add <files>
```

```bash
git commit -m "feat: description"
```

---

# Environment Variables

Create a local `.env` file inside:

```text
backend/express-app/.env
```

Example:

```env
PORT=
DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_NAME=
JWT_SECRET=
```

The real `.env` file must **not** be committed.

A safe template is provided as:

```text
backend/express-app/.env.example
```

Team members should create their own local `.env` using their own MySQL credentials and JWT secret.

---

# Database Setup

Each developer should use their own local MySQL database.

The database schema is shared through:

```text
backend/database/schema.sql
```

Example setup:

```text
1. Start MySQL through XAMPP
2. Open phpMyAdmin
3. Run schema.sql
4. Create/configure local .env
5. Install backend dependencies
6. Start Express
```

Install dependencies:

```bash
cd backend/express-app
npm install
```

Start the backend using the project's configured npm script.

---

# Security Requirements

The application should:

* Hash passwords using bcrypt.
* Never store plaintext passwords.
* Never return `password_hash` through the API.
* Store JWT secrets in environment variables.
* Use parameterized SQL queries.
* Validate user input.
* Protect private endpoints with authentication middleware.
* Use the authenticated user's ID when accessing personal data.
* Avoid exposing raw database errors.
* Avoid logging passwords or secrets.
* Use HTTPS in production.
* Consider rate limiting for authentication endpoints.

---

# Development Principle

The backend is divided by responsibility rather than Django-specific modules.

```text
Member 1
Accounts / Authentication / Settings
          │
          │ JWT authentication
          ▼
Member 2
Services / Categories
          │
          ▼
Member 3
Dashboard / Analytics
```

Member 1's authentication middleware provides the common authentication layer used by protected endpoints across the project.

---

# Project Status

**Backend migration:** Django → Express.js/Node.js

**Database:** MySQL

**Frontend:** React/Vite

**Authentication:** JWT + bcrypt

**Current focus:** Completing Member 1 authentication API before implementing the frontend authentication flow.
