import asyncio
import logging

import razorpay
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel

from app.config import settings
from app.dependencies import get_current_user
from app.limiter import limiter
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter()


class InitiatePaymentRequest(BaseModel):
    amount: float  # grand total in INR


class InitiatePaymentResponse(BaseModel):
    razorpay_order_id: str
    amount_paise: int
    currency: str
    key_id: str


@router.post("/initiate", response_model=InitiatePaymentResponse)
@limiter.limit("10/minute")
async def initiate_payment(
    request: Request,
    data: InitiatePaymentRequest,
    _user: User = Depends(get_current_user),
) -> InitiatePaymentResponse:
    """Create a Razorpay order and return the order ID + key for the frontend popup."""
    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Payment gateway not configured. Please try COD or contact support.",
        )

    amount_paise = int(round(data.amount * 100))

    try:
        client = razorpay.Client(
            auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
        )
        rz_order = await asyncio.to_thread(
            client.order.create,
            {
                "amount": amount_paise,
                "currency": "INR",
                "payment_capture": 1,  # auto-capture
            },
        )
    except Exception as exc:
        logger.error("Razorpay order creation failed: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Payment gateway error. Please try again.",
        )

    return InitiatePaymentResponse(
        razorpay_order_id=rz_order["id"],
        amount_paise=amount_paise,
        currency="INR",
        key_id=settings.RAZORPAY_KEY_ID,
    )
