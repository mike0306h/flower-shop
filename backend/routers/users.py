"""
用户路由
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional
from database import get_db
from models import User, Address
from schemas import UserResponse

router = APIRouter()


@router.get("")
def get_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(User)

    if search:
        query = query.filter(
            (User.email.contains(search)) |
            (User.name.contains(search)) |
            (User.phone.contains(search))
        )

    total = query.count()
    users = query.order_by(desc(User.created_at)).offset((page - 1) * page_size).limit(page_size).all()

    return {
        "items": [UserResponse.model_validate(u).model_dump() for u in users],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": (total + page_size - 1) // page_size
    }


@router.get("/{user_id}")
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return UserResponse.model_validate(user).model_dump()


@router.get("/{user_id}/addresses")
def get_user_addresses(user_id: int, db: Session = Depends(get_db)):
    addresses = db.query(Address).filter(Address.user_id == user_id).all()
    return addresses
