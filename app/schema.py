from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    ForeignKey,
    Index,
    Integer,
    MetaData,
    String,
    Table,
    Text,
    UniqueConstraint,
    false,
    func,
    true,
)


metadata = MetaData()

users = Table(
    "users",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("email", String(320), nullable=False, unique=True),
    Column("password_hash", Text, nullable=False),
    Column("google_sub", String(255), unique=True),
    Column("created_at", String(40), nullable=False),
)

categories = Table(
    "categories",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("name", String(50), nullable=False),
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True),
)
Index("uq_categories_user_name", categories.c.user_id, func.lower(categories.c.name), unique=True)

sessions = Table(
    "sessions",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("work_time", Integer, nullable=False),
    Column("rest_time", Integer, nullable=False),
    Column("session_date", String(10), nullable=False, index=True),
    Column("goal", String(160)),
    Column("category_id", Integer, ForeignKey("categories.id", ondelete="SET NULL")),
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True),
    Column("focus_quality", Integer),
    Column("distraction", String(30)),
    Column("distraction_note", String(160)),
    CheckConstraint("work_time BETWEEN 1 AND 120", name="ck_sessions_work_time"),
    CheckConstraint("rest_time BETWEEN 1 AND 60", name="ck_sessions_rest_time"),
    CheckConstraint("focus_quality IS NULL OR focus_quality BETWEEN 0 AND 5", name="ck_sessions_focus_quality"),
)

goals = Table(
    "goals",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("daily_goal_minutes", Integer, nullable=False),
    Column("created_at", String(40), nullable=False),
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True),
    CheckConstraint("daily_goal_minutes BETWEEN 1 AND 720", name="ck_goals_minutes"),
)

auth_sessions = Table(
    "auth_sessions",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
    Column("token_hash", String(64), nullable=False, unique=True),
    Column("expires_at", String(40), nullable=False),
    Column("created_at", String(40), nullable=False),
)

profiles = Table(
    "profiles",
    metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("display_name", String(40)),
    Column("age_range", String(30)),
    Column("primary_goal", String(30)),
    Column("main_difficulty", String(30)),
    Column("focus_range", String(20)),
    Column("days_per_week", Integer),
    Column("onboarding_completed", Boolean, nullable=False, default=False, server_default=false()),
    Column("created_at", String(40), nullable=False),
    Column("updated_at", String(40), nullable=False),
    CheckConstraint("days_per_week IS NULL OR days_per_week BETWEEN 1 AND 7", name="ck_profiles_days_per_week"),
)

user_preferences = Table(
    "user_preferences",
    metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("focus_minutes", Integer, nullable=False, default=25, server_default="25"),
    Column("rest_minutes", Integer, nullable=False, default=5, server_default="5"),
    Column("long_rest_minutes", Integer, nullable=False, default=15, server_default="15"),
    Column("sessions_before_long_rest", Integer, nullable=False, default=4, server_default="4"),
    Column("auto_start_rest", Boolean, nullable=False, default=True, server_default=true()),
    Column("auto_start_focus", Boolean, nullable=False, default=True, server_default=true()),
    Column("sound_enabled", Boolean, nullable=False, default=True, server_default=true()),
    Column("notifications_enabled", Boolean, nullable=False, default=True, server_default=true()),
    Column("theme", String(20), nullable=False, default="natural", server_default="natural"),
    Column("locale", String(10), nullable=False, default="pt-BR", server_default="pt-BR"),
    Column("created_at", String(40), nullable=False),
    Column("updated_at", String(40), nullable=False),
)
