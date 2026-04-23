from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.services.auth_service import decode_token

security = HTTPBearer()

# ── Role-transition rules ──────────────────────────────────────────────────────
# Canonical UPPERCASE vocabulary. None means "no restriction" (ADMIN).
ROLE_TRANSITIONS: dict[str, dict[str, list[str] | None]] = {
    "DESIGN": {
        "view": ["CONFIRM"],
        "to": ["ENQUIRY", "ONHOLD", "INPROGRESS", "REVIEW", "PRINTING"],
    },
    "PRINTING": {
        "view": ["PRINTING"],
        "to": ["ENQUIRY", "INPROGRESS", "CONFIRM", "ONHOLD", "SHIPPING"],
    },
    "SHIPPING": {
        "view": ["SHIPPING"],
        "to": ["ONHOLD", "DISPATCHED"],
    },
    "ADMIN": {
        "view": None,
        "to": None,
    },
}


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    payload = decode_token(credentials.credentials)
    if not payload or payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")
    return user


async def get_current_admin(user: User = Depends(get_current_user)) -> User:
    if not user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user


def require_roles(*roles: str):
    """Returns a FastAPI dependency that checks user.role is in the given roles."""
    async def dep(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {list(roles)}",
            )
        return user
    return dep


# Convenience dependencies (canonical UPPERCASE role names)
get_design_user = require_roles("DESIGN", "ADMIN")
get_printing_user = require_roles("PRINTING", "ADMIN")
get_shipping_user = require_roles("SHIPPING", "ADMIN")
get_any_staff = require_roles("DESIGN", "PRINTING", "SHIPPING", "ADMIN")
