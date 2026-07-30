# Study Tracker Pomodoro

A Pomodoro application that combines focus sessions with study tracking, progress
visualization, and, in future versions, short reflections about the quality of each
session.

## Development responsibilities

This is a collaborative learning project with clearly separated responsibilities:

- **Gabriel Augusto Amaral Silva:** responsible for learning, designing, and
  implementing the back-end, including Python, SQLite, SQL queries, the future API,
  and its integration with the database.
- **OpenAI Codex:** responsible for designing and implementing the front-end,
  including the interface, user experience, responsiveness, visual components, and
  future HTTP integration with the API.

The front-end does not access SQLite directly. Back-end changes remain Gabriel's
responsibility unless he explicitly requests assistance with a specific change.

## Project status

The project is under active development.

The Python and SQLite data layer can already create and save sessions, produce daily
and monthly summaries, retrieve sessions from a selected date, and list recent
sessions. The web interface currently includes the timer, progress dashboard,
study-activity map, and history screen.

The front-end is temporarily powered by clearly identified mock data. The next major
milestone is a Python API that will connect the interface to the real back-end data.

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
- group monthly activity by date;
- retrieve individual sessions from a selected date;
- retrieve a limited number of recent sessions;
- order history from newest to oldest;
- run focus and rest sessions through the terminal prototype.

### Front-end

- responsive Pomodoro timer interface;
- focus and rest modes;
- configurable focus and rest durations;
- pause, continue, and cancel controls;
- progress dashboard;
- weekly activity chart;
- monthly study-activity map inspired by contribution calendars;
- interactive daily summary;
- session history grouped by date;
- isolated service and mock-data layers prepared for the future API.

> The data displayed by the web interface is currently demonstrative and is not yet
> loaded from SQLite.

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
- [ ] Python HTTP API
- [ ] Front-end and API integration
- [ ] Replace mock data with real responses
- [ ] Complete monthly calendar
- [ ] Post-session reflection
- [ ] Subjects and project categories
- [ ] Light, dark, and custom visual themes
- [ ] Automated tests
- [ ] Authentication and user profiles
- [ ] Advanced reports and personalized insights
- [ ] Optional AI-assisted weekly insights

## Technologies

### Back-end

- Python
- SQLite
- SQL
- FastAPI planned for the HTTP API

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

### Run the front-end

```bash
cd frontend
pnpm install
pnpm dev
```

Open `http://localhost:3000` in the browser.

The API is not available yet, so the front-end currently uses demonstration data.

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
