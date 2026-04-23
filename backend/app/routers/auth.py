import hashlib
import secrets

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, status
from app.limiter import limiter
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import (
    ForgotPasswordRequest,
    GoogleAuthRequest,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserResponse,
    UserUpdate,
)
from app.services.auth_service import (
    create_access_token,
    create_refresh_token,
    create_reset_token,
    decode_token,
    hash_password,
    verify_password,
    verify_reset_token,
)
from app.services.email_service import send_password_reset_email

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("3/minute")
async def register(request: Request, data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        first_name=data.first_name,
        last_name=data.last_name,
        company=data.company,
        phone=data.phone,
    )
    db.add(user)
    await db.flush()

    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def login(request: Request, data: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled")

    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    payload = decode_token(data.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user)):
    return user


@router.put("/me", response_model=UserResponse)
async def update_me(
    data: UserUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(user, key, value)
    await db.flush()
    return user


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
@limiter.limit("3/minute")
async def forgot_password(request: Request, data: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    if user and user.is_active:
        token = create_reset_token(user.id, user.password_hash)
        reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        name = user.first_name or user.email
        await send_password_reset_email(user.email, name, reset_link)
    # Always return 200 to prevent email enumeration
    return {"message": "If that email is registered, a reset link has been sent."}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(data: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    result = verify_reset_token(data.token)
    if not result:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset link.")
    user_id, fp = result

    db_result = await db.execute(select(User).where(User.id == user_id))
    user = db_result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset link.")

    current_fp = hashlib.md5(user.password_hash.encode()).hexdigest()[:8]
    if current_fp != fp:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reset link has already been used.")

    user.password_hash = hash_password(data.new_password)
    await db.flush()
    return {"message": "Password updated successfully. You can now sign in."}


@router.post("/google", response_model=TokenResponse)
@limiter.limit("10/minute")
async def google_auth(request: Request, data: GoogleAuthRequest, db: AsyncSession = Depends(get_db)):
    # Verify access token with Google and fetch user info
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {data.access_token}"},
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Google token.")

    info = resp.json()
    google_id: str = info.get("sub", "")
    email: str = info.get("email", "")
    if not google_id or not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Google account has no email.")

    # Try to find existing user by google_id first, then by email
    result = await db.execute(select(User).where(User.google_id == google_id))
    user = result.scalar_one_or_none()

    if not user:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

    if user:
        # Link google_id to existing email/password account if not already linked
        if not user.google_id:
            user.google_id = google_id
            user.oauth_provider = "google"
            await db.flush()
        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled.")
    else:
        # Create new user from Google profile
        name_parts = info.get("name", email.split("@")[0]).split(" ", 1)
        user = User(
            email=email,
            password_hash=hash_password(secrets.token_hex(32)),
            first_name=name_parts[0],
            last_name=name_parts[1] if len(name_parts) > 1 else "",
            google_id=google_id,
            oauth_provider="google",
        )
        db.add(user)
        await db.flush()

    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )
