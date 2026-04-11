from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.template import Template
from app.schemas.template import TemplateResponse

router = APIRouter()


@router.get("/", response_model=list[TemplateResponse])
async def list_templates(
    category: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    query = select(Template).where(Template.is_active == True)
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
