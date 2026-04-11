from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.design import Design
from app.models.user import User
from app.schemas.design import DesignCreate, DesignResponse, DesignUpdate

router = APIRouter()


@router.get("/", response_model=list[DesignResponse])
async def list_designs(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    offset = (page - 1) * per_page
    result = await db.execute(
        select(Design)
        .where(Design.user_id == user.id)
        .order_by(Design.updated_at.desc())
        .offset(offset)
        .limit(per_page)
    )
    return result.scalars().all()


@router.post("/", response_model=DesignResponse, status_code=status.HTTP_201_CREATED)
async def create_design(
    data: DesignCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    design = Design(user_id=user.id, **data.model_dump())
    db.add(design)
    await db.flush()
    return design


@router.get("/{design_id}", response_model=DesignResponse)
async def get_design(
    design_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Design).where(Design.id == design_id))
    design = result.scalar_one_or_none()

    if not design:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Design not found")
    if design.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your design")
    return design


@router.put("/{design_id}", response_model=DesignResponse)
async def update_design(
    design_id: str,
    data: DesignUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Design).where(Design.id == design_id))
    design = result.scalar_one_or_none()

    if not design:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Design not found")
    if design.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your design")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(design, key, value)
    await db.flush()
    await db.refresh(design)
    return design


@router.delete("/{design_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_design(
    design_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Design).where(Design.id == design_id))
    design = result.scalar_one_or_none()

    if not design:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Design not found")
    if design.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your design")

    await db.delete(design)
