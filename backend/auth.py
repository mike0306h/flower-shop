"""
JWT 认证模块
"""
from datetime import datetime, timedelta
from typing import Optional
import jwt
import os
from fastapi import Depends, HTTPException, Header

SECRET_KEY = os.getenv("JWT_SECRET", "flower-shop-secret-key-2024")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24 * 7  # 7 days


def create_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


async def get_current_admin(authorization: str = Header(None)) -> dict:
    """FastAPI 依赖项：从 Authorization header 获取当前管理员"""
    if not authorization:
        raise HTTPException(status_code=401, detail="未提供认证 token")

    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="无效的认证方式")
    except ValueError:
        raise HTTPException(status_code=401, detail="无效的认证格式")

    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token 已过期或无效")

    # 检查是否是用户 token
    if payload.get("type") != "user":
        raise HTTPException(status_code=401, detail="无效的 token 类型")

    return payload


async def get_current_user_optional(authorization: str = Header(None)) -> Optional[dict]:
    """获取当前用户，如果未登录返回 None"""
    if not authorization:
        return None

    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            return None
    except ValueError:
        return None

    payload = decode_token(token)
    if not payload:
        return None

    if payload.get("type") != "user":
        return None

    # 统一使用 id 字段（兼容 user_id 和 id 两种格式）
    if "user_id" in payload and "id" not in payload:
        payload["id"] = payload["user_id"]

    return payload


async def get_current_user(authorization: str = Header(None)) -> dict:
    """获取当前登录用户，未登录抛出异常"""
    result = await get_current_user_optional(authorization)
    if not result:
        raise HTTPException(status_code=401, detail="请先登录")
    return result
