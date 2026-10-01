# Categories and Services API

Both resources expose POST and GET on `/api/categories` and `/api/services`,
and GET, PUT and DELETE on each resource's `/:id` path. All routes require
`Authorization: Bearer <token>` from the existing login API. Ownership comes
only from `req.user.id`; body or query ownership fields are ignored.

POST returns 201 with the created record, GET/PUT return 200 with a record
(or an array for list), and DELETE returns 204 without a body. Missing or
foreign records return 404. Validation returns 400, duplicate categories and
in-use category deletion return 409, and unexpected errors return a generic
500 message without database details.

## Request bodies

Category POST (colour defaults to `#8b8b8b` if omitted):

```json
{"name":"Hosting","color":"#123456"}
```

Category PUT requires both name and colour. Names are trimmed and must contain
2–40 characters; colours must be six-digit hexadecimal colours.

Service POST/PUT:

```json
{
  "category_id": 1,
  "name": "Website hosting",
  "cost": "20.50",
  "billing_cycle": "monthly",
  "renewal_date": "2026-11-01",
  "status": "active",
  "notes": "Annual review pending"
}
```

Use a category ID returned for the logged-in user. Service names have 2–80
characters, cost is positive and at most 1,000,000 with at most two decimal
places, and notes are optional text up to 500 characters. Billing cycles are
`monthly`, `quarterly`, `yearly`, `one_time`; statuses are `active`, `inactive`.
Renewal dates must be real calendar dates in YYYY-MM-DD format (year 1000–9999).
Past dates are allowed. PUT replaces the editable fields; omitted notes become
empty text. Unchanged valid updates still return the current record under the
mysql2 default matched-row behavior.

Responses use SQL snake_case fields as in the supplied Phase 3/4 plan. Service
responses include `category_name` and `category_color`. Renewal dates are
returned as date-only strings; mysql2 returns DECIMAL costs as strings. The frontend adapters map these fields to camelCase and string IDs. Services
and categories are loaded from the API, without localStorage or demo fallback.

## Run and test

From `backend/express-app`:

```sh
npm run db:test
npm run services-categories:test
npm start
```

`services-categories:test` runs 17 HTTP tests against real Express routes, JWT middleware,
controllers and repositories, substituting only the database pool. It checks
CRUD responses, SQL ownership parameters, validation, conflict handling and
safe errors. It does not validate SQL execution or real database constraints.

Live database verification is pending: `db:test` currently reports access
denied for the configured root account. Configure working local credentials
in `.env` and apply `Database/schema.sql` before exercising persistence.
Then use two test accounts to verify separate lists, cross-user GET/PUT/DELETE
returning 404, rejected foreign category assignment, duplicate category names
within one account, allowed matching names across accounts, and category
deletion returning 409 until its services are removed.


## Search and filtering

`GET /api/services` accepts `search` (name or notes, at most 200 characters),
`status`, `category_id`, and `billing_cycle`. Combine filters with `&`; all
conditions apply together with the JWT owner restriction. Search is a literal
substring match: `%`, `_`, and `!` are escaped rather than treated as wildcards.
An empty search means no search restriction. Invalid or repeated known filters
return 400. Unknown query keys do not override ownership. Results sort by renewal
date and ID. Case/accent matching follows the database collation.

```text
/api/services?search=netflix&status=active&category_id=2&billing_cycle=monthly
```

## Frontend integration

Start Express on port 3001 (`npm start` in this directory), then run
`npm --prefix frontend run dev` from the project root. Vite proxies `/api` to
`http://127.0.0.1:3001`; change the target if your backend PORT differs. Production
hosting must route `/api` to Express on the same origin.

Sign in with an existing account from the authentication API. The browser stores
its JWT for the tab session; sign-out or a 401 clears it and unmounts private
providers. Account registration remains with the existing account backend.
The Services page sends debounced filters with cancellation of stale requests.
Dashboard totals retain their separate unfiltered list. Service and category
mutations wait for successful API responses before updating local React state.
Category rename preserves its colour. Settings reset preserves database categories;
profile/preferences remain browser settings as before.

From the root, run:

```sh
npm --prefix backend/express-app run services-categories:test
npm --prefix frontend test
npm --prefix frontend run build
```

The frontend includes API-adapter tests for authentication headers, filters,
field mapping, CRUD, conflicts, and expired sessions. Automated results: 17
backend tests and 68 frontend tests passing, plus a successful production build.
Live database/browser end-to-end verification remains pending until the configured
MySQL account can authenticate. The API tests substitute the database pool; they
verify parameterized owner-scoped SQL construction, not MySQL query execution.
