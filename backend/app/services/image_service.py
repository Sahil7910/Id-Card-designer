import os
import uuid

from fastapi import HTTPException, UploadFile

from app.config import settings

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

ALLOWED_FILE_TYPES = {"image/jpeg", "image/png", "image/webp", "application/pdf"}
ALLOWED_FILE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".pdf"}


def _detect_mime(data: bytes) -> str | None:
    """Detect MIME type from magic bytes — cannot be spoofed by the client."""
    if data[:3] == b"\xff\xd8\xff":
        return "image/jpeg"
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return "image/png"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    if data[:4] == b"%PDF":
        return "application/pdf"
    return None


async def save_image(file: UploadFile) -> str:
    # Validate content type (client-supplied — defence-in-depth only)
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"File type {file.content_type} not allowed. Use JPG, PNG, or WebP.")

    contents = await file.read()
    if len(contents) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=400, detail=f"File too large. Max size is {settings.MAX_UPLOAD_SIZE // (1024*1024)}MB.")

    # Magic-byte validation — cannot be spoofed by the client
    actual_mime = _detect_mime(contents)
    if actual_mime not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="File content does not match an allowed image type.")

    ext = os.path.splitext(file.filename or "image.jpg")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        ext = ".jpg"
    filename = f"{uuid.uuid4()}{ext}"

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    filepath = os.path.join(settings.UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(contents)

    return f"/uploads/{filename}"


async def save_file(file: UploadFile) -> str:
    """Save any allowed file (images + PDF). Used for order attachments."""
    if file.content_type not in ALLOWED_FILE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"File type {file.content_type} not allowed. Use JPG, PNG, WebP, or PDF.",
        )

    contents = await file.read()
    if len(contents) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Max size is {settings.MAX_UPLOAD_SIZE // (1024 * 1024)}MB.",
        )

    # Magic-byte validation
    actual_mime = _detect_mime(contents)
    if actual_mime not in ALLOWED_FILE_TYPES:
        raise HTTPException(status_code=400, detail="File content does not match an allowed file type.")

    ext = os.path.splitext(file.filename or "file.pdf")[1].lower()
    if ext not in ALLOWED_FILE_EXTENSIONS:
        ext = ".pdf"
    filename = f"{uuid.uuid4()}{ext}"

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    filepath = os.path.join(settings.UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(contents)

    return f"/uploads/{filename}"
