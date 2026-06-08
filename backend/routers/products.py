from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import Optional, List
from database import get_db
from models import Product, Review
from schemas import ProductOut, ProductCreate, ProductUpdate, ReviewCreate, ReviewOut

router = APIRouter(prefix="/api/products", tags=["products"])


@router.get("")
def list_products(
    q: Optional[str] = None,
    category_id: Optional[int] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort: Optional[str] = "newest",
    page: int = 1,
    per_page: int = 12,
    db: Session = Depends(get_db),
):
    query = db.query(Product)
    if q:
        query = query.filter(
            or_(Product.name.ilike(f"%{q}%"), Product.description.ilike(f"%{q}%"))
        )
    if category_id:
        query = query.filter(Product.category_id == category_id)
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)

    if sort == "price_asc":
        query = query.order_by(Product.price.asc())
    elif sort == "price_desc":
        query = query.order_by(Product.price.desc())
    elif sort == "newest":
        query = query.order_by(Product.created_at.desc())
    else:
        query = query.order_by(Product.created_at.desc())

    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()
    pages = (total + per_page - 1) // per_page

    return {"data": [ProductOut.model_validate(p) for p in items], "total": total, "page": page, "per_page": per_page, "pages": pages}


@router.get("/featured")
def featured_products(db: Session = Depends(get_db)):
    products = db.query(Product).filter(Product.is_featured == True).all()
    return [ProductOut.model_validate(p) for p in products]


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return p


@router.post("", response_model=ProductOut)
def create_product(data: ProductCreate, db: Session = Depends(get_db)):
    p = Product(**data.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


@router.put("/{product_id}", response_model=ProductOut)
def update_product(product_id: int, data: ProductUpdate, db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return p


@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(p)
    db.commit()
    return {"ok": True}


@router.get("/{product_id}/reviews", response_model=List[ReviewOut])
def get_reviews(product_id: int, db: Session = Depends(get_db)):
    return db.query(Review).filter(Review.product_id == product_id).all()


@router.post("/{product_id}/reviews", response_model=ReviewOut)
def create_review(product_id: int, data: ReviewCreate, db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    r = Review(product_id=product_id, **data.model_dump())
    db.add(r)
    db.commit()
    db.refresh(r)
    return r
