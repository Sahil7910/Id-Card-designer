"""Design Queue router — accessible by design_user and admin."""
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from fastapi import File as FastAPIFile
from fastapi import Form
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_design_user
from app.models.audit_log import OrderAuditLog
from app.models.design import Design
from app.models.order import Order, OrderItem
from app.models.order_attachment import OrderAttachment
from app.models.user import User
from app.routers.admin import AdminOrderResponse, _build_admin_order_response
from app.schemas.order import AttachmentResponse, AuditLogResponse
from app.services.image_service import save_file

router = APIRouter()


@router.get("/", response_model=list[AdminOrderResponse])
async def list_design_queue(
    user: User = Depends(get_design_user),
    db: AsyncSession = Depends(get_db),
):
    """List orders in the design queue (status = 'CONFIRM'). Admin sees all orders."""
    query = (
        select(Order)
        .join(User, Order.user_id == User.id)
        .order_by(Order.created_at.desc())
    )
    if user.role != "ADMIN":
        query = query.where(Order.status == "CONFIRM")

    result = await db.execute(query)
    orders = result.scalars().all()

    # Build responses (need user info per order)
    responses = []
    for order in orders:
        user_result = await db.execute(select(User).where(User.id == order.user_id))
        order_user = user_result.scalar_one_or_none()
        if order_user:
            responses.append(_build_admin_order_response(order, order_user))
    return responses


@router.get("/{order_id}", response_model=AdminOrderResponse)
async def get_design_order(
    order_id: str,
    user: User = Depends(get_design_user),
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

    # Load design thumbnails for each order item
    design_ids = [item.design_id for item in order.items if item.design_id]
    design_thumbnails: dict[str, str | None] = {}
    if design_ids:
        designs_result = await db.execute(select(Design).where(Design.id.in_(design_ids)))
        for d in designs_result.scalars().all():
            design_thumbnails[d.id] = d.thumbnail_url

    return _build_admin_order_response(order, order_user, design_thumbnails)


@router.get("/{order_id}/audit", response_model=list[AuditLogResponse])
async def get_design_order_audit(
    order_id: str,
    user: User = Depends(get_design_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(OrderAuditLog)
        .where(OrderAuditLog.order_id == order_id)
        .order_by(OrderAuditLog.changed_at.asc())
    )
    return result.scalars().all()


@router.get("/{order_id}/attachments", response_model=list[AttachmentResponse])
async def list_design_order_attachments(
    order_id: str,
    user: User = Depends(get_design_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(OrderAttachment)
        .where(OrderAttachment.order_id == order_id)
        .order_by(OrderAttachment.created_at.asc())
    )
    return result.scalars().all()


@router.post("/{order_id}/attachments", response_model=AttachmentResponse, status_code=status.HTTP_201_CREATED)
async def upload_design_attachment(
    order_id: str,
    file_type: str = Form(...),  # design_sample | print_ready | reference
    file: UploadFile = FastAPIFile(...),
    user: User = Depends(get_design_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify order exists
    order_result = await db.execute(select(Order).where(Order.id == order_id))
    order = order_result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    valid_types = {"design_sample", "print_ready", "reference"}
    if file_type not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file_type. Must be one of: {valid_types}",
        )

    file_url = await save_file(file)

    attachment = OrderAttachment(
        id=str(uuid.uuid4()),
        order_id=order_id,
        uploaded_by=user.id,
        file_name=file.filename or "attachment",
        file_url=file_url,
        file_type=file_type,
    )
    db.add(attachment)
    await db.flush()
    await db.refresh(attachment)
    return attachment
