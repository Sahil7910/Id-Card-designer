from fastapi import APIRouter, Depends, Request, UploadFile

from app.dependencies import get_current_user
from app.limiter import limiter
from app.models.user import User
from app.services.image_service import save_image

router = APIRouter()


@router.post("/image")
@limiter.limit("10/minute")
async def upload_image(
    request: Request,
    file: UploadFile,
    user: User = Depends(get_current_user),
):
    url = await save_image(file)
    return {"url": url}
