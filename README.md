# Study Tracker Pomodoro

A Pomodoro application that combines focus sessions with study tracking, progress
visualization, and optional short check-ins about the quality of each session.

## Development responsibilities

This is a collaborative learning project with clearly separated responsibilities:

- **Gabriel Augusto Amaral Silva:** leads the back-end design and development,
  including Python, SQLite, SQL queries, FastAPI, validation, and database
  integration, with AI-assisted mentoring and implementation support.
- **OpenAI Codex:** leads the front-end implementation, including interface,
  user experience, responsiveness, visual components, and HTTP integration with
  the API.

The front-end does not access SQLite directly. Back-end changes remain Gabriel's
responsibility unless he explicitly requests assistance with a specific change.

## Project status

The local v0.1 is complete and usable for daily study. v0.2 now adds persistent
profiles, first-login onboarding, server-backed Pomodoro preferences, and the
foundation for Portuguese/English UI.

The Python, SQLite, and FastAPI layers save completed focus sessions and provide
daily, weekly, monthly, history, category, selected-date, goal, and streak data.
The web interface consumes these API responses and includes a timer, automatic
focus/rest transitions, progress dashboard, configurable goals, navigable activity
map, category session details, history, quick focus check-ins, and themes.

## Product vision

Most Pomodoro applications show how long a person studied. This project also aims to
help users understand **how well** their study sessions went.

Alongside time and session statistics, future versions may include a quick,
optional post-session reflection:

- focus quality;
- whether the intended objective was completed;
- study subject or project;
- main distraction;
- a short note.

These records may later support respectful insights about study patterns without
punishing users or turning the end of a session into a long questionnaire.

## Current features

### Back-end

- initialize a local SQLite database;
- save completed focus and rest sessions;
- calculate the session count and focus time for a day;
- calculate weekly activity and compare it with the previous week;
- group monthly activity by date;
- retrieve individual sessions from a selected date;
- retrieve a limited number of recent sessions;
- order history from newest to oldest;
- update a session with an optional focus check-in;
- save and retrieve the current daily study goal;
- calculate the current consecutive study-day streak;
- expose the data through FastAPI endpoints.

### Front-end

- responsive Pomodoro timer interface;
- focus and rest modes;
- configurable focus and rest durations;
- pause, continue, and cancel controls;
- automatic focus/rest transitions;
- timer recovery after a page refresh;
- optional completion sound and browser notification;
- optional focus-quality and distraction check-in during rest;
- category screen with sessions and check-in details;
- immersive focus mode that hides secondary controls while studying;
- progress dashboard;
- real weekly and monthly activity data;
- navigable monthly study-activity map;
- interactive daily summary;
- session history grouped by date;
- category selection and creation;
- local theme selection.
- first-login onboarding connected to the authenticated user;
- persistent profile and Pomodoro preferences;
- centralized i18n dictionary foundation for `pt-BR` and `en`.
- language selection persisted in the account preferences and local browser;
- sound and browser-notification preferences connected to timer transitions.

The current version is local-only and uses the Python API running on the same
computer. Authentication and online synchronization are planned for v0.2.

## Roadmap

- [x] SQLite database initialization
- [x] Completed-session storage
- [x] Daily summary query
- [x] Monthly summary grouped by day
- [x] Sessions-by-date query
- [x] Recent-session query with a configurable limit
- [x] Web timer interface
- [x] Progress dashboard
- [x] Study-activity map
- [x] Initial history interface
- [x] Python HTTP API
- [x] Front-end and API integration
- [x] Replace core mock data with real responses
- [x] Complete monthly calendar navigation
- [x] Automatic focus/rest transitions
- [x] Recover active timer after page refresh
- [x] Quick post-session check-in
- [x] Category session details
- [x] Immersive focus mode
- [x] Configurable daily and weekly study goals
- [x] Current consecutive-study streak
- [x] Browser tab timer title
- [x] Local account registration and persistent cookie sessions
- [x] Google OAuth flow prepared (requires local Google Cloud credentials)
- [ ] End-of-study-block reflection
- [x] Local development launcher
- [ ] Post-session reflection
- [x] Subjects and project categories
- [x] Light, dark, and custom visual themes
- [ ] Automated tests
- [x] Authentication and user profiles
- [x] First-login onboarding and persistent Pomodoro preferences
- [x] i18n foundation for Portuguese and English
- [x] User-scoped new sessions, categories, and goals (legacy rows preserved as unassigned)
- [ ] Advanced reports and personalized insights
- [ ] Optional AI-assisted weekly insights

## Technologies

### Back-end

- Python
- SQLite
- SQL
- FastAPI for the HTTP API
- Google OAuth 2.0 / OpenID Connect for optional sign-in

### Front-end

- TypeScript
- React
- Vinext
- CSS

## Project structure

```text
Pomodoro-app/
├── app/
│   ├── main.py
│   ├── session.py
│   ├── timer.py
│   ├── database.py
│   └── pomodoro.db
├── frontend/
│   ├── app/
│   ├── lib/
│   │   ├── mocks/
│   │   └── services/
│   └── package.json
├── docs/
├── README.md
└── requirements.txt        # added when the API dependencies are installed
```

### Back-end file responsibilities

- `app/main.py`: initializes the database and starts the terminal application.
- `app/session.py`: controls the current terminal session flow.
- `app/timer.py`: contains the terminal timer logic.
- `app/database.py`: owns database initialization, persistence, and queries.

### Front-end organization

- `frontend/app`: routes, reusable visual components, and global styles.
- `frontend/lib/mocks`: temporary data used before the API is available.
- `frontend/lib/services`: the boundary that will later make HTTP requests.

## Current database

The SQLite database contains a `sessions` table:

| Field | Type | Purpose |
|---|---|---|
| `id` | INTEGER | Unique session identifier |
| `work_time` | INTEGER | Focus duration in minutes |
| `rest_time` | INTEGER | Rest duration in minutes |
| `session_date` | TEXT | Session date in `YYYY-MM-DD` format |

The database structure will evolve only when the back-end requirements make those
changes necessary.

## Running locally

### Requirements

- Python 3.10 or newer
- Node.js 22.13 or newer
- pnpm

SQLite support is included with Python.

### Clone the repository

```bash
git clone https://github.com/gabrielamarals/Pomodoro-app.git
cd Pomodoro-app
```

### Run the terminal back-end prototype

From the project root:

```bash
python app/main.py
```

Depending on the operating system, the command may be:

```bash
python3 app/main.py
```

### Run the local API and front-end

Use the project launcher from the repository root:

```bash
run-local.bat
```

Open `http://localhost:3000` in the browser.

The API runs at `http://127.0.0.1:8000` and the front-end communicates with it
through HTTP. The front-end does not access SQLite directly.

## Learning goals

The project is also a practical learning environment for:

- Python and modular back-end organization;
- relational databases and SQL;
- data persistence and aggregation;
- HTTP APIs and JSON contracts;
- testing and debugging;
- Git and GitHub;
- front-end/back-end integration;
- data analysis and future machine-learning applications;
- technical decision-making and project documentation.

## Author

Product idea and back-end development by **Gabriel Augusto Amaral Silva**.

Front-end developed collaboratively with **OpenAI Codex**, following the project's
explicit separation of responsibilities.
