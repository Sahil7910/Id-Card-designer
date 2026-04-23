from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.config import settings
from app.limiter import limiter
from app.routers import admin, auth, designs, orders, pricing, templates, uploads
from app.routers import design_queue, print_queue, shipping_queue

# Import new models so Alembic / SQLAlchemy metadata picks them up
import app.models.audit_log  # noqa: F401
import app.models.order_attachment  # noqa: F401
import app.models.order_serial_counter  # noqa: F401

app = FastAPI(
    title="ID Card Designer API",
    version="1.0.0",
    description="Backend API for the ID Card Designer application",
)

# ── Rate limiting ─────────────────────────────────────────────────────────────
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    return JSONResponse(
        status_code=429,
        content={"detail": "Too many requests. Please wait and try again."},
    )


# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(designs.router, prefix="/api/designs", tags=["Designs"])
app.include_router(templates.router, prefix="/api/templates", tags=["Templates"])
app.include_router(orders.router, prefix="/api/orders", tags=["Orders"])
app.include_router(uploads.router, prefix="/api/uploads", tags=["Uploads"])
app.include_router(pricing.router, prefix="/api/pricing", tags=["Pricing"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(design_queue.router, prefix="/api/design-queue", tags=["Design Queue"])
app.include_router(print_queue.router, prefix="/api/print-queue", tags=["Print Queue"])
app.include_router(shipping_queue.router, prefix="/api/shipping-queue", tags=["Shipping Queue"])

app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}
