"""
优惠券管理
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from database import get_db
from models import Coupon
from schemas import CouponCreate, CouponUpdate, CouponResponse
from auth import get_current_admin

router = APIRouter()


# 公开接口：获取可用优惠券列表（用户可见）
@router.get("/available", response_model=dict)
def get_available_coupons(
    db: Session = Depends(get_db),
):
    """返回所有未过期的、已激活的优惠券，供用户在前台领取/查看"""
    from datetime import datetime
    now = datetime.now()
    coupons = db.query(Coupon).filter(
        Coupon.active == True,
        (Coupon.expires_at == None) | (Coupon.expires_at > now)
    ).order_by(Coupon.created_at.desc()).all()
    return {
        "items": [CouponResponse.model_validate(c).model_dump() for c in coupons],
        "total": len(coupons)
    }


# 公开接口：验证优惠券码（结账时使用）
class ValidateCouponRequest(BaseModel):
    code: str

@router.post("/validate", response_model=dict)
def validate_coupon(
    request: ValidateCouponRequest,
    db: Session = Depends(get_db),
):
    """验证优惠券码是否有效，有效则返回优惠信息"""
    code = request.code
    if not code:
        raise HTTPException(status_code=400, detail="请提供优惠券码")

    from datetime import datetime
    now = datetime.now()
    coupon = db.query(Coupon).filter(
        Coupon.code == code.strip().upper(),
        Coupon.active == True,
    ).first()

    if not coupon:
        raise HTTPException(status_code=404, detail="优惠券不存在或已失效")

    if coupon.expires_at and coupon.expires_at <= now:
        raise HTTPException(status_code=400, detail="优惠券已过期")

    return {
        "valid": True,
        "code": coupon.code,
        "discount_type": coupon.discount_type,
        "discount_value": coupon.discount_value,
        "min_amount": coupon.min_amount,
        "message": "优惠券可用"
    }


@router.get("", response_model=dict)
def get_coupons(
    page: int = 1,
    page_size: int = 20,
    search: str = "",
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_admin)
):
    query = db.query(Coupon)

    if search:
        query = query.filter(Coupon.code.contains(search))

    total = query.count()
    coupons = query.order_by(Coupon.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return {
        "items": [CouponResponse.model_validate(c).model_dump() for c in coupons],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": (total + page_size - 1) // page_size
    }


@router.post("", response_model=dict)
def create_coupon(
    data: CouponCreate,
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_admin)
):
    existing = db.query(Coupon).filter(Coupon.code == data.code.upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Coupon code already exists")

    coupon = Coupon(
        code=data.code.upper(),
        discount_type=data.discount_type,
        discount_value=data.discount_value,
        min_amount=data.min_amount,
        max_uses=data.max_uses,
        expires_at=data.expires_at
    )
    db.add(coupon)
    db.commit()
    db.refresh(coupon)
    return CouponResponse.model_validate(coupon).model_dump()


@router.put("/{coupon_id}", response_model=dict)
def update_coupon(
    coupon_id: int,
    data: CouponUpdate,
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_admin)
):
    coupon = db.query(Coupon).filter(Coupon.id == coupon_id).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        if value is not None and key != "code":
            setattr(coupon, key, value)

    db.commit()
    db.refresh(coupon)
    return CouponResponse.model_validate(coupon).model_dump()


@router.delete("/{coupon_id}")
def delete_coupon(
    coupon_id: int,
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_admin)
):
    coupon = db.query(Coupon).filter(Coupon.id == coupon_id).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")

    db.delete(coupon)
    db.commit()
    return {"success": True}
