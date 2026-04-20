"""
通知渠道管理 + 通知发送
支持多邮箱 + 多LINE账号
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional
from pydantic import BaseModel
import httpx
from loguru import logger

from database import get_db
from models import NotificationChannel
from schemas import NotificationChannelCreate, NotificationChannelUpdate, NotificationChannelResponse
from auth import get_current_admin

router = APIRouter()


# ============ 辅助函数 ============

def mask_email(email: str) -> str:
    """邮箱脱敏"""
    if not email or "@" not in email:
        return email
    local, domain = email.split("@", 1)
    if len(local) <= 2:
        return local[0] + "*@..." + domain
    return local[0] + "*" * (len(local) - 2) + local[-1] + "@" + domain


def mask_line_token(token: str) -> str:
    """LINE Token 脱敏"""
    if not token or len(token) < 8:
        return "***"
    return "***" + token[-4:]


# ============ 渠道管理 API ============

@router.get("/channels", response_model=dict)
def get_channels(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    type_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_admin)
):
    """获取通知渠道列表"""
    query = db.query(NotificationChannel)

    if type_filter:
        query = query.filter(NotificationChannel.type == type_filter)

    total = query.count()
    channels = query.order_by(desc(NotificationChannel.created_at)).offset((page - 1) * page_size).limit(page_size).all()

    items = []
    for ch in channels:
        # 脱敏用于表格显示
        if ch.type == "email":
            display_value = mask_email(ch.value)
        else:
            display_value = mask_line_token(ch.value)

        items.append({
            "id": ch.id,
            "type": ch.type,
            "value": ch.value,  # 真实值供编辑使用
            "value_display": display_value,  # 脱敏值供表格显示
            "name": ch.name,
            "enabled": ch.enabled,
            "created_at": ch.created_at
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": (total + page_size - 1) // page_size if total > 0 else 0
    }


@router.post("/channels", response_model=dict)
def create_channel(
    data: NotificationChannelCreate,
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_admin)
):
    """创建通知渠道"""
    # 验证类型
    if data.type not in ("email", "line"):
        raise HTTPException(status_code=400, detail="类型必须是 email 或 line")

    # 验证邮箱格式
    if data.type == "email" and "@" not in data.value:
        raise HTTPException(status_code=400, detail="请输入有效的邮箱地址")

    # 验证 LINE Token 格式（非空）
    if data.type == "line" and len(data.value) < 10:
        raise HTTPException(status_code=400, detail="LINE Token 无效")

    # 检查重复
    existing = db.query(NotificationChannel).filter(
        NotificationChannel.type == data.type,
        NotificationChannel.value == data.value
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="该渠道已存在")

    channel = NotificationChannel(
        type=data.type,
        value=data.value,
        name=data.name
    )
    db.add(channel)
    db.commit()
    db.refresh(channel)

    return {
        "id": channel.id,
        "type": channel.type,
        "value": mask_email(channel.value) if channel.type == "email" else mask_line_token(channel.value),
        "name": channel.name,
        "enabled": channel.enabled,
        "created_at": channel.created_at
    }


@router.patch("/channels/{channel_id}", response_model=dict)
def update_channel(
    channel_id: int,
    data: NotificationChannelUpdate,
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_admin)
):
    """更新通知渠道"""
    channel = db.query(NotificationChannel).filter(NotificationChannel.id == channel_id).first()
    if not channel:
        raise HTTPException(status_code=404, detail="渠道不存在")

    if data.type is not None:
        if data.type not in ("email", "line"):
            raise HTTPException(status_code=400, detail="类型必须是 email 或 line")
        channel.type = data.type

    if data.value is not None:
        if channel.type == "email" and "@" not in data.value:
            raise HTTPException(status_code=400, detail="请输入有效的邮箱地址")
        if channel.type == "line" and len(data.value) < 10:
            raise HTTPException(status_code=400, detail="LINE Token 无效")
        channel.value = data.value

    if data.name is not None:
        channel.name = data.name

    if data.enabled is not None:
        channel.enabled = data.enabled

    db.commit()
    db.refresh(channel)

    return {
        "id": channel.id,
        "type": channel.type,
        "value": mask_email(channel.value) if channel.type == "email" else mask_line_token(channel.value),
        "name": channel.name,
        "enabled": channel.enabled,
        "created_at": channel.created_at
    }


@router.delete("/channels/{channel_id}")
def delete_channel(
    channel_id: int,
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_admin)
):
    """删除通知渠道"""
    channel = db.query(NotificationChannel).filter(NotificationChannel.id == channel_id).first()
    if not channel:
        raise HTTPException(status_code=404, detail="渠道不存在")

    db.delete(channel)
    db.commit()
    return {"success": True}


# ============ 渠道测试 API ============

class TestChannelRequest(BaseModel):
    channel_id: int
    test_message: Optional[str] = None


@router.post("/channels/test")
def test_channel(
    data: TestChannelRequest,
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_admin)
):
    """测试单个通知渠道"""
    channel = db.query(NotificationChannel).filter(NotificationChannel.id == data.channel_id).first()
    if not channel:
        raise HTTPException(status_code=404, detail="渠道不存在")

    import os
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart
    import smtplib

    test_msg = data.test_message or "🧪 这是一条测试消息\n来自遇见花语管理系统\n时间: " + __import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    if channel.type == "email":
        SMTP_HOST = os.getenv("SMTP_HOST", "")
        SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
        SMTP_USER = os.getenv("SMTP_USER", "")
        SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
        FROM_EMAIL = os.getenv("FROM_EMAIL", SMTP_USER)

        if not SMTP_HOST or not SMTP_USER:
            return {"success": False, "error": "Email 未配置（请设置 SMTP_HOST, SMTP_USER, SMTP_PASSWORD 环境变量）"}

        try:
            msg = MIMEMultipart()
            msg['From'] = FROM_EMAIL
            msg['To'] = channel.value
            msg['Subject'] = "🌸 遇见花语 - 通知测试"

            html = f"""
            <html><body style="font-family: Arial; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #f5af7b, #f8c6c6); padding: 20px; border-radius: 10px; text-align: center;">
                    <h1 style="color: white; margin: 0;">🌸 遇见花语</h1>
                </div>
                <div style="padding: 20px; background: #fff;">
                    <pre style="line-height: 1.8;">{test_msg}</pre>
                </div>
            </body></html>
            """
            msg.attach(MIMEText(html, 'html'))

            with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
                server.starttls()
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.send_message(msg)

            return {"success": True, "message": f"测试邮件已发送到 {mask_email(channel.value)}"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    elif channel.type == "line":
        LINE_NOTIFY_TOKEN = os.getenv("LINE_NOTIFY_TOKEN", "")
        # 注意：LINE Notify 是通用推送，不区分 target
        try:
            response = httpx.post(
                "https://notify-api.line.me/api/notify",
                headers={"Authorization": f"Bearer {channel.value}"},
                data={"message": test_msg},
                timeout=10
            )
            if response.status_code == 200:
                return {"success": True, "message": "LINE Notify 发送成功"}
            else:
                return {"success": False, "error": response.text}
        except Exception as e:
            return {"success": False, "error": str(e)}

    return {"success": False, "error": "未知的渠道类型"}


# ============ 旧版设置 API（保留兼容）============

@router.get("/settings")
def get_notification_settings(
    current_admin: dict = Depends(get_current_admin)
):
    """获取通知设置（兼容旧版）"""
    import os
    LINE_CHANNEL_ACCESS_TOKEN = os.getenv("LINE_CHANNEL_ACCESS_TOKEN", "")

    return {
        "line_configured": bool(LINE_CHANNEL_ACCESS_TOKEN),
        "sms_configured": False,
        "line_token_preview": "***" + LINE_CHANNEL_ACCESS_TOKEN[-4:] if LINE_CHANNEL_ACCESS_TOKEN else None
    }


class NotificationSettingsUpdate(BaseModel):
    line_channel_access_token: Optional[str] = None


@router.put("/settings")
def update_notification_settings(
    data: NotificationSettingsUpdate,
    current_admin: dict = Depends(get_current_admin)
):
    """更新通知设置（兼容旧版）"""
    if data.line_channel_access_token:
        import os
        os.environ["LINE_CHANNEL_ACCESS_TOKEN"] = data.line_channel_access_token

    return {"message": "设置已更新"}
