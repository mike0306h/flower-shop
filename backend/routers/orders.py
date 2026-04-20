"""
订单路由
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional, List
from database import get_db
from models import Order, User
from schemas import OrderCreate, OrderUpdate, OrderResponse
from datetime import datetime
from services.notification import send_order_notification
from auth import get_current_admin

router = APIRouter()

# 状态流转规则：key=当前状态，value=允许的目标状态列表
VALID_STATUS_TRANSITIONS = {
    "pending":     ["confirmed", "cancelled"],
    "confirmed":   ["in_progress", "preparing", "cancelled"],
    "in_progress": ["preparing", "shipped"],
    "preparing":   ["shipped"],
    "shipped":     ["delivered"],
    "delivered":   [],
    "cancelled":   [],
}


def is_valid_status_transition(current: str, new: str) -> bool:
    """检查状态流转是否合法"""
    if current == new:
        return True
    allowed = VALID_STATUS_TRANSITIONS.get(current, [])
    return new in allowed


def generate_order_no():
    return f"FX{datetime.now().strftime('%Y%m%d')}{datetime.now().strftime('%H%M%S')}"


def order_to_response(order: Order, user: User = None) -> dict:
    """将订单转换为响应格式，包含用户通知信息"""
    data = OrderResponse.model_validate(order).model_dump()
    if user:
        data["user_email"] = user.email
        data["user_line_token"] = user.line_token
    return data


@router.get("")
def get_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Order)

    if status:
        query = query.filter(Order.status == status)

    if search:
        query = query.filter(
            (Order.order_no.contains(search)) |
            (Order.user_name.contains(search)) |
            (Order.phone.contains(search))
        )

    total = query.count()
    orders = query.order_by(desc(Order.created_at)).offset((page - 1) * page_size).limit(page_size).all()

    # 获取用户信息
    items = []
    for order in orders:
        user = None
        if order.user_id:
            user = db.query(User).filter(User.id == order.user_id).first()
        items.append(order_to_response(order, user))

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": (total + page_size - 1) // page_size
    }


@router.get("/{order_id}")
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")

    user = None
    if order.user_id:
        user = db.query(User).filter(User.id == order.user_id).first()

    return order_to_response(order, user)


@router.post("")
def create_order(
    order_data: OrderCreate,
    db: Session = Depends(get_db),
    authorization: str = Header(None)
):
    """创建订单"""
    user = None
    user_email = None
    user_line_token = None

    # 如果有用户 token（非管理员），获取用户信息
    if authorization and authorization.startswith("Bearer "):
        from auth import decode_token
        token = authorization.replace("Bearer ", "")
        payload = decode_token(token)
        if payload and payload.get("type") == "user" and payload.get("role") != "admin":
            user_id_str = payload.get("sub")
            if user_id_str and user_id_str.isdigit():
                user_id = int(user_id_str)
                user = db.query(User).filter(User.id == user_id).first()
                if user:
                    user_email = user.email
                    user_line_token = user.line_token

    order = Order(
        order_no=generate_order_no(),
        user_id=user.id if user else order_data.user_id,
        user_name=order_data.user_name,
        total=order_data.total,
        status=order_data.status,
        items=order_data.items,
        address=order_data.address,
        phone=order_data.phone,
        note=order_data.note,
        coupon_code=order_data.coupon_code,
        discount=order_data.discount,
        time_slot=order_data.time_slot,
        pay_method=order_data.pay_method
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    # 更新用户积分和等级
    if user and order_data.total > 0:
        # 每消费 1 ฿ = 1 积分
        points_earned = int(order_data.total)
        user.points += points_earned
        user.total_spent += order_data.total

        # 检查是否升级
        new_level = calculate_level(user.total_spent)
        if new_level != user.level:
            user.level = new_level

        db.commit()

    # 发送订单确认通知（发给管理员）
    order_response = order_to_response(order, user)
    try:
        send_order_notification(db, order_response, "zh")
    except Exception:
        pass

    return order_response


@router.patch("/{order_id}")
def update_order(
    order_id: int,
    update_data: OrderUpdate,
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_admin),
):
    """更新订单状态"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")

    old_status = order.status

    if update_data.status:
        # 校验状态流转是否合法
        if not is_valid_status_transition(old_status, update_data.status):
            raise HTTPException(
                status_code=400,
                detail=f"不允许从「{old_status}」修改为「{update_data.status}」"
            )
        order.status = update_data.status
        # 取消订单时记录时间
        if update_data.status == "cancelled":
            order.cancelled_at = datetime.now()
    if update_data.note is not None:
        order.note = update_data.note
    if update_data.shipped_image is not None:
        order.shipped_image = update_data.shipped_image
    if update_data.shipped_link is not None:
        order.shipped_link = update_data.shipped_link
    if update_data.delivered_image is not None:
        order.delivered_image = update_data.delivered_image
    # 退款相关
    if update_data.cancel_reason is not None:
        order.cancel_reason = update_data.cancel_reason
    if update_data.refund_amount is not None:
        order.refund_amount = update_data.refund_amount
    if update_data.refund_status is not None:
        order.refund_status = update_data.refund_status
        if update_data.refund_status == "approved":
            order.refunded_at = datetime.now()

    db.commit()
    db.refresh(order)

    # 获取用户信息用于发送通知
    user = None
    if order.user_id:
        user = db.query(User).filter(User.id == order.user_id).first()

    # 如果状态发生变化，发送通知（发给管理员）
    if old_status != order.status:
        order_response = order_to_response(order, user)
        try:
            send_order_notification(db, order_response, "zh")
        except Exception:
            pass

    # 始终返回订单响应
    order_response = order_to_response(order, user)
    return order_response


@router.delete("/{order_id}")
def delete_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")

    db.delete(order)
    db.commit()
    return {"message": "订单已删除"}


def calculate_level(total_spent: float) -> str:
    """根据累计消费计算会员等级"""
    if total_spent >= 50000:
        return "diamond"
    elif total_spent >= 20000:
        return "gold"
    elif total_spent >= 5000:
        return "silver"
    return "normal"
