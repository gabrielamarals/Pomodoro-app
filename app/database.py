from datetime import date, datetime, timedelta

from sqlalchemy import and_, func, insert, select, update
from sqlalchemy.exc import IntegrityError

from .db import engine, initialize_database as _initialize_database
from .errors import CategoryAccessError, DuplicateCategoryError
from .schema import categories, goals, profiles, sessions, user_preferences, users


PROFILE_FIELDS = {
    "display_name", "age_range", "primary_goal", "main_difficulty",
    "focus_range", "days_per_week",
}
PREFERENCE_FIELDS = {
    "focus_minutes", "rest_minutes", "long_rest_minutes",
    "sessions_before_long_rest", "auto_start_rest", "auto_start_focus",
    "sound_enabled", "notifications_enabled", "theme", "locale",
}
SESSION_FIELDS = (
    "id", "work_time", "rest_time", "session_date", "goal", "category_id",
    "category_name", "focus_quality", "distraction", "distraction_note",
    "client_session_id",
)


def _now() -> str:
    return datetime.now().isoformat(timespec="seconds")


def initialize_database() -> None:
    _initialize_database()


def ensure_user_settings(user_id: int) -> None:
    """Create default profile and preference rows without overwriting user data."""
    now = _now()
    with engine.begin() as connection:
        if connection.execute(select(profiles.c.user_id).where(profiles.c.user_id == user_id)).first() is None:
            try:
                connection.execute(insert(profiles).values(user_id=user_id, created_at=now, updated_at=now))
            except IntegrityError:
                pass
        if connection.execute(select(user_preferences.c.user_id).where(user_preferences.c.user_id == user_id)).first() is None:
            try:
                connection.execute(insert(user_preferences).values(user_id=user_id, created_at=now, updated_at=now))
            except IntegrityError:
                pass


def get_profile(user_id: int):
    ensure_user_settings(user_id)
    with engine.connect() as connection:
        row = connection.execute(select(profiles).where(profiles.c.user_id == user_id)).mappings().first()
    return dict(row) if row else None


def update_profile(user_id: int, values: dict, complete: bool = False):
    ensure_user_settings(user_id)
    clean_values = {key: value for key, value in values.items() if key in PROFILE_FIELDS and value is not None}
    clean_values["updated_at"] = _now()
    if complete:
        clean_values["onboarding_completed"] = True
    with engine.begin() as connection:
        connection.execute(update(profiles).where(profiles.c.user_id == user_id).values(**clean_values))
    return get_profile(user_id)


def get_preferences(user_id: int):
    ensure_user_settings(user_id)
    with engine.connect() as connection:
        row = connection.execute(
            select(user_preferences).where(user_preferences.c.user_id == user_id)
        ).mappings().first()
    return dict(row) if row else None


def update_preferences(user_id: int, values: dict):
    ensure_user_settings(user_id)
    clean_values = {key: value for key, value in values.items() if key in PREFERENCE_FIELDS and value is not None}
    if not clean_values:
        return get_preferences(user_id)
    clean_values["updated_at"] = _now()
    with engine.begin() as connection:
        connection.execute(
            update(user_preferences).where(user_preferences.c.user_id == user_id).values(**clean_values)
        )
    return get_preferences(user_id)


def create_category(category_name: str, user_id: int):
    normalized_name = category_name.strip()
    with engine.begin() as connection:
        duplicate = connection.execute(
            select(categories.c.id).where(
                categories.c.user_id == user_id,
                func.lower(categories.c.name) == normalized_name.lower(),
            )
        ).first()
        if duplicate:
            raise DuplicateCategoryError("Category already exists.")
        try:
            result = connection.execute(insert(categories).values(name=normalized_name, user_id=user_id))
        except IntegrityError as error:
            raise DuplicateCategoryError("Category already exists.") from error
        category_id = result.inserted_primary_key[0]
    return {"id": category_id, "name": normalized_name}


def get_categories(user_id: int):
    with engine.connect() as connection:
        rows = connection.execute(
            select(categories.c.id, categories.c.name)
            .where(categories.c.user_id == user_id)
            .order_by(func.lower(categories.c.name))
        ).mappings().all()
    return [dict(row) for row in rows]


def _session_query(user_id: int):
    category_join = sessions.outerjoin(
        categories,
        and_(sessions.c.category_id == categories.c.id, categories.c.user_id == user_id),
    )
    return select(
        sessions.c.id,
        sessions.c.work_time,
        sessions.c.rest_time,
        sessions.c.session_date,
        sessions.c.goal,
        sessions.c.category_id,
        categories.c.name.label("category_name"),
        sessions.c.focus_quality,
        sessions.c.distraction,
        sessions.c.distraction_note,
        sessions.c.client_session_id,
    ).select_from(category_join).where(sessions.c.user_id == user_id)


def get_sessions_by_category(category_id: int, user_id: int):
    with engine.connect() as connection:
        owns_category = connection.execute(
            select(categories.c.id).where(categories.c.id == category_id, categories.c.user_id == user_id)
        ).first()
        if owns_category is None:
            return []
        rows = connection.execute(
            _session_query(user_id)
            .where(sessions.c.category_id == category_id)
            .order_by(sessions.c.session_date.desc(), sessions.c.id.desc())
        ).mappings().all()
    return [dict(row) for row in rows]


def create_goal(daily_goal_minutes: int, user_id: int):
    created_at = _now()
    with engine.begin() as connection:
        result = connection.execute(insert(goals).values(
            daily_goal_minutes=daily_goal_minutes, created_at=created_at, user_id=user_id,
        ))
        goal_id = result.inserted_primary_key[0]
    return {"id": goal_id, "daily_goal_minutes": daily_goal_minutes, "created_at": created_at}


def get_current_goal(user_id: int):
    with engine.connect() as connection:
        row = connection.execute(
            select(goals.c.id, goals.c.daily_goal_minutes, goals.c.created_at)
            .where(goals.c.user_id == user_id)
            .order_by(goals.c.id.desc())
            .limit(1)
        ).mappings().first()
    return dict(row) if row else None


def save_session(
    work_time,
    rest_time,
    session_date,
    goal=None,
    category_id=None,
    client_session_id=None,
    user_id=None,
):
    if user_id is None:
        raise ValueError("An authenticated user is required.")

    def find_existing(connection):
        if not client_session_id:
            return None
        return connection.execute(
            _session_query(user_id).where(
                sessions.c.client_session_id == client_session_id
            )
        ).mappings().first()

    try:
        with engine.begin() as connection:
            existing = find_existing(connection)
            if existing:
                return dict(existing)

            if category_id is not None:
                owner = connection.execute(
                    select(categories.c.user_id).where(categories.c.id == category_id)
                ).scalar_one_or_none()
                if owner != user_id:
                    raise CategoryAccessError("Category does not belong to this user.")

            result = connection.execute(insert(sessions).values(
                work_time=work_time,
                rest_time=rest_time,
                session_date=str(session_date),
                goal=goal,
                category_id=category_id,
                client_session_id=client_session_id,
                user_id=user_id,
            ))
            session_id = result.inserted_primary_key[0]
            created = connection.execute(
                _session_query(user_id).where(sessions.c.id == session_id)
            ).mappings().one()
            return dict(created)
    except IntegrityError:
        # Two retries with the same client ID can arrive together. The unique
        # constraint keeps one row; the other request returns that same row.
        with engine.connect() as connection:
            existing = find_existing(connection)
        if existing:
            return dict(existing)
        raise


def get_daily_summary(session_date, user_id: int):
    with engine.connect() as connection:
        row = connection.execute(select(
            func.count(sessions.c.id).label("session_count"),
            func.coalesce(func.sum(sessions.c.work_time), 0).label("total_work_time"),
        ).where(sessions.c.session_date == str(session_date), sessions.c.user_id == user_id)).mappings().one()
    return {"date": str(session_date), **dict(row)}


def get_current_streak(user_id: int):
    with engine.connect() as connection:
        rows = connection.execute(
            select(sessions.c.session_date).distinct()
            .where(sessions.c.user_id == user_id)
            .order_by(sessions.c.session_date.desc())
        ).all()
    studied_dates = {date.fromisoformat(row[0]) for row in rows}
    if not studied_dates:
        return 0
    latest_date = min(max(studied_dates), date.today())
    if latest_date < date.today() - timedelta(days=1):
        return 0
    streak = 0
    while latest_date in studied_dates:
        streak += 1
        latest_date -= timedelta(days=1)
    return streak


def _summary_between(start: str, end: str, user_id: int):
    with engine.connect() as connection:
        rows = connection.execute(select(
            sessions.c.session_date.label("date"),
            func.count(sessions.c.id).label("session_count"),
            func.coalesce(func.sum(sessions.c.work_time), 0).label("total_work_time"),
        ).where(
            sessions.c.session_date.between(start, end), sessions.c.user_id == user_id,
        ).group_by(sessions.c.session_date).order_by(sessions.c.session_date)).mappings().all()
    return [dict(row) for row in rows]


def get_monthly_summary(month_year: str, user_id: int):
    start = f"{month_year}-01"
    if month_year.endswith("-12"):
        next_month = f"{int(month_year[:4]) + 1}-01-01"
    else:
        next_month = f"{month_year[:5]}{int(month_year[5:7]) + 1:02d}-01"
    with engine.connect() as connection:
        rows = connection.execute(select(
            sessions.c.session_date.label("date"),
            func.count(sessions.c.id).label("session_count"),
            func.coalesce(func.sum(sessions.c.work_time), 0).label("total_work_time"),
        ).where(
            sessions.c.session_date >= start,
            sessions.c.session_date < next_month,
            sessions.c.user_id == user_id,
        ).group_by(sessions.c.session_date).order_by(sessions.c.session_date)).mappings().all()
    return [dict(row) for row in rows]


def get_sessions_by_date(session_date, user_id: int):
    with engine.connect() as connection:
        rows = connection.execute(
            _session_query(user_id)
            .where(sessions.c.session_date == str(session_date))
            .order_by(sessions.c.id)
        ).mappings().all()
    return [dict(row) for row in rows]


def get_session_by_client_id(client_session_id: str, user_id: int):
    with engine.connect() as connection:
        row = connection.execute(
            _session_query(user_id).where(
                sessions.c.client_session_id == client_session_id
            )
        ).mappings().first()
    return dict(row) if row else None


def get_recent_sessions(limit=20, user_id=None):
    if user_id is None:
        return []
    with engine.connect() as connection:
        rows = connection.execute(
            _session_query(user_id)
            .order_by(sessions.c.session_date.desc(), sessions.c.id.desc())
            .limit(limit)
        ).mappings().all()
    return [dict(row) for row in rows]


def update_session_reflection(session_id, focus_quality, distraction=None, distraction_note=None, user_id=None):
    if user_id is None:
        return None
    with engine.begin() as connection:
        result = connection.execute(update(sessions).where(
            sessions.c.id == session_id, sessions.c.user_id == user_id,
        ).values(
            focus_quality=focus_quality,
            distraction=distraction,
            distraction_note=distraction_note,
        ))
        if result.rowcount == 0:
            return None
        row = connection.execute(
            _session_query(user_id).where(sessions.c.id == session_id)
        ).mappings().first()
    return dict(row) if row else None


def get_weekly_summary(start_date: date, user_id: int):
    return _summary_between(str(start_date), str(start_date + timedelta(days=6)), user_id)
