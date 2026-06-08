from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from database import get_db
from models import Order, OrderItem, CartSession, CartItem, Coupon
from schemas import OrderCreate, OrderOut

router = APIRouter(prefix="/api/orders", tags=["orders"])


@router.post("", response_model=OrderOut)
def create_order(data: OrderCreate, db: Session = Depends(get_db)):
    cart = db.query(CartSession).filter(CartSession.session_id == data.session_id).first()
    if not cart or not cart.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    subtotal = sum(ci.product.price * ci.quantity for ci in cart.items)
    discount = 0.0

    if data.coupon_code:
        coupon = db.query(Coupon).filter(
            Coupon.code == data.coupon_code.upper(),
            Coupon.is_active == True
        ).first()
        if coupon:
            if coupon.discount_type == "percent":
                discount = subtotal * coupon.discount_value / 100
            elif coupon.discount_type == "fixed":
                discount = coupon.discount_value

    total = max(subtotal - discount, 0.0)

    order = Order(
        user_id=data.user_id,
        session_id=data.session_id,
        status="pending",
        total_amount=round(total, 2),
        shipping_address=data.shipping_address,
        payment_method=data.payment_method,
        notes=data.notes,
    )
    db.add(order)
    db.flush()

    for ci in cart.items:
        oi = OrderItem(
            order_id=order.id,
            product_id=ci.product_id,
            quantity=ci.quantity,
            unit_price=ci.product.price,
        )
        db.add(oi)

    for ci in list(cart.items):
        db.delete(ci)

    db.commit()
    db.refresh(order)
    return order


@router.get("/{order_id}", response_model=OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.get("")
def list_orders(
    session_id: Optional[str] = None,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Order)
    if session_id:
        query = query.filter(Order.session_id == session_id)
    if user_id:
        query = query.filter(Order.user_id == user_id)
    orders = query.order_by(Order.created_at.desc()).all()
    return [OrderOut.model_validate(o) for o in orders]


@router.put("/{order_id}/status", response_model=OrderOut)
def update_status(order_id: int, body: dict, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = body.get("status", order.status)
    db.commit()
    db.refresh(order)
    return order
