from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Coupon
from schemas import CouponValidate, CouponResult

router = APIRouter(prefix="/api/coupons", tags=["coupons"])


@router.post("/validate", response_model=CouponResult)
def validate_coupon(data: CouponValidate, db: Session = Depends(get_db)):
    coupon = db.query(Coupon).filter(
        Coupon.code == data.code.upper(),
        Coupon.is_active == True
    ).first()
    if not coupon:
        return CouponResult(valid=False, code=data.code, message="Invalid or expired coupon code")
    return CouponResult(
        valid=True,
        code=coupon.code,
        discount_type=coupon.discount_type,
        discount_value=coupon.discount_value,
        message=coupon.description,
    )
