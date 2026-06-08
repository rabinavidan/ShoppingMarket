from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import User, Wishlist, Order, Product
from schemas import UserOut, UserUpdate, WishlistOut, OrderOut

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/{user_id}", response_model=UserOut)
def update_user(user_id: int, data: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(user, k, v)
    db.commit()
    db.refresh(user)
    return user


@router.get("/{user_id}/wishlist", response_model=List[WishlistOut])
def get_wishlist(user_id: int, db: Session = Depends(get_db)):
    return db.query(Wishlist).filter(Wishlist.user_id == user_id).all()


@router.post("/{user_id}/wishlist", response_model=WishlistOut)
def add_to_wishlist(user_id: int, body: dict, db: Session = Depends(get_db)):
    product_id = body.get("product_id")
    if not db.query(Product).filter(Product.id == product_id).first():
        raise HTTPException(status_code=404, detail="Product not found")
    existing = db.query(Wishlist).filter(Wishlist.user_id == user_id, Wishlist.product_id == product_id).first()
    if existing:
        return existing
    w = Wishlist(user_id=user_id, product_id=product_id)
    db.add(w)
    db.commit()
    db.refresh(w)
    return w


@router.delete("/{user_id}/wishlist/{product_id}")
def remove_from_wishlist(user_id: int, product_id: int, db: Session = Depends(get_db)):
    w = db.query(Wishlist).filter(Wishlist.user_id == user_id, Wishlist.product_id == product_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Not in wishlist")
    db.delete(w)
    db.commit()
    return {"ok": True}


@router.get("/{user_id}/orders", response_model=List[OrderOut])
def get_user_orders(user_id: int, db: Session = Depends(get_db)):
    return db.query(Order).filter(Order.user_id == user_id).order_by(Order.created_at.desc()).all()
