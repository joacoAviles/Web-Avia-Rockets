"""backfill missing cause titles from captured PJUD data

Revision ID: 20260903_0017
Revises: 20260903_0016
"""
from alembic import op


revision = "20260903_0017"
down_revision = "20260903_0016"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        WITH candidates AS (
          SELECT cause_id,
                 NULLIF(BTRIM(raw_case_payload #>> '{metadata,caratulado}'),'') AS title,
                 COALESCE(finished_at,created_at) AS observed_at
          FROM legal.pjud_case_checks
          UNION ALL
          SELECT cause_id,
                 NULLIF(BTRIM(result_payload #>> '{metadata,caratulado}'),''),
                 COALESCE(completed_at,updated_at,created_at)
          FROM legal.pjud_run_items
          UNION ALL
          SELECT matched_cause_id,
                 NULLIF(BTRIM(raw_data_json ->> 'caratulado'),''),
                 created_at
          FROM legal.procurador_daily_rows
          WHERE matched_cause_id IS NOT NULL
        ), latest AS (
          SELECT DISTINCT ON (candidates.cause_id) candidates.cause_id,candidates.title
          FROM candidates
          WHERE candidates.title IS NOT NULL
          ORDER BY candidates.cause_id, candidates.observed_at DESC NULLS LAST
        )
        UPDATE legal.causes cause
        SET party=latest.title,updated_at=now()
        FROM latest
        WHERE cause.id=latest.cause_id AND NULLIF(BTRIM(cause.party),'') IS NULL
        """
    )


def downgrade() -> None:
    pass
