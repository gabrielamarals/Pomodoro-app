"""Create the production-ready application schema.

Revision ID: 20260807_01
Revises:
Create Date: 2026-08-07
"""
from alembic import op

from app.schema import metadata


revision = "20260807_01"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    metadata.create_all(bind=op.get_bind())


def downgrade() -> None:
    metadata.drop_all(bind=op.get_bind())
