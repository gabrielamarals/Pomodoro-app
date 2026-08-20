# Foco — Study Tracker

Foco is a bilingual study productivity tracker that combines a Pomodoro timer with session history, goals, categories and study analytics. It was built as a practical project to deepen my knowledge of Python, SQL, REST APIs, authentication and full-stack integration.

**Live application:** https://foco-pomodoro.gabrielamarals.workers.dev  
**API health:** https://foco-api-thc3.onrender.com/health

## Features

- configurable focus and rest timer with pause, resume and immersive mode;
- timer recovery after page reloads;
- user registration, login and logout;
- Google OAuth login;
- authenticated sessions with user data isolation;
- study session tracking with optional goals and categories;
- daily, weekly and monthly summaries;
- study streak and consistency map;
- optional focus-quality and distraction check-in;
- onboarding and individual preferences;
- Portuguese and English interface;
- responsive layout for desktop and mobile browsers.

## Tech stack

### Back-end

- Python 3.10+
- FastAPI
- SQLAlchemy 2
- Alembic
- SQLite for local development
- PostgreSQL in production
- Argon2 password hashing
- Google OAuth 2.0 / OpenID Connect

### Front-end

- TypeScript
- React 19
- Vinext / Vite
- Cloudflare Workers
- responsive CSS and centralized i18n

## Architecture

```text
Browser
  → React/Vinext front-end (Cloudflare Worker)
  → same-origin /api proxy
  → FastAPI API (Render)
  → PostgreSQL (production)

Local development
  → FastAPI API
  → SQLite
```

The front-end never accesses the database directly. Database selection is centralized in `app/db.py`: local development defaults to SQLite, while production uses PostgreSQL through the same SQLAlchemy persistence layer.

The `/api` proxy keeps authentication cookies first-party from the browser's point of view, which avoids relying on third-party cookies across the front-end and API domains.

## Project structure

```text
app/
  api.py          # HTTP routes, authentication and web configuration
  auth.py         # users, password hashing and authenticated sessions
  database.py     # domain operations and queries
  db.py           # database engine and SQLite/PostgreSQL selection
  schema.py       # SQLAlchemy schema
frontend/
  app/            # pages and components
  lib/config/     # API configuration
  lib/services/   # HTTP service layer
  lib/i18n/       # pt-BR/en translations
  worker/         # Cloudflare Worker and /api proxy
migrations/       # Alembic migrations
tests/            # automated API tests
docs/             # project planning and historical notes
render.yaml       # back-end and PostgreSQL deployment configuration
```

## Run locally

### Requirements

- Python 3.10 or newer;
- Node.js 22.13 or newer;
- pnpm.

### Back-end

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app.api:app --reload
```

Without `DATABASE_URL`, the application creates a local SQLite database at `app/pomodoro.db`.

### Front-end

```powershell
cd frontend
pnpm install
pnpm run dev
```

Open `http://localhost:3000`. During local development, the Worker forwards `/api` to `http://127.0.0.1:8000`.

On Windows, `run-local.bat` can also start both processes.

## Environment variables

Copy `.env.example` to `.env` only for local development. Never commit `.env` files.

### API

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL URL in production; empty uses local SQLite |
| `FRONTEND_URL` | public front-end URL |
| `CORS_ORIGINS` | allowed origins separated by commas |
| `COOKIE_SECURE` | `true` when using HTTPS in production |
| `COOKIE_SAMESITE` | SameSite cookie policy |
| `GOOGLE_CLIENT_ID` | Google OAuth client identifier |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret, back-end only |
| `GOOGLE_REDIRECT_URI` | authorized Google callback URL |

### Front-end

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | browser API path; defaults to `/api` |
| `API_ORIGIN` | FastAPI origin used by the Worker |
| `VITE_API_ORIGIN` | FastAPI origin during local development/build |

The example environment files contain names and non-sensitive examples only.

## Database and migrations

Production uses PostgreSQL and applies migrations with:

```bash
alembic upgrade head
```

`render.yaml` runs the migration before starting Uvicorn. Local SQLite data is never copied to production.

## Tests and quality checks

Back-end tests cover API health, authentication, onboarding, preferences, idempotent session creation and isolation of data between users.

```powershell
python -m unittest discover -s tests -v
```

Front-end checks:

```powershell
cd frontend
pnpm run lint
pnpm run build
```

GitHub Actions runs these checks automatically for pushes and pull requests targeting `main`.

## Security notes

- passwords are stored only as Argon2 hashes;
- random session tokens are stored as hashes;
- production cookies use `HttpOnly`, `Secure` and `SameSite` settings;
- logout revokes the corresponding server-side session;
- sessions, categories, goals, profiles and preferences are scoped to the authenticated user;
- local databases and secrets are excluded from version control.

## What I learned

This project helped me practice and understand:

- designing and validating REST endpoints with FastAPI and Pydantic;
- relational data modeling and SQL queries;
- separating application data between authenticated users;
- password hashing and server-side session management;
- moving a project from SQLite to PostgreSQL with SQLAlchemy and Alembic;
- integrating a browser front-end with a Python API;
- writing automated API tests for real user flows;
- preparing a small application for deployment and public use.

## Development notes

I created the product and developed the Python/SQL back-end as a learning project. The front-end design and parts of the production-readiness work were developed with assistance from OpenAI Codex. AI assistance was used as a development tool, while I reviewed the changes and used the project to study the underlying architecture, API, database and deployment decisions.

## Next steps

- collect feedback from real usage;
- improve reports about session quality;
- add an optional end-of-session reflection flow;
- explore personalized insights only after enough reliable usage data exists.
