from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import CartSession, CartItem, Product
from schemas import CartOut, CartItemOut

router = APIRouter(prefix="/api/cart", tags=["cart"])


def _cart_response(cart: CartSession):
    items = []
    subtotal = 0.0
    item_count = 0
    for ci in cart.items:
        items.append(CartItemOut.model_validate(ci))
        subtotal += ci.product.price * ci.quantity
        item_count += ci.quantity
    return {"session_id": cart.session_id, "items": items, "subtotal": round(subtotal, 2), "item_count": item_count}


def _get_or_create_cart(session_id: str, db: Session) -> CartSession:
    cart = db.query(CartSession).filter(CartSession.session_id == session_id).first()
    if not cart:
        cart = CartSession(session_id=session_id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
    return cart


@router.get("/{session_id}")
def get_cart(session_id: str, db: Session = Depends(get_db)):
    cart = _get_or_create_cart(session_id, db)
    return _cart_response(cart)


@router.post("/{session_id}/items")
def add_item(session_id: str, body: dict, db: Session = Depends(get_db)):
    product_id = body.get("product_id")
    quantity = body.get("quantity", 1)
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    cart = _get_or_create_cart(session_id, db)
    existing = db.query(CartItem).filter(
        CartItem.cart_session_id == cart.id,
        CartItem.product_id == product_id
    ).first()
    if existing:
        existing.quantity += quantity
    else:
        item = CartItem(cart_session_id=cart.id, product_id=product_id, quantity=quantity)
        db.add(item)
    db.commit()
    db.refresh(cart)
    return _cart_response(cart)


@router.put("/{session_id}/items/{item_id}")
def update_item(session_id: str, item_id: int, body: dict, db: Session = Depends(get_db)):
    cart = db.query(CartSession).filter(CartSession.session_id == session_id).first()
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    item = db.query(CartItem).filter(CartItem.id == item_id, CartItem.cart_session_id == cart.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    quantity = body.get("quantity", 1)
    if quantity <= 0:
        db.delete(item)
    else:
        item.quantity = quantity
    db.commit()
    db.refresh(cart)
    return _cart_response(cart)


@router.delete("/{session_id}/items/{item_id}")
def remove_item(session_id: str, item_id: int, db: Session = Depends(get_db)):
    cart = db.query(CartSession).filter(CartSession.session_id == session_id).first()
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    item = db.query(CartItem).filter(CartItem.id == item_id, CartItem.cart_session_id == cart.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
    db.refresh(cart)
    return _cart_response(cart)


@router.delete("/{session_id}")
def clear_cart(session_id: str, db: Session = Depends(get_db)):
    cart = db.query(CartSession).filter(CartSession.session_id == session_id).first()
    if cart:
        for item in cart.items:
            db.delete(item)
        db.commit()
        db.refresh(cart)
    return {"session_id": session_id, "items": [], "subtotal": 0.0, "item_count": 0}
