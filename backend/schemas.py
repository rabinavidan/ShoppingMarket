from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List, Any
from datetime import datetime


class CategoryOut(BaseModel):
    id: int
    name: str
    slug: str
    description: str

    model_config = {"from_attributes": True}


class ProductCreate(BaseModel):
    name: str
    slug: str
    description: str = ""
    price: float
    original_price: Optional[float] = None
    stock: int = 0
    category_id: Optional[int] = None
    image_url: str = ""
    sku: str
    is_featured: bool = False


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    original_price: Optional[float] = None
    stock: Optional[int] = None
    category_id: Optional[int] = None
    image_url: Optional[str] = None
    is_featured: Optional[bool] = None


class ProductOut(BaseModel):
    id: int
    name: str
    slug: str
    description: str
    price: float
    original_price: Optional[float]
    stock: int
    category_id: Optional[int]
    image_url: str
    sku: str
    is_featured: bool
    created_at: datetime
    category: Optional[CategoryOut] = None

    model_config = {"from_attributes": True}


class CartItemOut(BaseModel):
    id: int
    product_id: int
    quantity: int
    product: Optional[ProductOut] = None

    model_config = {"from_attributes": True}


class CartOut(BaseModel):
    session_id: str
    items: List[CartItemOut]
    subtotal: float
    item_count: int

    model_config = {"from_attributes": True}


class OrderItemOut(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: float
    product: Optional[ProductOut] = None

    model_config = {"from_attributes": True}


class OrderCreate(BaseModel):
    session_id: str
    shipping_address: dict
    payment_method: str = "card"
    notes: str = ""
    coupon_code: Optional[str] = None
    user_id: Optional[int] = None


class OrderOut(BaseModel):
    id: int
    user_id: Optional[int]
    session_id: Optional[str]
    status: str
    total_amount: float
    shipping_address: Any
    payment_method: str
    created_at: datetime
    notes: str
    items: List[OrderItemOut] = []

    model_config = {"from_attributes": True}


class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    first_name: str = ""
    last_name: str = ""
    phone: str = ""
    bio: str = ""


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    first_name: str
    last_name: str
    phone: str
    bio: str
    avatar_url: str
    created_at: datetime
    is_active: bool

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None


class ReviewCreate(BaseModel):
    reviewer_name: str
    rating: int
    body: str = ""
    user_id: Optional[int] = None


class ReviewOut(BaseModel):
    id: int
    product_id: int
    user_id: Optional[int]
    reviewer_name: str
    rating: int
    body: str
    created_at: datetime

    model_config = {"from_attributes": True}


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class CouponValidate(BaseModel):
    code: str


class CouponResult(BaseModel):
    valid: bool
    code: str
    discount_type: str = ""
    discount_value: float = 0.0
    message: str = ""


class WishlistOut(BaseModel):
    id: int
    user_id: int
    product_id: int
    product: Optional[ProductOut] = None

    model_config = {"from_attributes": True}
