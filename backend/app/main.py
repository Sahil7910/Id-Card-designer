from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.routers import admin, auth, designs, orders, pricing, templates, uploads

app = FastAPI(
    title="ID Card Designer API",
    version="1.0.0",
    description="Backend API for the ID Card Designer application",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(designs.router, prefix="/api/designs", tags=["Designs"])
app.include_router(templates.router, prefix="/api/templates", tags=["Templates"])
app.include_router(orders.router, prefix="/api/orders", tags=["Orders"])
app.include_router(uploads.router, prefix="/api/uploads", tags=["Uploads"])
app.include_router(pricing.router, prefix="/api/pricing", tags=["Pricing"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])

app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}
