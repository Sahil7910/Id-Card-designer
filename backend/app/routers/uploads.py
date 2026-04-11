from fastapi import APIRouter, Depends, UploadFile

from app.dependencies import get_current_user
from app.models.user import User
from app.services.image_service import save_image

router = APIRouter()


@router.post("/image")
async def upload_image(
    file: UploadFile,
    user: User = Depends(get_current_user),
):
    url = await save_image(file)
    return {"url": url}
