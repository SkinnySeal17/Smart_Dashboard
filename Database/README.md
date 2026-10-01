# Services and Categories database preparation

The shared schema is `Database/schema.sql`. Development is on
`feature/services-categories`. No remote update was performed in this phase;
the latest GitHub main revision has not been verified.

## Existing backend

The active backend is `backend/express-app`, using CommonJS, Express and
`mysql2/promise`. The Django folders are legacy scaffolding. `src/config/db.js`
creates a connection pool from environment variables. Authentication routes
delegate to controllers and `authService`; repositories perform parameterized
SQL queries. `src/middleware/authenticate.js` verifies a Bearer JWT and sets
`req.user.id`. New routes must use this middleware and scope every read,
update and delete to that ID. Never accept ownership from a request body.

## Data design

Each user owns many categories and services. Each service requires one category
belonging to that same user. The composite foreign key `(user_id, category_id)`
enforces that relationship. Foreign keys do not provide read authorization;
the future API must still apply owner filters to every query.

| Frontend field | SQL column | Rule |
| --- | --- | --- |
| Category `name` | `categories.name` | 2–40 characters; unique per owner |
| Category `color` | `categories.color` | Six-digit hex colour; default `#8b8b8b` |
| Service `name` | `services.name` | 2–80 characters |
| `category` | `category_id` | Required category owned by the service owner |
| `cost` | `cost` | Decimal currency amount greater than zero, at most 1,000,000 |
| `billingCycle` | `billing_cycle` | monthly, quarterly, yearly, one_time |
| `renewalDate` | `renewal_date` | Required calendar date, including one-time services |
| `status` | `status` | active or inactive |
| `notes` | `notes` | Optional; at most 500 characters; default empty string |
| `createdAt`, `updatedAt` | `created_at`, `updated_at` | Database timestamps |

These fields follow `frontend/src/lib/validateService.js`, `ServiceForm.jsx`
and `settingsService.js`. Past renewal dates remain allowed. There is no
uniqueness rule for service names. Category names use a case-insensitive,
accent-insensitive collation; this is stricter than the frontend's lowercase
comparison for accented names. API validation must trim names before storage.
Currency remains a user setting, matching the current application.

IDs follow Member 1's unsigned integer convention. The frontend currently uses
string IDs and localStorage. During API integration, serialize IDs as strings
and map snake_case columns to the existing camelCase fields; demo IDs are not
database IDs. Convert mysql2 decimal strings deliberately for frontend display
while retaining decimal arithmetic for database calculations.

Deleting an in-use category is restricted. User deletion is also restricted
while service or category records exist: a future account deletion transaction must delete
services, then categories, then the user. This avoids implicit deletion of paid
service records. Owner/category, owner/status/renewal and owner/name indexes
support later filtering and dashboard queries; substring searches may still scan
the user's rows.

## Applying and verifying

Use MySQL 8.0.16 or later, InnoDB and strict SQL mode so checks and invalid-value
errors are enforced. With an authorized local database account, run from the
repository root (the password is prompted, not stored in the command):

```sh
mysql -u YOUR_DATABASE_USER -p < Database/schema.sql
```

The script creates missing tables without dropping existing data. `IF NOT
EXISTS` does not migrate an already existing table with a different definition;
inspect such tables before applying a separate migration.

Verify on a disposable database before relying on this schema: valid inserts;
duplicate category names for the same owner versus different owners; foreign
category assignment; deletion of an in-use category; invalid cost, name, colour,
billing cycle and status; and successful deletion after removing services.

Live SQL validation was not completed in this environment: the installed MySQL
client is available, but the local server rejected passwordless root access.
No database credentials were changed and no schema was applied to that server.
Backend APIs and frontend integration are subsequent phases.
