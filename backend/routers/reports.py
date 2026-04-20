"""
销售报表统计
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime, timedelta
from database import get_db
from models import Order, Product, User
from auth import get_current_admin

router = APIRouter()


@router.get("/sales-report")
def get_sales_report(
    period: str = Query("daily", regex="^(daily|weekly|monthly)$"),
    year: int = None,
    month: int = None,
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_admin)
):
    """
    销售报表
    - daily: 按日统计（最近30天）
    - weekly: 按周统计（最近12周）
    - monthly: 按月统计（最近12个月）
    """
    today = datetime.now().date()

    if period == "daily":
        # 最近30天按日统计
        start_date = today - timedelta(days=29)
        date_format = "%m-%d"
        group_by = func.date(Order.created_at)

    elif period == "weekly":
        # 最近12周按周统计
        start_date = today - timedelta(weeks=11)
        # 找到本周一
        start_date = start_date - timedelta(days=start_date.weekday())
        date_format = "%Y-W%W"
        group_by = func.date_trunc('week', Order.created_at)

    else:  # monthly
        # 最近12个月按月统计
        start_date = today.replace(day=1) - timedelta(days=365)
        date_format = "%Y-%m"
        group_by = func.date_trunc('month', Order.created_at)

    # 查询统计数据
    query = db.query(
        group_by.label('date'),
        func.count(Order.id).label('order_count'),
        func.sum(Order.total).label('total_sales'),
        func.avg(Order.total).label('avg_order_value')
    ).filter(
        Order.status.notin_(['cancelled', 'pending']),
        Order.created_at >= start_date
    ).group_by(group_by).order_by(group_by)

    results = query.all()

    # 格式化数据
    data = []
    for r in results:
        date_val = r.date
        if isinstance(date_val, datetime):
            date_str = date_val.strftime(date_format)
        else:
            date_str = str(date_val)[:10]

        data.append({
            "date": date_str,
            "orders": r.order_count or 0,
            "sales": float(r.total_sales or 0),
            "avg_value": float(r.avg_order_value or 0)
        })

    # 计算总计
    total_orders = sum(d["orders"] for d in data)
    total_sales = sum(d["sales"] for d in data)
    avg_order = total_sales / total_orders if total_orders > 0 else 0

    return {
        "period": period,
        "data": data,
        "summary": {
            "total_orders": total_orders,
            "total_sales": total_sales,
            "avg_order_value": round(avg_order, 2)
        }
    }


@router.get("/sales-by-category")
def get_sales_by_category(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_admin)
):
    """按商品分类统计销售额"""
    start_date = datetime.now() - timedelta(days=days)

    # 获取所有订单的商品
    orders = db.query(Order).filter(
        Order.status.notin_(['cancelled', 'pending']),
        Order.created_at >= start_date
    ).all()

    # 统计每个分类的销售额
    category_stats = {}
    for order in orders:
        for item in (order.items or []):
            category = item.get("category", "other")
            price = float(item.get("price", 0)) * int(item.get("quantity", 1))
            if category not in category_stats:
                category_stats[category] = {"count": 0, "sales": 0}
            category_stats[category]["count"] += int(item.get("quantity", 1))
            category_stats[category]["sales"] += price

    return {
        "days": days,
        "data": [
            {"category": k, "orders": v["count"], "sales": v["sales"]}
            for k, v in category_stats.items()
        ],
        "total": sum(v["sales"] for v in category_stats.values())
    }


@router.get("/top-products")
def get_top_products(
    days: int = Query(30, ge=1, le=365),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_admin)
):
    """热销商品排行"""
    start_date = datetime.now() - timedelta(days=days)

    orders = db.query(Order).filter(
        Order.status.notin_(['cancelled', 'pending']),
        Order.created_at >= start_date
    ).all()

    product_stats = {}
    for order in orders:
        for item in (order.items or []):
            product_id = item.get("id") or item.get("product_id")
            product_name = item.get("name", "未知商品")
            if product_id not in product_stats:
                product_stats[product_id] = {
                    "id": product_id,
                    "name": product_name,
                    "quantity": 0,
                    "sales": 0
                }
            qty = int(item.get("quantity", 1))
            price = float(item.get("price", 0))
            product_stats[product_id]["quantity"] += qty
            product_stats[product_id]["sales"] += price * qty

    # 排序并返回前N个
    sorted_products = sorted(
        product_stats.values(),
        key=lambda x: x["sales"],
        reverse=True
    )[:limit]

    return {
        "days": days,
        "data": sorted_products
    }


@router.get("/customer-stats")
def get_customer_stats(
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_admin)
):
    """客户统计（新客户、复购率等）"""
    today = datetime.now().date()
    month_start = today.replace(day=1)
    week_start = today - timedelta(days=today.weekday())

    # 本月新客户
    new_this_month = db.query(User).filter(
        User.created_at >= month_start
    ).count()

    # 本周新客户
    new_this_week = db.query(User).filter(
        User.created_at >= week_start
    ).count()

    # 总客户数
    total_customers = db.query(User).count()

    # 有过购买记录的客户（排除NULL）
    customers_with_orders = db.query(User.id).join(
        Order, User.id == Order.user_id
    ).filter(
        Order.status.notin_(['cancelled']),
        Order.user_id.isnot(None)
    ).distinct().count()

    # 复购率（有过2次以上购买的客户占比）
    repeat_customers = db.query(
        Order.user_id,
        func.count(Order.id).label('order_count')
    ).filter(
        Order.status.notin_(['cancelled']),
        Order.user_id.isnot(None)
    ).group_by(Order.user_id).having(
        func.count(Order.id) > 1
    ).count()

    repeat_rate = repeat_customers / customers_with_orders if customers_with_orders > 0 else 0

    return {
        "total_customers": total_customers,
        "new_this_month": new_this_month,
        "new_this_week": new_this_week,
        "customers_with_orders": customers_with_orders,
        "repeat_customers": repeat_customers,
        "repeat_rate": round(repeat_rate * 100, 1)  # 百分比
    }
