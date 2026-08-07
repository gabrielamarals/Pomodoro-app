"""Add an idempotency key to study sessions.

Revision ID: 20260807_04
Revises: 20260807_03
Create Date: 2026-08-07
"""

from alembic import op
import sqlalchemy as sa


revision = "20260807_04"
down_revision = "20260807_03"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("sessions") as batch_op:
        batch_op.add_column(sa.Column("client_session_id", sa.String(length=36), nullable=True))
        batch_op.create_unique_constraint(
            "uq_sessions_user_client_session",
            ["user_id", "client_session_id"],
        )


def downgrade() -> None:
    with op.batch_alter_table("sessions") as batch_op:
        batch_op.drop_constraint("uq_sessions_user_client_session", type_="unique")
        batch_op.drop_column("client_session_id")
