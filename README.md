# Smart Services Dashboard

A single-page app for tracking the subscriptions and recurring services you pay
for (hosting, design tools, memberships, utilities). It shows total monthly
spend and upcoming renewals, and lets you add, edit, search, and categorise
services.

## Tech stack

- **React** + **React Router** (client-side routing)
- **Vite** (dev server + build)
- **Plain CSS** — one stylesheet, light/dark theme via `prefers-color-scheme`
- **localStorage** for persistence — there is no backend yet. Data loading is
  wrapped in a simulated async call so the UI has real loading / error states.
- **Vitest** for unit tests (validation logic)

## Run it

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

Other scripts (from `frontend/`):

| Command | What it does |
|---|---|
| `npm run build` | production build to `dist/` |
| `npm run preview` | serve the built `dist/` |
| `npm test` | run the Vitest suite once |
| `npm run lint` | oxlint |

## Key features

- **Dashboard** — summary tiles (service count, monthly spend + yearly estimate,
  next renewal). Loading skeletons and an error state with retry.
- **Services list** — table with live name search and category filter; status
  badges; overdue renewals flagged.
- **Service detail** (`/services/:id`) — full record, illustrative renewal
  history, notes, edit / delete. Delete goes through an accessible confirmation
  modal. Bad id → friendly "not found" screen.
- **Add / Edit form** — one component for both modes (`useParams()` decides).
  Hand-rolled validation (no form library): required fields, positive cost,
  valid category / billing cycle / date, name and notes length limits, and a
  non-blocking "renewal date is in the past" warning. Inline per-field errors,
  submit disabled while invalid, success banner on save.
- **Settings** — category management (add / rename / delete, with duplicate-name
  and "in use by services" guards) and preferences (currency symbol, default
  status for new services).
- **Accessibility** — semantic landmarks, `<label htmlFor>` + `aria-describedby`
  on every field, visible keyboard focus, skip-to-content link, focus-trapped
  modal (Escape to close), `role="status"` / `role="alert"` live regions,
  WCAG-AA colour contrast.
- **Responsive** — sidebar collapses to a bottom tab bar under 900px; form rows
  and the detail grid reflow to a single column.

## Project structure

```
frontend/src/
  pages/              route components (dashboard, about, settings, services/*)
  components/
    ui/               shared primitives — Card, Button, Badge, Modal, Skeleton, …
    forms/            TextField, SelectField, DateField, TextareaField, FormError
    detail/           RenewalHistory, ServiceNotes
  context/            ServicesContext, SettingsContext (React state)
  services/            *Service.js — all localStorage read/write ("data layer")
  lib/                validateService.js (pure, unit-tested) + validateService.test.js
  hooks/ utils/       useCountUp, useFlash / date + format helpers
  styles/globals.css
```

## Design decisions

### Locked service data shape

Every service record — in the store, in mock/seed data, and in the form — uses
the same shape. This is deliberate: it's the contract the data layer writes, the
routing/detail pages read, and what a real backend schema in a later assessment
would mirror.

| Field | Type / rule |
|---|---|
| `id` | string, generated |
| `name` | string, 2–80 chars |
| `category` | id of an existing category |
| `cost` | number, greater than 0 |
| `billingCycle` | `"monthly"` \| `"quarterly"` \| `"yearly"` \| `"one_time"` |
| `renewalDate` | ISO date string `YYYY-MM-DD` |
| `status` | `"active"` \| `"inactive"` |
| `notes` | string, optional, ≤ 500 chars |
| `createdAt` / `updatedAt` | ISO timestamps, set by the store |

### Validation as a standalone module

`lib/validateService.js` has no React or DOM imports — it's a pure function that
takes form values and returns an errors object. This keeps the rules unit-tested
independently of the UI (`validateService.test.js`, 47 cases) and reusable by
the Settings page (`validateCategory`).

### Context + service split

Each React context holds only state and delegates every read/write to a
`services/*Service.js` module. That isolates persistence (today localStorage,
later an HTTP API) from the components.
