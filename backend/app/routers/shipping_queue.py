"""Shipping Queue router — accessible by shipping_user and admin."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_shipping_user
from app.models.audit_log import OrderAuditLog
from app.models.order import Order
from app.models.user import User
from app.routers.admin import AdminOrderResponse, _build_admin_order_response
from app.schemas.order import AuditLogResponse, TrackingUpdate
from app.services.order_service import write_audit_log

router = APIRouter()


@router.get("/", response_model=list[AdminOrderResponse])
async def list_shipping_queue(
    user: User = Depends(get_shipping_user),
    db: AsyncSession = Depends(get_db),
):
    """List orders in the shipping queue (status = 'SHIPPING'). Admin sees all orders."""
    query = (
        select(Order)
        .order_by(Order.created_at.desc())
    )
    if user.role != "ADMIN":
        query = query.where(Order.status == "SHIPPING")

    result = await db.execute(query)
    orders = result.scalars().all()

    responses = []
    for order in orders:
        user_result = await db.execute(select(User).where(User.id == order.user_id))
        order_user = user_result.scalar_one_or_none()
        if order_user:
            responses.append(_build_admin_order_response(order, order_user))
    return responses


@router.get("/{order_id}", response_model=AdminOrderResponse)
async def get_shipping_order(
    order_id: str,
    user: User = Depends(get_shipping_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.audit_logs))
        .where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    user_result = await db.execute(select(User).where(User.id == order.user_id))
    order_user = user_result.scalar_one_or_none()
    if not order_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order user not found")

    return _build_admin_order_response(order, order_user)


@router.patch("/{order_id}/tracking")
async def update_tracking(
    order_id: str,
    data: TrackingUpdate,
    user: User = Depends(get_shipping_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if data.tracking_number is not None:
        order.tracking_number = data.tracking_number
    if data.courier_name is not None:
        order.courier_name = data.courier_name
    if data.tracking_url is not None:
        order.tracking_url = data.tracking_url

    await db.flush()

    # Write audit log for tracking update
    await write_audit_log(
        db,
        order.id,
        user,
        old_status=order.status,
        new_status=order.status,
        note=data.note or f"Tracking updated: {data.tracking_number or ''}",
    )

    return {
        "id": order.id,
        "tracking_number": order.tracking_number,
        "courier_name": order.courier_name,
        "tracking_url": order.tracking_url,
    }


@router.get("/{order_id}/audit", response_model=list[AuditLogResponse])
async def get_shipping_order_audit(
    order_id: str,
    user: User = Depends(get_shipping_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(OrderAuditLog)
        .where(OrderAuditLog.order_id == order_id)
        .order_by(OrderAuditLog.changed_at.asc())
    )
    return result.scalars().all()
