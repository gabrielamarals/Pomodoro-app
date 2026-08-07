"""Remove controlled end-to-end diagnostic records.

Revision ID: 20260807_02
Revises: 20260807_01
Create Date: 2026-08-07
"""
from alembic import op


revision = "20260807_02"
down_revision = "20260807_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("DELETE FROM users WHERE email LIKE 'e2e-%@example.invalid'")


def downgrade() -> None:
    # Diagnostic users contain no product data and must not be recreated.
    pass
