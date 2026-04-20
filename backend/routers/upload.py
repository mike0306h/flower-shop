"""
文件上传路由
"""
import os
import uuid
from datetime import datetime
from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import shutil

router = APIRouter()

# 上传目录
UPLOAD_DIR = "/app/static/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/image")
async def upload_image(file: UploadFile = File(...)):
    """上传单张图片，返回URL"""
    # 验证文件类型
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="只支持 JPG/PNG/GIF/WebP 格式")

    # 验证文件大小 (5MB)
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="图片大小不能超过 5MB")

    # 生成唯一文件名
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    # 保存文件
    with open(filepath, "wb") as f:
        f.write(contents)

    return {
        "url": f"/static/uploads/{filename}",
        "filename": filename,
        "size": len(contents)
    }


@router.post("/images")
async def upload_images(files: list[UploadFile] = File(...)):
    """批量上传图片"""
    results = []
    for file in files[:5]:  # 最多5张
        try:
            allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
            if file.content_type not in allowed_types:
                continue

            contents = await file.read()
            if len(contents) > 5 * 1024 * 1024:
                continue

            ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
            filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:8]}.{ext}"
            filepath = os.path.join(UPLOAD_DIR, filename)

            with open(filepath, "wb") as f:
                f.write(contents)

            results.append({
                "url": f"/static/uploads/{filename}",
                "filename": filename,
                "size": len(contents)
            })
        except Exception:
            continue

    return {"items": results}
