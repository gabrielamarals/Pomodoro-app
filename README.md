# Study Tracker Pomodoro

A study productivity application that combines a Pomodoro timer with study session tracking.

The main goal of this project is to help users organize their focus sessions, record their study time, review their study history, and track their progress over time.

## Project Status

This project is currently under development.

The first version is being developed as a terminal application using Python and SQLite. A graphical interface is planned for future versions.

## Current Features 

- Start a focus session
- Start a break session
- Choose custom focus and break durations
- Save completed sessions in a SQLite database
- Store the date of each study session
- Search study sessions by date
- Calculate the total study time for a specific day

## Planned Features

- [x] Pomodoro timer
- [x] Custom focus and break durations
- [x] SQLite database integration
- [x] Save completed study sessions
- [ ] View recent study sessions
- [ ] Search sessions by month and year
- [ ] Display the days studied during a selected month
- [ ] Monthly study calendar
- [ ] Daily, weekly, and monthly statistics
- [ ] Study subjects and project categories
- [ ] Daily and weekly study goals
- [ ] Graphical user interface
- [ ] Charts and productivity reports

## Technologies

- Python
- SQLite


## Project Structure

study-tracker-pomodoro/
├── main.py
├── timer.py
├── database.py
├── pomodoro.db
└── README.md


### File Responsibilities

- `main.py`: controls the application menu and general program flow.
- `timer.py`: contains the focus and break timer logic.
- `database.py`: handles database creation, session storage, and queries.
- `pomodoro.db`: stores the study session data locally.
- `README.md`: contains the project documentation.

## Database Structure

The current database contains a `sessions` table.


Dates are stored using the following format:

YYYY-MM-DD

Example:

2026-07-22

## How to Run

### Requirements

- Python 3.10 or newer
- Git, if you want to clone the repository

SQLite support is already included with Python, so no additional database installation is required.

### Clone the Repository

```bash
git clone YOUR_REPOSITORY_URL
```

### Enter the Project Folder

```bash
cd YOUR_PROJECT_FOLDER
```

### Run the Application

```bash
python main.py
```

Depending on your system, you may need to use:

```bash
python3 main.py
```

## Application Flow

The first version of the application will provide a terminal menu similar to this:

```text
=== STUDY TRACKER POMODORO ===

1 - Start a study session
2 - Search sessions by date
3 - View recent sessions
4 - Exit
```

Each option calls a different part of the application.

For example, when a study session is completed, the application saves the focus time, break time, and current date in the SQLite database.

## Future Vision

Future versions of the application may include a visual calendar.

Days could be displayed using different colors according to the user's study activity:

- Green: study activity completed
- Yellow: partial daily goal completed
- Red: planned study goal not completed
- Gray: rest day or future date

Users may also be able to select a day and view information such as:

- Total study time
- Total break time
- Number of completed sessions
- Subjects studied
- Study history for that date

## Learning Goals

This project is also being developed as a learning experience.

The main concepts practiced during development include:

- Python functions
- Modules and file organization
- Loops and conditional structures
- Error handling
- SQLite databases
- SQL queries
- Data persistence
- Date manipulation
- Back-end organization
- Git and GitHub
- Integration between back-end and front-end

## Contributing

This is currently a personal learning project, but suggestions and feedback are welcome.

## Author

Developed by Gabriel Augusto Amaral Silva.