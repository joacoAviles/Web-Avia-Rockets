from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import auth as auth_routes
from app.api.deps import current_user
from app.core.database import get_db
from app.models import User
from app.schemas import LoginRequest, RefreshRequest, RegisterRequest

router = APIRouter(tags=["web-compat"])


@router.post("/auth/register", status_code=status.HTTP_201_CREATED, include_in_schema=False)
@router.post("/api/auth/register", status_code=status.HTTP_201_CREATED, include_in_schema=False)
async def register_compat(payload: RegisterRequest, db: AsyncSession = Depends(get_db)) -> dict:
    return await auth_routes.register(payload, db)


@router.post("/auth/login", include_in_schema=False)
@router.post("/api/auth/login", include_in_schema=False)
@router.post("/login", include_in_schema=False)
async def login_compat(payload: LoginRequest, db: AsyncSession = Depends(get_db)) -> dict:
    return await auth_routes.login(payload, db)


@router.post("/auth/refresh", include_in_schema=False)
@router.post("/api/auth/refresh", include_in_schema=False)
async def refresh_compat(payload: RefreshRequest, db: AsyncSession = Depends(get_db)) -> dict:
    return await auth_routes.refresh(payload, db)


@router.get("/auth/me", include_in_schema=False)
@router.get("/api/auth/me", include_in_schema=False)
async def me_compat(user: Annotated[User, Depends(current_user)]) -> dict:
    return await auth_routes.me(user)


@router.get("/api/dashboard", include_in_schema=False)
async def dashboard_compat(
    user: Annotated[User, Depends(current_user)],
    db: AsyncSession = Depends(get_db),
) -> dict:
    user_data = auth_routes.user_payload(user)
    result = await db.execute(
        text(
            """
            SELECT c.id, c.court, c.rol, c.year, c.party, c.status, c.publicada,
                   c.last_checked_at, c.last_summary,
                   lm.title AS latest_movement, lm.etapa, lm.tramite,
                   lm.descripcion, lm.movement_date, lm.book_name,
                   CASE WHEN portfolio.admin_edited THEN portfolio.responsible_name
                     ELSE COALESCE(portfolio.responsible_name, assigned_user.full_name, assigned_user.email) END AS assigned_lawyer,
                   portfolio.portfolio_id, portfolio.portfolio_name,
                   portfolio.visible_to, portfolio.client_id,
                   cs.fields AS client_fields, COALESCE(cs.castigo,false) AS client_castigo
            FROM legal.causes c
            JOIN legal.cause_assignments assignment
              ON assignment.cause_id = c.id
             AND assignment.procurador_user_id = :user_id
             AND assignment.assignment_status = 'active'
             AND (assignment.valid_until IS NULL OR assignment.valid_until >= CURRENT_DATE)
            LEFT JOIN platform.users assigned_user ON assigned_user.id = assignment.procurador_user_id
            LEFT JOIN LATERAL (
                SELECT m.title, m.etapa, m.tramite, m.descripcion,
                       m.movement_date, b.name AS book_name
                FROM legal.movements m
                LEFT JOIN legal.pjud_books b ON b.id = m.book_id
                WHERE m.cause_id = c.id
                ORDER BY COALESCE(m.movement_date, m.captured_at, m.created_at) DESC NULLS LAST
                LIMIT 1
            ) lm ON TRUE
            LEFT JOIN LATERAL (
                SELECT pc.responsible_name,
                       p.client_id,
                       COALESCE((pc.settings->>'admin_edited')::boolean,false) AS admin_edited,
                       p.id AS portfolio_id,
                       p.name AS portfolio_name,
                       CASE WHEN COALESCE((pc.settings->>'admin_edited')::boolean,false)
                         THEN (SELECT string_agg(COALESCE(cr.name,cr.email), ', ' ORDER BY cr.email)
                           FROM legal.legal_portfolio_case_recipients cr WHERE cr.portfolio_case_id=pc.id AND cr.is_active)
                         ELSE (SELECT string_agg(COALESCE(r.name,r.email), ', ' ORDER BY r.display_order,r.email)
                           FROM legal.legal_portfolio_recipients r WHERE r.portfolio_id=p.id AND r.is_active)
                       END AS visible_to
                FROM legal.legal_portfolio_cases pc
                JOIN legal.legal_portfolios p ON p.id = pc.portfolio_id
                JOIN legal.legal_clients lc ON lc.id=p.client_id
                WHERE pc.case_id = c.id AND p.status = 'active'
                  AND (lc.organization_id=:org_id OR EXISTS (
                    SELECT 1 FROM legal.client_administrators a WHERE a.client_id=p.client_id AND a.user_id=:user_id))
                ORDER BY (pc.status='active') DESC,p.display_order,p.id,pc.id
                LIMIT 1
            ) portfolio ON TRUE
            LEFT JOIN legal.client_cause_settings cs ON cs.client_id=portfolio.client_id AND cs.cause_id=c.id
            ORDER BY c.created_at DESC
            """
        ),
        {"user_id": user.id, "org_id": user.organization_id},
    )
    causes = []
    for row in result.mappings():
        fields = row["client_fields"] or {}
        movement = row["etapa"] or row["tramite"] or row["latest_movement"] or row["descripcion"]
        causes.append(
            {
                "id": str(row["id"]),
                "code": fields.get("code",row["rol"]),
                "rol": fields.get("code",row["rol"]),
                "year": fields.get("year",row["year"]),
                "publicada": bool(row["publicada"]) and not row["client_castigo"],
                "pjud_publicada": bool(row["publicada"]),
                "client_castigo": row["client_castigo"],
                "client_id": str(row["client_id"]) if row["client_id"] else None,
                "court": fields.get("court",row["court"]),
                "title": fields.get("title",row["party"]),
                "status": row["status"],
                "user_status": row["status"],
                "last_checked_at": row["last_checked_at"],
                "last_summary": row["last_summary"],
                "latest_movement": movement,
                "latest_stage": row["etapa"],
                "latest_procedure": row["tramite"],
                "latest_book": row["book_name"],
                "movement_date": row["movement_date"],
                "assigned_lawyer": row["assigned_lawyer"],
                "visibility_label": row["visible_to"],
                "email_group": row["portfolio_name"],
                "email_group_id": str(row["portfolio_id"]) if row["portfolio_id"] else None,
            }
        )
    active_count = sum(1 for cause in causes if cause["status"] == "active")
    lawyer_names = sorted({cause["assigned_lawyer"] for cause in causes if cause["assigned_lawyer"]})
    email_groups = {
        cause["email_group_id"]: cause["email_group"]
        for cause in causes
        if cause["email_group_id"] and cause["email_group"]
    }
    progress_rows = [
        dict(row)
        for row in (
            await db.execute(
                text(
                    """
                    select u.id::text as procurador_user_id,
                           coalesce(u.full_name, u.email) as procurador_name,
                           u.email as procurador_email,
                           b.id::text as batch_id,
                           b.report_date,
                           coalesce((b.metadata ->> 'base_total_count')::int, b.matched_count + b.missing_count, 0) as total_base,
                           b.matched_count as assigned_count,
                           b.missing_count as pending_count,
                           b.email_status,
                           b.status
                    from platform.users u
                    left join lateral (
                        select *
                        from legal.procurador_daily_batches b
                        where b.organization_id = u.organization_id
                          and b.procurador_user_id = u.id
                          and b.status in ('completed', 'ready_for_review')
                        order by b.report_date desc, b.version desc, b.created_at desc
                        limit 1
                    ) b on true
                    where u.organization_id = :org_id
                      and (u.role = 'procurador' or lower(u.email) like 'procurador@%')
                      and u.is_active = true
                    order by u.email
                    """
                ),
                {"org_id": user.organization_id},
            )
        ).mappings()
    ]
    procurador_progress = []
    for row in progress_rows:
        total_base = int(row["total_base"] or 0)
        assigned_count = int(row["assigned_count"] or 0)
        pending_count = int(row["pending_count"] or 0)
        procurador_progress.append(
            {
                "procurador_user_id": row["procurador_user_id"],
                "name": row["procurador_name"],
                "email": row["procurador_email"],
                "batch_id": row["batch_id"],
                "report_date": row["report_date"].isoformat() if row["report_date"] else None,
                "assigned_count": assigned_count,
                "pending_count": pending_count,
                "total_base": total_base,
                "progress_percent": round((assigned_count / total_base) * 100) if total_base else 0,
                "status": row["status"],
                "email_status": row["email_status"],
            }
        )
    return {
        "user": user_data,
        "account": {
            "subscription": {"plan_slug": "procurador" if user.role == "procurador" else "standard", "is_paid": True},
            "terms": {"version": "1.102"},
        },
        "products": user_data["products"],
        "causes": causes,
        "procurador_progress": procurador_progress,
        "legal_catalogs": {
            "lawyers": [{"id": name, "name": name} for name in lawyer_names],
            "visibilityGroups": [],
            "emailGroups": [{"id": key, "name": value} for key, value in email_groups.items()],
            "books": [],
        },
        "stats": {
            "active_causes_count": active_count,
            "inactive_causes_count": len(causes) - active_count,
            "daily_summary_email_enabled": True,
        },
    }
