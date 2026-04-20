"""
认证路由
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from passlib.hash import bcrypt
from database import get_db
from models import AdminUser
from schemas import LoginRequest, LoginResponse
import sys
import os

# 动态从项目根目录加载auth模块（避免循环导入）
import importlib.util
def load_root_auth():
    backend_path = os.environ.get('BACKEND_PATH', '/app')
    spec = importlib.util.spec_from_file_location("root_auth", os.path.join(backend_path, "auth.py"))
    module = importlib.util.module_from_spec(spec)
    sys.modules["root_auth"] = module
    spec.loader.exec_module(module)
    return module

root_auth = load_root_auth()
create_token = root_auth.create_token
get_current_admin = root_auth.get_current_admin

router = APIRouter()


@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(AdminUser).filter(AdminUser.username == request.username).first()

    if not user:
        raise HTTPException(status_code=401, detail="用户名或密码错误")

    if not bcrypt.verify(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="用户名或密码错误")

    token = create_token({"sub": user.username, "role": user.role, "user_id": user.id, "type": "user"})

    return LoginResponse(
        token=token,
        user={"id": user.id, "username": user.username, "role": user.role}
    )


@router.get("/me")
def get_me(current_admin: dict = Depends(get_current_admin)):
    return {"username": current_admin["sub"], "role": current_admin["role"]}


@router.post("/change-password")
def change_password(
    current_password: str,
    new_password: str,
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_admin)
):
    user = db.query(AdminUser).filter(AdminUser.username == current_admin["sub"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    if not bcrypt.verify(current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="当前密码错误")

    user.password_hash = bcrypt.hash(new_password)
    db.commit()
    return {"success": True, "message": "密码修改成功"}
