from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import ROLE_TRANSITIONS, get_current_admin, get_current_user
from app.models.order import Order
from app.models.user import User
from app.schemas.order import OrderCreate, OrderResponse, OrderStatusUpdate
from app.services.order_service import create_order, write_audit_log

router = APIRouter()


@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def place_order(
    data: OrderCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Only customers (and admin for testing) can place orders
    if user.role not in {"CUSTOMER", "ADMIN"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only customers can place orders",
        )
    order = await create_order(db, user.id, data)
    return order


@router.get("/", response_model=list[OrderResponse])
async def list_orders(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if user.role not in {"CUSTOMER", "ADMIN"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Use your role-specific queue endpoint to view orders",
        )
    offset = (page - 1) * per_page
    result = await db.execute(
        select(Order)
        .where(Order.user_id == user.id)
        .order_by(Order.created_at.desc())
        .offset(offset)
        .limit(per_page)
    )
    return result.scalars().all()


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if user.role not in {"CUSTOMER", "ADMIN"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Use your role-specific queue endpoint to view orders",
        )
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    if order.user_id != user.id and user.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your order")
    return order


@router.patch("/{order_id}/status")
async def update_order_status(
    order_id: str,
    data: OrderStatusUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update order status with role-based transition enforcement and audit logging."""
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    # Role-based transition enforcement (admin bypasses all checks)
    user_role = getattr(user, "role", "CUSTOMER")
    if user_role != "ADMIN":
        # Check user is staff
        if user_role not in ROLE_TRANSITIONS:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to update order status",
            )
        allowed_to = ROLE_TRANSITIONS[user_role]["to"]
        if allowed_to is not None and data.status not in allowed_to:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Your role '{user_role}' cannot set status to '{data.status}'",
            )

    old_status = order.status
    order.status = data.status
    await db.flush()

    # Write audit log
    await write_audit_log(db, order.id, user, old_status=old_status, new_status=data.status, note=data.note)

    # Return minimal payload to avoid ORM serialisation issues
    return {"id": order.id, "status": order.status}
