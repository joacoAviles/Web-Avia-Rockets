"""index historical title lookups

Revision ID: 20260903_0016
Revises: 20260726_0015
"""
from alembic import op


revision = "20260903_0016"
down_revision = "20260726_0015"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index(
        "ix_legal_pjud_run_items_cause_id",
        "pjud_run_items",
        ["cause_id"],
        schema="legal",
    )
    op.create_index(
        "ix_legal_procurador_daily_rows_matched_cause_id",
        "procurador_daily_rows",
        ["matched_cause_id"],
        schema="legal",
    )


def downgrade() -> None:
    op.drop_index("ix_legal_procurador_daily_rows_matched_cause_id", table_name="procurador_daily_rows", schema="legal")
    op.drop_index("ix_legal_pjud_run_items_cause_id", table_name="pjud_run_items", schema="legal")
