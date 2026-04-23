"""Print Queue router — accessible by printing_user and admin."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_printing_user
from app.models.audit_log import OrderAuditLog
from app.models.order import Order
from app.models.order_attachment import OrderAttachment
from app.models.user import User
from app.routers.admin import AdminOrderResponse, _build_admin_order_response
from app.schemas.order import AttachmentResponse, AuditLogResponse

router = APIRouter()


@router.get("/", response_model=list[AdminOrderResponse])
async def list_print_queue(
    user: User = Depends(get_printing_user),
    db: AsyncSession = Depends(get_db),
):
    """List orders in the print queue (status = 'PRINTING'). Admin sees all orders."""
    query = (
        select(Order)
        .order_by(Order.created_at.desc())
    )
    if user.role != "ADMIN":
        query = query.where(Order.status == "PRINTING")

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
async def get_print_order(
    order_id: str,
    user: User = Depends(get_printing_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.audit_logs), selectinload(Order.attachments))
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


@router.get("/{order_id}/audit", response_model=list[AuditLogResponse])
async def get_print_order_audit(
    order_id: str,
    user: User = Depends(get_printing_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(OrderAuditLog)
        .where(OrderAuditLog.order_id == order_id)
        .order_by(OrderAuditLog.changed_at.asc())
    )
    return result.scalars().all()


@router.get("/{order_id}/attachments", response_model=list[AttachmentResponse])
async def list_print_order_attachments(
    order_id: str,
    user: User = Depends(get_printing_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(OrderAttachment)
        .where(OrderAttachment.order_id == order_id)
        .order_by(OrderAttachment.created_at.asc())
    )
    return result.scalars().all()
