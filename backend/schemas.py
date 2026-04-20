"""
Pydantic 模型 - 请求/响应 schema
"""
from pydantic import BaseModel, field_validator, model_validator
from typing import Optional, List
from datetime import datetime


# ============ Auth ============
class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str
    user: dict


class UserInfo(BaseModel):
    id: int
    username: str
    role: str


# ============ 订单 ============
class OrderItem(BaseModel):
    productId: int
    name: str
    price: float
    quantity: int
    flowers: int


class OrderCreate(BaseModel):
    user_id: Optional[int] = None
    user_name: Optional[str] = None
    total: float
    status: str = "pending"
    items: List[dict]
    address: str
    phone: str
    note: Optional[str] = None
    coupon_code: Optional[str] = None
    discount: float = 0
    time_slot: Optional[str] = None
    pay_method: Optional[str] = None


class OrderUpdate(BaseModel):
    status: Optional[str] = None
    note: Optional[str] = None
    shipped_image: Optional[str] = None
    shipped_link: Optional[str] = None
    delivered_image: Optional[str] = None
    cancel_reason: Optional[str] = None
    refund_amount: Optional[float] = None
    refund_status: Optional[str] = None


class OrderResponse(BaseModel):
    id: int
    order_no: str
    user_id: Optional[int]
    user_name: Optional[str]
    total: float
    status: str
    items: List[dict]
    address: str
    phone: str
    note: Optional[str]
    coupon_code: Optional[str]
    discount: float = 0
    time_slot: Optional[str] = None
    pay_method: Optional[str] = None
    shipped_image: Optional[str] = None
    shipped_link: Optional[str] = None
    delivered_image: Optional[str] = None
    cancel_reason: Optional[str] = None
    refund_amount: float = 0
    refund_status: str = "none"
    cancelled_at: Optional[datetime] = None
    refunded_at: Optional[datetime] = None
    user_email: Optional[str] = None
    user_line_token: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ============ 预约 ============


# ============ 商品 ============
class ProductCreate(BaseModel):
    name: str
    name_th: Optional[str] = None
    name_en: Optional[str] = None
    description: Optional[str] = None
    description_th: Optional[str] = None
    description_en: Optional[str] = None
    price: float
    original_price: Optional[float] = None
    images: Optional[List[str]] = None
    stock: int = 0
    stock_threshold: int = 10
    notify_low_stock: bool = True
    category: str = "bouquet"
    tags: Optional[List[str]] = None
    flower_options: Optional[List[dict]] = None  # [{"count": 11, "price": 299}, {"count": 52, "price": 999}]
    language: str = "all"
    active: bool = True

    @field_validator('flower_options', 'images', 'tags', mode='before')
    @classmethod
    def empty_list(cls, v):
        if v is None:
            return []
        return v


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    name_th: Optional[str] = None
    name_en: Optional[str] = None
    description: Optional[str] = None
    description_th: Optional[str] = None
    description_en: Optional[str] = None
    price: Optional[float] = None
    original_price: Optional[float] = None
    images: Optional[List[str]] = None
    stock: Optional[int] = None
    stock_threshold: Optional[int] = None
    notify_low_stock: Optional[bool] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    flower_options: Optional[List[dict]] = None
    language: Optional[str] = None
    active: Optional[bool] = None


class ProductResponse(BaseModel):
    id: int
    name: str
    name_th: Optional[str]
    name_en: Optional[str]
    description: Optional[str]
    price: float
    original_price: Optional[float]
    images: Optional[List[str]]
    stock: int
    stock_threshold: int
    notify_low_stock: bool
    category: str
    tags: Optional[List[str]]
    flower_options: Optional[List[dict]]
    language: str
    active: bool
    created_at: datetime

    class Config:
        from_attributes = True

    @field_validator('flower_options', 'images', 'tags', mode='before')
    @classmethod
    def empty_list(cls, v):
        if v is None:
            return []
        return v


# ============ 用户 ============
class UserRegister(BaseModel):
    name: str
    email: str
    phone: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    line_token: Optional[str] = None
    email_notifications: Optional[bool] = None
    line_notifications: Optional[bool] = None
    avatar: Optional[str] = None


class ChangePassword(BaseModel):
    old_password: str
    new_password: str


class UserResponse(BaseModel):
    id: int
    email: Optional[str]
    phone: Optional[str]
    name: Optional[str]
    level: str = "normal"
    points: int = 0
    total_spent: float = 0
    line_notifications: bool = False
    email_notifications: bool = True
    avatar: str = "👤"
    created_at: datetime

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    token: str
    user: UserResponse


# ============ 预约 ============
class AppointmentCreate(BaseModel):
    customer_name: str
    customer_phone: str
    occasion: str
    budget: str
    delivery_date: Optional[str] = None
    delivery_time: Optional[str] = None
    recipient_name: Optional[str] = None
    recipient_phone: Optional[str] = None
    delivery_address: Optional[str] = None
    reference_images: Optional[List[str]] = []
    requirements: Optional[str] = None
    blessing_card: Optional[str] = None
    packaging: Optional[str] = None
    callback_time: Optional[str] = None


class AppointmentUpdate(BaseModel):
    status: Optional[str] = None
    note: Optional[str] = None
    packaging: Optional[str] = None
    callback_time: Optional[str] = None


class AppointmentResponse(BaseModel):
    id: int
    appointment_no: str
    customer_name: str
    customer_phone: str
    occasion: str
    budget: str
    delivery_date: Optional[str]
    delivery_time: Optional[str]
    recipient_name: Optional[str]
    recipient_phone: Optional[str]
    delivery_address: Optional[str]
    reference_images: Optional[List[str]] = []
    requirements: Optional[str]
    blessing_card: Optional[str]
    packaging: Optional[str]
    callback_time: Optional[str]
    status: str
    note: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ============ 联系 ============
class ContactCreate(BaseModel):
    name: str
    phone: str
    message: str


class ContactUpdate(BaseModel):
    status: Optional[str] = None
    reply: Optional[str] = None


class ContactResponse(BaseModel):
    id: int
    name: str
    phone: str
    message: str
    status: str
    reply: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ============ 统计 ============
class StatsResponse(BaseModel):
    todayOrders: int
    todaySales: float
    totalOrders: int
    totalSales: float
    totalProducts: int
    totalUsers: int
    pendingOrders: int
    pendingAppointments: int
    pendingContacts: int


# ============ 优惠券 ============
class CouponCreate(BaseModel):
    code: str
    discount_type: str = "percent"
    discount_value: float
    min_amount: float = 0
    max_uses: int = 0
    expires_at: Optional[str] = None


class CouponUpdate(BaseModel):
    code: Optional[str] = None
    discount_type: Optional[str] = None
    discount_value: Optional[float] = None
    min_amount: Optional[float] = None
    max_uses: Optional[int] = None
    active: Optional[bool] = None
    expires_at: Optional[str] = None


class CouponResponse(BaseModel):
    id: int
    code: str
    discount_type: str
    discount_value: float
    min_amount: float
    max_uses: int
    used_count: int
    active: bool
    expires_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


# ============ 配送员 ============
class DeliveryPersonCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    avatar: Optional[str] = None
    status: str = "available"


class DeliveryPersonUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    avatar: Optional[str] = None
    status: Optional[str] = None


class DeliveryPersonResponse(BaseModel):
    id: int
    name: str
    phone: Optional[str]
    avatar: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ============ 商品评价 ============
class ReviewCreate(BaseModel):
    product_id: int
    rating: int  # 1-5
    comment: Optional[str] = None
    images: Optional[List[str]] = []


class ReviewUpdate(BaseModel):
    rating: Optional[int] = None
    comment: Optional[str] = None
    images: Optional[List[str]] = None
    active: Optional[bool] = None


class ReviewResponse(BaseModel):
    id: int
    product_id: int
    user_id: int
    order_id: Optional[int]
    rating: int
    comment: Optional[str]
    images: List[str]
    is_verified: bool
    active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ============ 操作日志 ============
class AdminLogResponse(BaseModel):
    id: int
    admin_id: Optional[int]
    admin_name: Optional[str]
    action: str
    target_type: str
    target_id: Optional[int]
    detail: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ============ 通知渠道 ============
class NotificationChannelCreate(BaseModel):
    type: str  # 'email' or 'line'
    value: str  # 邮箱地址或LINE Notify Token
    name: Optional[str] = None  # 渠道别名


class NotificationChannelUpdate(BaseModel):
    type: Optional[str] = None
    value: Optional[str] = None
    name: Optional[str] = None
    enabled: Optional[bool] = None


class NotificationChannelResponse(BaseModel):
    id: int
    type: str
    value: str  # 邮箱时返回脱敏值
    name: Optional[str]
    enabled: bool
    created_at: datetime

    class Config:
        from_attributes = True
