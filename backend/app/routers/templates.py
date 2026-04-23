import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.template import Template
from app.models.user import User
from app.schemas.template import TemplateResponse, UserTemplateCreate

router = APIRouter()


# ── Public: list system templates ────────────────────────────────────────────

@router.get("/", response_model=list[TemplateResponse])
async def list_templates(
    category: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Return active system templates (user_id IS NULL)."""
    query = (
        select(Template)
        .where(Template.is_active == True, Template.user_id == None)
    )
    if category:
        query = query.where(Template.category == category)
    query = query.order_by(Template.name)

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{template_id}", response_model=TemplateResponse)
async def get_template(template_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Template).where(Template.id == template_id))
    template = result.scalar_one_or_none()

    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    return template


# ── Authenticated: personal templates ────────────────────────────────────────

@router.get("/my/list", response_model=list[TemplateResponse])
async def list_my_templates(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return all personal templates belonging to the current user."""
    result = await db.execute(
        select(Template)
        .where(Template.user_id == user.id)
        .order_by(Template.created_at.desc())
    )
    return result.scalars().all()


@router.post("/my", response_model=TemplateResponse, status_code=status.HTTP_201_CREATED)
async def save_my_template(
    data: UserTemplateCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Save the current design as a personal template for the logged-in user."""
    template = Template(
        id=str(uuid.uuid4()),
        name=data.name,
        category=None,
        accent_color=data.accent_color,
        bg_color=data.bg_color,
        front_fields=data.front_fields,
        back_fields=data.back_fields,
        front_bg_url=data.front_bg_url,
        back_bg_url=data.back_bg_url,
        orientation=data.orientation,
        is_active=True,
        user_id=user.id,
    )
    db.add(template)
    await db.flush()
    await db.refresh(template)
    return template


@router.delete("/my/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_template(
    template_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a personal template owned by the current user."""
    result = await db.execute(select(Template).where(Template.id == template_id))
    template = result.scalar_one_or_none()

    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    if template.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your template")

    await db.delete(template)
