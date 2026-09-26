# Smart Dashboard — Backend (Django + DRF)

## Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows  (macOS/Linux: source .venv/bin/activate)
pip install -r requirements.txt
copy .env.example .env          # macOS/Linux: cp .env.example .env
python manage.py migrate
python manage.py createsuperuser   # optional, for /admin
python manage.py runserver         # http://127.0.0.1:8000
```

## Structure

```
backend/
├── config/            # project settings + root urls
├── apps/
│   ├── accounts/      # Member 1
│   ├── services/      # Member 2
│   └── dashboard/     # Member 3
├── requirements.txt
└── .env.example
```

Each app is already registered in `INSTALLED_APPS` and mounted in `config/urls.py`:

| App | URL prefix |
|---|---|
| accounts | `/api/accounts/` |
| services | `/api/services/` |
| dashboard | `/api/dashboard/` |

## Task split

**Member 1 — `apps/accounts` (auth + profile)**
- Register / login / logout (token or session auth)
- Profile endpoint (name, email) — matches Settings → Profile in the frontend
- Switch DRF default permission to `IsAuthenticated` once auth works

**Member 2 — `apps/services` (core data)**
- `Category` model (name, color) + CRUD
- `Service` model (name, category, cost, billing_cycle, renewal_date, status, notes, timestamps) + CRUD
- Validation matching `frontend/src/lib/validateService.js`
- Search / filter by name and category

**Member 3 — `apps/dashboard` (stats + user settings)**
- Summary endpoint: service count, monthly spend, yearly estimate, next renewal
- User settings: notifications, appearance (theme), preferences (currency, default status, date format)
- Seed command to load `frontend/src/data/services.json`

**Shared:** hook the frontend `src/services/*.js` files up to the API in place of localStorage.

## Ground rules
- Work only inside your own app to avoid conflicts; ask before editing `config/`.
- Run `python manage.py makemigrations <your_app>` for your own app only.
- Update `requirements.txt` (`pip freeze > requirements.txt`) when adding packages.
