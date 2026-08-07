"""Remove follow-up end-to-end diagnostic accounts.

Revision ID: 20260807_03
Revises: 20260807_02
Create Date: 2026-08-07
"""

from alembic import op
import sqlalchemy as sa


revision = "20260807_03"
down_revision = "20260807_02"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        sa.text("DELETE FROM users WHERE email LIKE :pattern").bindparams(
            pattern="e2e-%@example.invalid"
        )
    )


def downgrade() -> None:
    pass
