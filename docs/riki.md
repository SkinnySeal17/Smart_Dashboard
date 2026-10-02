# Member 1 — Authentication, profile, and settings

This document describes the account work that is in the current code: registration, login, logout, profile, password change, user settings, the account pages, and the security around them.

The live stack is a React/Vite frontend, an Express 5 API in `backend/express-app`, and MySQL. The API listens on `PORT` or `3001`. Vite proxies `/api` to `http://127.0.0.1:3001`.

## 1. Member 1 responsibilities

| Area | What the code does |
| --- | --- |
| Authentication | Bearer JWT checked by `authenticate`. Identity is `req.user.id` from the token `sub` claim. |
| Registration | `POST /api/auth/register` creates a user and a default `user_settings` row in one transaction. |
| Login | `POST /api/auth/login` checks the password and returns a token plus the public user. |
| Logout | `POST /api/auth/logout` tells the client to discard the token. The server does not revoke it. |
| Current user | `GET /api/auth/me` returns `{ id, name, email }` for the token owner. |
| Profile | `GET` and `PUT /api/profile` read and update that user's name and email. |
| Password change | `PUT /api/profile/password` checks the current password, then stores a new bcrypt hash. |
| User settings | `GET` and `PUT /api/settings` read and partially update that user's settings row. |
| Frontend account pages | `/login`, `/register`, `/profile`, and `/settings`. |
| Shared API client | `frontend/src/services/api.js` sends JSON and `Authorization: Bearer`. |
| Security | Hashing, password rules, login lockout, parameterized SQL, CORS, headers, and generic errors. |

Categories, services, and dashboard analytics are separate APIs. The settings page still contains a categories section, but those rows are stored in `categories`, not `user_settings`.

## 2. Architecture

```text
Browser (React 19, Vite, React Router)
  sessionStorage["smart-dashboard.token"]
        |
        |  fetch /api/...   Authorization: Bearer <jwt>
        v
Vite dev server  --proxy /api-->  Express (port 3001)
                                    security headers
                                    CORS allowlist
                                    express.json (100kb)
                                    authenticate  ->  req.user = { id }
                                    auth / profile / settings routes
                                        |
                                        v
                                   mysql2 pool
                                   database smart_dashboard
                                   users, user_settings
```

Connection settings come from `backend/express-app/.env`: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, and `JWT_SECRET`. `FRONTEND_ORIGIN` optionally overrides the CORS allowlist.

Account request path:

1. The page calls `authService` or `settingsService`.
2. `api()` prefixes `/api`, attaches the token when one exists, and parses JSON.
3. Profile, settings, `/api/auth/me`, and `/api/auth/logout` pass through `authenticate`.
4. Controllers call `authService` or `userSettingsRepository` with `req.user.id`.
5. Repositories run parameterized SQL through the shared pool.

`SettingsProvider` and `ServicesProvider` mount only after a token is present, so settings and category requests are not sent while signed out.

## 3. Database

Defined in `Database/schema.sql`.

### `users`

| Column | Role |
| --- | --- |
| `id` | `INT UNSIGNED` primary key. This is the JWT `sub` value. |
| `name` | `VARCHAR(100)`, required. |
| `email` | `VARCHAR(255)`, required and unique. Stored trimmed and lowercased. |
| `password_hash` | `VARCHAR(255)`. bcrypt hash only. |
| `created_at`, `updated_at` | Timestamps. `updated_at` changes on update. |

### `user_settings`

| Column | Default | Meaning |
| --- | --- | --- |
| `id` | auto | Settings row id. |
| `user_id` | — | Unique foreign key to `users.id`. One row per user. |
| `email_notifications` | `TRUE` | Email notification toggle. |
| `renewal_reminders` | `TRUE` | Renewal reminder toggle. |
| `renewal_lead_days` | `7` | How many days before renewal to remind. API accepts integers 1–365. |
| `overdue_alerts` | `TRUE` | Overdue alert toggle. |
| `weekly_summary` | `TRUE` | Weekly summary toggle. |
| `theme` | `light` | API accepts `light`, `dark`, or `system`. |
| `currency` | `AUD` | API accepts 1–10 letters, numbers, or `$€£¥.`. |
| `default_status` | `active` | API accepts `active` or `inactive`. |
| `date_format` | `DD/MM/YYYY` | API accepts `DD/MM/YYYY`, `MM/DD/YYYY`, or `YYYY-MM-DD`. |
| `created_at`, `updated_at` | timestamps | Row timestamps. |

`user_settings.user_id` references `users.id` with `ON DELETE CASCADE` and `ON UPDATE CASCADE`. Deleting a user deletes that user's settings row.

Ownership is the signed-in id. Profile and settings queries filter with `WHERE id = ?` or `WHERE user_id = ?`. A `user_id` or `userId` sent in the body or query is not used as the owner.

## 4. Architecture decisions

| Choice | What the implementation does |
| --- | --- |
| Express instead of Django | `backend/README.md` records that the project originally included Django and that the team implements the backend with Express and Node. The running API is `backend/express-app`. |
| MySQL | `Database/schema.sql` defines `smart_dashboard`. The API uses a `mysql2` pool. Local development is documented as XAMPP. |
| JWT | Login returns a signed token. Later requests send it as a Bearer token. The server does not store a session. The payload is `{ sub: "<user id>" }`, HS256, expiry `8h`, secret `JWT_SECRET`. |
| bcrypt | `registerUser` and `changePassword` hash with 10 rounds. Login uses `bcrypt.compare`. An unknown email is compared against a dummy hash so the response stays the same shape. |
| Parameterized SQL | User and settings statements pass values as `?` placeholders. Settings `UPDATE` column names come from a fixed whitelist, not from the request. |
| `req.user.id` | `authenticate` sets `req.user` only from the verified `sub` claim. Controllers pass that id into repositories. |
| Shared API client | `api()` is the one place that adds the Bearer header, JSON encoding, and 401 session clearing. Auth, profile, and settings services call it. |
| `sessionStorage` | The token is stored under `smart-dashboard.token`. It stays in that browser tab until logout or the tab session ends. It is not written to `localStorage`. Settings are also not stored in `localStorage`; they are loaded and saved through `/api/settings`. |

## 5. Authentication flow

Public user objects are only `{ id, name, email }`.

### Registration

```text
Register page
  |  POST /api/auth/register  { name, email, password }
  v
validate name, email, password
  |  invalid -> 400 { message, errors }
  v
transaction:
  email already used -> rollback, 409
  INSERT users (bcrypt hash)
  INSERT user_settings defaults
  commit
  |
  v
201 { user }          no token is issued
  |
  v
navigate to /login
```

### Login

```text
Login page
  |  POST /api/auth/login  { email, password }
  v
login rate limit (IP + lowercase email)
  |  5 earlier 401s in 15 minutes -> 429
  v
validate email and password presence
  |  invalid -> 400
  v
find user by email
compare bcrypt (real hash, or a dummy hash if no user)
  |  missing user or wrong password -> 401
  |     "Invalid email or password."
  v
200 { token, user }
  |
  v
sessionStorage["smart-dashboard.token"] = token
navigate to /
```

A wrong password and an unknown email return the same JSON body. A successful login clears that IP-and-email failure count.

### Authenticated request

```text
api("/profile") or api("/settings") or api("/auth/me")
  |
  |  Authorization: Bearer <token>
  v
authenticate
  missing/malformed header -> 401 Authentication required.
  bad signature, wrong algorithm, expired, or bad sub -> 401 Invalid or expired token.
  |
  v
req.user = { id }
handler uses that id only
  |
  v
200 JSON
```

If a stored token receives `401`, `api()` removes it unless the call set `preserveSession: true`. Password change sets that flag so a wrong current password does not sign the user out.

### Logout

```text
Logout button
  |  POST /api/auth/logout   (Bearer token, 5s timeout)
  v
200 { message: "Logged out. Discard this token on the client." }
  |
  v
sessionStorage token removed
routes fall back to /login
```

The same local removal happens if the logout request fails. The JWT is still valid until its `8h` expiry. There is no server-side denylist.

## 6. Profile flow

Profile routes all use `authenticate`.

### Load profile

```text
Profile page mounts
  |  GET /api/profile
  v
find users row by req.user.id
  |  missing user -> 401 Invalid or expired token.
  v
200 { user: { id, name, email } }
```

`SettingsProvider` also calls `GET /api/auth/me` and keeps `{ name, email }` for the sidebar. Saving the profile updates that context value.

`GET /api/profile?userId=<someone else>` still returns the token owner.

### Update name and email

```text
Save profile
  |  client validateProfile (name 2–60, email max 254)
  |  PUT /api/profile  { name, email }
  v
server checks
  name required, trimmed, max 100, no control characters
  email required, trimmed, lowercased, max 255, simple email pattern
  |  invalid -> 400
  v
transaction
  UPDATE name WHERE id = req.user.id
  if email belongs to a different user -> rollback, 409
  UPDATE email WHERE id = req.user.id
  commit
  |
  v
200 { user }
```

A `user_id` in the body is ignored. The API name limit is 1–100 characters. The profile form blocks names outside 2–60 before the request is sent.

### Change password

```text
Update password
  |  PUT /api/profile/password
  |  { currentPassword, newPassword }
  v
validate both fields and the new-password rules
  |  invalid -> 400
  v
load user by req.user.id
reject a new password that matches the email
bcrypt.compare(currentPassword, password_hash)
  |  mismatch -> 401 Current password is incorrect.
  v
bcrypt hash, UPDATE password_hash WHERE id = req.user.id
200 { message: "Password updated." }
```

The new password must differ from the current password. Another user's `user_id` in the body does not change that user's hash.

Password rules on register and password change:

- 8–72 characters
- one lowercase letter, one uppercase letter, one number, and one symbol
- not in the small common-password list in `authService.js`
- not equal to the email address or its local part

## 7. Settings flow

`GET` and `PUT /api/settings` use `authenticate` and `req.user.id`. A missing settings row returns `404`.

### Load settings

```text
SettingsProvider mounts
  |  GET /api/settings
  v
SELECT user_settings WHERE user_id = ?
  |
  v
200 { settings }
  |
  v
fromApiSettings() maps snake_case columns
into notifications, appearance, and preferences
```

Booleans are returned as `true` or `false`. The response includes `id` and `user_id` for that owner only.

The provider then sets `data-theme` on `<html>` (`light` or `dark`; `system` removes the attribute) and calls `setDateStyle` so `formatDate` uses the saved pattern.

### Update settings

```text
Toggle, theme, currency blur, status, date format, or reset
  |  PUT /api/settings  { only the fields being changed }
  v
whitelist and validate each present column
  empty body or invalid value -> 400, nothing written
  v
UPDATE ... SET <whitelisted columns> = ? WHERE user_id = ?
  |
  v
200 { settings }     omitted fields stay as they were
```

Reset sends the full default object from `settingsService.js` (notifications on, lead days 7, theme `light`, currency `AUD`, status `active`, date `DD/MM/YYYY`).

| UI group | API field | Effect |
| --- | --- | --- |
| Notifications | `email_notifications` | Stored boolean. |
| Notifications | `renewal_reminders` | Stored boolean. |
| Notifications | `renewal_lead_days` | Integer 1–365. The form offers 1, 3, 7, and 14. |
| Notifications | `overdue_alerts` | Stored boolean. |
| Notifications | `weekly_summary` | Stored boolean. |
| Appearance | `theme` | `light`, `dark`, or `system`. Applied on `<html>`. |
| Preferences | `currency` | Display currency text, default `AUD`. |
| Preferences | `default_status` | `active` or `inactive` for new-service preference. |
| Preferences | `date_format` | `DD/MM/YYYY`, `MM/DD/YYYY`, or `YYYY-MM-DD`, applied by `formatDate`. |

## 8. Frontend

| Route | Signed out | Signed in |
| --- | --- | --- |
| `/` | Landing page | Dashboard layout |
| `/login`, `/register` | Account form | Redirect to `/` |
| `/profile`, `/settings` | Redirect to `/login` | Account pages inside the dashboard layout |
| Any other path | Redirect to `/login` | Unknown paths redirect to `/` |

`useAuthToken` reads `sessionStorage` and updates when `api.js` dispatches `auth-change`.

| Piece | File | Role |
| --- | --- | --- |
| API client | `frontend/src/services/api.js` | `getToken`, `setToken`, `api()`. |
| Auth calls | `frontend/src/services/authService.js` | register, login, me, profile, password, logout. |
| Settings calls | `frontend/src/services/settingsService.js` | load, partial save, reset, and camelCase mapping. |
| Token hook | `frontend/src/hooks/useAuthToken.js` | Route guard state. |
| Account state | `frontend/src/context/SettingsContext.jsx` | Profile, settings, theme, date style. Also loads categories. |
| Login | `frontend/src/pages/login.jsx` | Required email and password, API errors, loading label. |
| Register | `frontend/src/pages/register.jsx` | Client checks, then register. Success goes to login with a notice. |
| Profile | `frontend/src/pages/profile.jsx` | Load, save, password change, field errors, saving and saved states. |
| Settings | `frontend/src/pages/settings.jsx` | Loads through context, saves each change, shows loading, error, and saved text. |
| Profile validation | `frontend/src/lib/validateProfile.js` | Name 2–60 and email max 254 for the profile form. |
| Dates | `frontend/src/utils/date.js` | Applies `DD/MM/YYYY`, `MM/DD/YYYY`, and `YYYY-MM-DD`. |

Login and register reuse the existing `.auth` card styles. Profile and settings reuse the dashboard cards, fields, and flash message. Sidebar and mobile navigation include Profile and Settings. The landing page links to `/login` and `/register`.

## 9. Security

| Control | Implementation |
| --- | --- |
| Password hashing | bcrypt, 10 rounds. Only `password_hash` is stored. API user objects omit it. |
| Password validation | Rules in section 6 for registration and password change. Login checks that a password was sent; it does not report which complexity rule failed. |
| JWT | HS256, `JWT_SECRET`, `8h`, `sub` is the user id. Verification allows only HS256. Missing secret returns a generic configuration failure. |
| Authorization | Protected account routes require `authenticate`. Queries use `req.user.id`. |
| SQL injection protection | `?` placeholders for values. Settings columns are a fixed list matched with `^[a-z_]+$` before they are placed in the `UPDATE`. |
| Brute-force protection | In-memory limit on `POST /api/auth/login`: 5 responses of `401` per IP and lowercase email in 15 minutes, then `429` with `Retry-After`. `trust proxy` is false, so `X-Forwarded-For` is not trusted. The counter is cleared after a `2xx` login. It lives in the Node process and resets on restart. |
| Input validation | Registration, login, profile, password, and settings each return `400` with field errors. Settings updates must include at least one known field. Invalid JSON returns `400`. JSON bodies are limited to 100kb. |
| CORS | `Access-Control-Allow-Origin` is set only for origins in `FRONTEND_ORIGIN` (comma-separated). If that variable is empty, the allowlist is `http://127.0.0.1:5173` and `http://localhost:5173`. Other origins get no allow-origin header. Disallowed preflight gets `403`. |
| Security headers | `X-Powered-By` is disabled. Responses set `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, `X-DNS-Prefetch-Control: off`, a closed `Permissions-Policy`, and `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'`. |
| Safe errors | Controllers map known failures to fixed messages. The Express error handler returns `Something went wrong.` Database helpers replace driver errors with `Database request failed.` SQL text and stack traces are not returned. |
| Sensitive data | Responses do not include `password_hash`, plaintext passwords, or `JWT_SECRET`. Login failure text does not say whether the email exists. Password-change `401` does not clear the browser token. |

## 10. Testing

Backend scripts live in `backend/express-app/package.json`. They start the app on a random port and use the configured MySQL database, then delete their users. `users:test` rolls its transaction back.

| Script | Verifies |
| --- | --- |
| `npm run db:test` | The pool can read the current database name. |
| `npm run users:test` | Find, create, and update user rows; duplicate email; rollback leaves no row. |
| `npm run auth:register:test` | Validation, bcrypt storage, no `password_hash` in JSON, default settings, duplicate email, settings failure rolls the user back. |
| `npm run auth:login:test` | Validation, `8h` token with `sub` only, and the same `401` body for a wrong password and an unknown email. |
| `npm run auth:middleware:test` | Missing, malformed, invalid, and expired tokens; `req.user.id` comes from the token, not `?userId`. |
| `npm run auth:me:test` | `/api/auth/me` for valid, missing, invalid, expired, and unknown-user tokens. No secret in the body. |
| `npm run auth:logout:test` | Logout requires a token, returns no `password_hash`, and the token still works on `/me` afterward. |
| `npm run account:test` | Own profile and settings only, profile update, duplicate email, password change isolated to the caller, partial settings update, invalid settings not saved. |
| `npm run auth:security:test` | Weak and common passwords, email-matching passwords, generic login errors, five-failure lockout, SQL-like input stored or rejected without a database error, cross-user profile/password/settings attempts, hidden `X-Powered-By`, nosniff and frame headers, and CORS for an untrusted origin versus `http://127.0.0.1:5173`. |

Frontend: `npm test` in `frontend` runs Vitest.

| File | Member 1 coverage |
| --- | --- |
| `frontend/src/services/api.test.js` | Bearer header, `409` does not clear the token, `401` does, logout calls `/api/auth/logout` and still clears the token if the network fails. The same file also covers service and category adapters. |
| `frontend/src/lib/validateProfile.test.js` | Profile form name and email rules, including the 2-character minimum and 60-character maximum. |

`frontend/src/lib/validateService.test.js` covers service and category forms, not account auth.

## 11. Current scope and limitations

These are not implemented:

- SMTP or any outbound email
- Email verification
- Forgot-password and password reset
- Server-side JWT revocation or a session denylist
- A shared rate-limit store across multiple Node processes

Also visible in the current code:

- Logout only removes the browser token. The JWT remains valid until it expires.
- Login lockout memory is per process and is cleared when that process stops.
- The profile form rejects names outside 2–60 characters. The API accepts a trimmed name of 1–100 characters.
- The settings page category editor uses `/api/categories`. That is not the `user_settings` row.
