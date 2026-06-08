import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from database import engine, SessionLocal
import models
from auth import hash_password
from datetime import datetime

models.Base.metadata.create_all(bind=engine)

db = SessionLocal()

# Clear existing data
db.query(models.Review).delete()
db.query(models.Wishlist).delete()
db.query(models.OrderItem).delete()
db.query(models.Order).delete()
db.query(models.CartItem).delete()
db.query(models.CartSession).delete()
db.query(models.Coupon).delete()
db.query(models.Product).delete()
db.query(models.Category).delete()
db.query(models.User).delete()
db.commit()

# Categories
categories = [
    models.Category(name="Electronics", slug="electronics", description="Gadgets, devices and tech accessories"),
    models.Category(name="Clothing", slug="clothing", description="Fashion for men, women and kids"),
    models.Category(name="Food & Drinks", slug="food-drinks", description="Gourmet food and beverages"),
    models.Category(name="Books", slug="books", description="Books across all genres"),
    models.Category(name="Home & Garden", slug="home-garden", description="Everything for your home and garden"),
    models.Category(name="Jewelry & Diamonds", slug="jewelry-diamonds", description="Fine jewelry, diamonds, and luxury accessories"),
]
for c in categories:
    db.add(c)
db.commit()
for c in categories:
    db.refresh(c)

cat_map = {c.slug: c.id for c in categories}

# Products (4 per category)
products_data = [
    # Electronics
    {"name": "Wireless Headphones Pro", "slug": "wireless-headphones-pro", "description": "Premium noise-cancelling wireless headphones with 40hr battery life.", "price": 199.99, "original_price": 249.99, "stock": 50, "category_id": cat_map["electronics"], "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop", "sku": "ELEC-001", "is_featured": True},
    {"name": "Smart Watch Series X", "slug": "smart-watch-series-x", "description": "Advanced fitness tracking with GPS and heart rate monitor.", "price": 299.99, "original_price": 349.99, "stock": 30, "category_id": cat_map["electronics"], "image_url": "https://placehold.co/400x300?text=SmartWatch", "sku": "ELEC-002", "is_featured": True},
    {"name": "4K Webcam Ultra", "slug": "4k-webcam-ultra", "description": "4K resolution webcam with built-in microphone and ring light.", "price": 89.99, "original_price": None, "stock": 75, "category_id": cat_map["electronics"], "image_url": "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=400&h=300&fit=crop", "sku": "ELEC-003", "is_featured": False},
    {"name": "Mechanical Keyboard RGB", "slug": "mechanical-keyboard-rgb", "description": "Tactile mechanical switches with customizable RGB lighting.", "price": 129.99, "original_price": 159.99, "stock": 40, "category_id": cat_map["electronics"], "image_url": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=300&fit=crop", "sku": "ELEC-004", "is_featured": False},
    # Clothing
    {"name": "Classic Denim Jacket", "slug": "classic-denim-jacket", "description": "Timeless denim jacket suitable for all seasons.", "price": 79.99, "original_price": 99.99, "stock": 60, "category_id": cat_map["clothing"], "image_url": "https://placehold.co/400x300?text=DenimJacket", "sku": "CLTH-001", "is_featured": True},
    {"name": "Premium Cotton T-Shirt", "slug": "premium-cotton-tshirt", "description": "100% organic cotton t-shirt in 12 colours.", "price": 24.99, "original_price": None, "stock": 200, "category_id": cat_map["clothing"], "image_url": "https://placehold.co/400x300?text=TShirt", "sku": "CLTH-002", "is_featured": False},
    {"name": "Running Shoes Elite", "slug": "running-shoes-elite", "description": "Lightweight running shoes with advanced cushioning.", "price": 149.99, "original_price": 179.99, "stock": 45, "category_id": cat_map["clothing"], "image_url": "https://placehold.co/400x300?text=RunningShoes", "sku": "CLTH-003", "is_featured": True},
    {"name": "Woolen Scarf Luxe", "slug": "woolen-scarf-luxe", "description": "Extra-soft merino wool scarf, 180cm length.", "price": 34.99, "original_price": None, "stock": 80, "category_id": cat_map["clothing"], "image_url": "https://placehold.co/400x300?text=Scarf", "sku": "CLTH-004", "is_featured": False},
    # Food & Drinks
    {"name": "Organic Green Tea Set", "slug": "organic-green-tea-set", "description": "Premium Japanese green tea collection, 50 individually wrapped sachets.", "price": 29.99, "original_price": None, "stock": 100, "category_id": cat_map["food-drinks"], "image_url": "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop", "sku": "FOOD-001", "is_featured": False},
    {"name": "Artisan Coffee Blend", "slug": "artisan-coffee-blend", "description": "Single-origin Ethiopian coffee, medium roast, 500g.", "price": 19.99, "original_price": 24.99, "stock": 120, "category_id": cat_map["food-drinks"], "image_url": "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&h=300&fit=crop", "sku": "FOOD-002", "is_featured": True},
    {"name": "Gourmet Olive Oil", "slug": "gourmet-olive-oil", "description": "Cold-pressed extra virgin olive oil from Greek groves, 750ml.", "price": 14.99, "original_price": None, "stock": 90, "category_id": cat_map["food-drinks"], "image_url": "https://placehold.co/400x300?text=OliveOil", "sku": "FOOD-003", "is_featured": False},
    {"name": "Dark Chocolate Box", "slug": "dark-chocolate-box", "description": "Assorted 70% dark chocolates, 24-piece luxury gift box.", "price": 39.99, "original_price": 49.99, "stock": 55, "category_id": cat_map["food-drinks"], "image_url": "https://placehold.co/400x300?text=Chocolate", "sku": "FOOD-004", "is_featured": False},
    # Books
    {"name": "The Art of Clean Code", "slug": "art-of-clean-code", "description": "A comprehensive guide to writing maintainable and elegant software.", "price": 34.99, "original_price": None, "stock": 150, "category_id": cat_map["books"], "image_url": "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=300&fit=crop", "sku": "BOOK-001", "is_featured": True},
    {"name": "Deep Learning Fundamentals", "slug": "deep-learning-fundamentals", "description": "From neural networks to modern transformers, 600 pages.", "price": 59.99, "original_price": 74.99, "stock": 70, "category_id": cat_map["books"], "image_url": "https://placehold.co/400x300?text=DeepLearning", "sku": "BOOK-002", "is_featured": False},
    {"name": "Mystery at Midnight", "slug": "mystery-at-midnight", "description": "A gripping thriller novel set in 1920s Paris.", "price": 14.99, "original_price": None, "stock": 200, "category_id": cat_map["books"], "image_url": "https://placehold.co/400x300?text=MysteryBook", "sku": "BOOK-003", "is_featured": False},
    {"name": "World Atlas Deluxe", "slug": "world-atlas-deluxe", "description": "Full-colour 400-page world atlas with updated country statistics.", "price": 49.99, "original_price": 64.99, "stock": 35, "category_id": cat_map["books"], "image_url": "https://placehold.co/400x300?text=Atlas", "sku": "BOOK-004", "is_featured": False},
    # Home & Garden
    {"name": "Bamboo Cutting Board Set", "slug": "bamboo-cutting-board-set", "description": "Set of 3 eco-friendly bamboo cutting boards, different sizes.", "price": 39.99, "original_price": 49.99, "stock": 65, "category_id": cat_map["home-garden"], "image_url": "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=400&h=300&fit=crop", "sku": "HOME-001", "is_featured": False},
    {"name": "Indoor Plant Trio", "slug": "indoor-plant-trio", "description": "Three low-maintenance potted plants perfect for offices and homes.", "price": 59.99, "original_price": None, "stock": 25, "category_id": cat_map["home-garden"], "image_url": "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop", "sku": "HOME-002", "is_featured": True},
    {"name": "Smart LED Bulb Pack", "slug": "smart-led-bulb-pack", "description": "4-pack of WiFi-controlled colour-changing LED bulbs.", "price": 44.99, "original_price": 54.99, "stock": 80, "category_id": cat_map["home-garden"], "image_url": "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=400&h=300&fit=crop", "sku": "HOME-003", "is_featured": False},
    {"name": "Garden Tool Set Pro", "slug": "garden-tool-set-pro", "description": "8-piece stainless steel garden tool set with ergonomic handles.", "price": 79.99, "original_price": 99.99, "stock": 40, "category_id": cat_map["home-garden"], "image_url": "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop", "sku": "HOME-004", "is_featured": True},
    # Jewelry & Diamonds
    {"name": "Diamond Solitaire Ring", "slug": "diamond-solitaire-ring", "description": "1 carat round brilliant diamond in 18k white gold. GIA certified, VS1 clarity, G color.", "price": 2499.99, "original_price": 2999.99, "stock": 8, "category_id": cat_map["jewelry-diamonds"], "image_url": "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=300&fit=crop", "sku": "JWL-001", "is_featured": True},
    {"name": "Gold Pearl Necklace", "slug": "gold-pearl-necklace", "description": "Freshwater pearl strand with 18k gold clasp. 18-inch length, 8–9mm pearls.", "price": 349.99, "original_price": None, "stock": 20, "category_id": cat_map["jewelry-diamonds"], "image_url": "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=300&fit=crop", "sku": "JWL-002", "is_featured": True},
    {"name": "Diamond Tennis Bracelet", "slug": "diamond-tennis-bracelet", "description": "3 carat total weight diamond tennis bracelet in 14k white gold. 62 round brilliant diamonds.", "price": 1899.99, "original_price": 2299.99, "stock": 5, "category_id": cat_map["jewelry-diamonds"], "image_url": "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=300&fit=crop", "sku": "JWL-003", "is_featured": True},
    {"name": "Sapphire & Diamond Earrings", "slug": "sapphire-diamond-earrings", "description": "Natural blue sapphire drop earrings with diamond halo, set in 14k yellow gold.", "price": 799.99, "original_price": None, "stock": 12, "category_id": cat_map["jewelry-diamonds"], "image_url": "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=300&fit=crop", "sku": "JWL-004", "is_featured": False},
    {"name": "Men's Signet Ring", "slug": "mens-signet-ring", "description": "Classic solid 18k yellow gold signet ring. Engravable flat face, sizes 8–13.", "price": 599.99, "original_price": 699.99, "stock": 15, "category_id": cat_map["jewelry-diamonds"], "image_url": "https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=400&h=300&fit=crop", "sku": "JWL-005", "is_featured": False},
    {"name": "Diamond Pendant Necklace", "slug": "diamond-pendant-necklace", "description": "0.5 carat princess-cut diamond pendant in platinum with 18-inch chain.", "price": 999.99, "original_price": 1199.99, "stock": 10, "category_id": cat_map["jewelry-diamonds"], "image_url": "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=300&fit=crop", "sku": "JWL-006", "is_featured": True},
    {"name": "Ruby Cocktail Ring", "slug": "ruby-cocktail-ring", "description": "2.5 carat oval natural ruby with diamond side stones in 18k rose gold.", "price": 1299.99, "original_price": None, "stock": 6, "category_id": cat_map["jewelry-diamonds"], "image_url": "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=400&h=300&fit=crop", "sku": "JWL-007", "is_featured": False},
    {"name": "Gold Charm Bracelet", "slug": "gold-charm-bracelet", "description": "14k yellow gold link bracelet with 5 assorted charms. Lobster claw clasp, 7.5 inches.", "price": 449.99, "original_price": 499.99, "stock": 25, "category_id": cat_map["jewelry-diamonds"], "image_url": "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=400&h=300&fit=crop", "sku": "JWL-008", "is_featured": True},
]

products = []
for p in products_data:
    prod = models.Product(**p)
    db.add(prod)
    products.append(prod)
db.commit()
for p in products:
    db.refresh(p)

# Coupons
coupons = [
    models.Coupon(code="SAVE10", discount_type="percent", discount_value=10.0, description="Save 10% on your order", is_active=True),
    models.Coupon(code="SAVE20", discount_type="percent", discount_value=20.0, description="Save 20% on your order", is_active=True),
    models.Coupon(code="FREESHIP", discount_type="fixed", discount_value=9.99, description="Free shipping on your order", is_active=True),
]
for c in coupons:
    db.add(c)
db.commit()

# Users
users = [
    models.User(
        username="alice_shopper",
        email="alice@example.com",
        password_hash=hash_password("password123"),
        first_name="Alice",
        last_name="Johnson",
        phone="+1-555-0101",
        bio="Avid online shopper and tech enthusiast.",
        is_active=True,
    ),
    models.User(
        username="bob_buyer",
        email="bob@example.com",
        password_hash=hash_password("password123"),
        first_name="Bob",
        last_name="Smith",
        phone="+1-555-0202",
        bio="Looking for great deals on electronics.",
        is_active=True,
    ),
]
for u in users:
    db.add(u)
db.commit()
for u in users:
    db.refresh(u)

# Reviews (8 across products)
reviews_data = [
    {"product_id": products[0].id, "user_id": users[0].id, "reviewer_name": "Alice Johnson", "rating": 5, "body": "Absolutely love these headphones! Crystal clear sound and great noise cancellation."},
    {"product_id": products[0].id, "user_id": users[1].id, "reviewer_name": "Bob Smith", "rating": 4, "body": "Very comfortable for long sessions. Battery life is impressive."},
    {"product_id": products[1].id, "user_id": users[0].id, "reviewer_name": "Alice Johnson", "rating": 5, "body": "Best smartwatch I've ever owned. The GPS accuracy is spot on."},
    {"product_id": products[4].id, "user_id": users[1].id, "reviewer_name": "Bob Smith", "rating": 4, "body": "Great denim jacket, fits true to size. Very durable."},
    {"product_id": products[9].id, "user_id": users[0].id, "reviewer_name": "Alice Johnson", "rating": 5, "body": "Best coffee I've had outside of Ethiopia itself!"},
    {"product_id": products[12].id, "user_id": users[1].id, "reviewer_name": "Bob Smith", "rating": 5, "body": "This book changed the way I write code. Highly recommended."},
    {"product_id": products[16].id, "user_id": users[0].id, "reviewer_name": "Alice Johnson", "rating": 4, "body": "Good quality cutting boards. The bamboo is very sturdy."},
    {"product_id": products[19].id, "user_id": users[1].id, "reviewer_name": "Bob Smith", "rating": 5, "body": "Excellent garden tools! Ergonomic handles make weeding a breeze."},
]
for r in reviews_data:
    rev = models.Review(**r)
    db.add(rev)
db.commit()

db.close()
print("Seeded successfully")
