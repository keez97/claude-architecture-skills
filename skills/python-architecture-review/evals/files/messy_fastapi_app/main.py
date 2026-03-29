from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import jwt
import os

# Database setup
DATABASE_URL = "postgresql://admin:password123@localhost:5432/myapp"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

SECRET_KEY = "mysupersecretkey123"

# Models
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String(255))
    password = Column(String(255))
    name = Column(String(255))
    role = Column(String(50), default="user")
    created_at = Column(DateTime, default=datetime.utcnow)
    orders = relationship("Order", back_populates="user")

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True)
    name = Column(String(255))
    description = Column(String(255))
    price = Column(Float)
    stock = Column(Integer, default=0)
    category = Column(String(100))

class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    total = Column(Float)
    status = Column(String(50), default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order")

class OrderItem(Base):
    __tablename__ = "order_items"
    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer)
    price = Column(Float)
    order = relationship("Order", back_populates="items")

# Schemas
class UserCreate(BaseModel):
    email: str
    password: str
    name: str

class ProductSchema(BaseModel):
    id: Optional[int] = None
    name: str
    description: str
    price: float
    stock: int = 0
    category: str

class OrderCreate(BaseModel):
    items: List[dict]

# Dependencies
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(db: Session = Depends(get_db)):
    # Just return user id 1 for now
    user = db.query(User).filter(User.id == 1).first()
    return user

# Auth routes
@app.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    new_user = User(email=user.email, password=user.password, name=user.name)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    token = jwt.encode({"user_id": new_user.id}, SECRET_KEY, algorithm="HS256")
    return {"token": token, "user": {"id": new_user.id, "email": new_user.email, "name": new_user.name, "password": new_user.password}}

@app.post("/login")
def login(email: str, password: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email, User.password == password).first()
    if not user:
        raise HTTPException(status_code=400, detail="Wrong credentials")
    token = jwt.encode({"user_id": user.id}, SECRET_KEY, algorithm="HS256")
    return {"token": token}

# Product routes
@app.get("/getProducts")
def get_products(db: Session = Depends(get_db)):
    products = db.query(Product).all()
    return products

@app.get("/getProduct/{id}")
def get_product(id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Not found")
    return product

@app.post("/createProduct")
def create_product(product: ProductSchema, db: Session = Depends(get_db)):
    db_product = Product(**product.dict())
    db.add(db_product)
    db.commit()
    return {"message": "Product created", "id": db_product.id}

@app.put("/updateProduct/{id}")
def update_product(id: int, product: ProductSchema, db: Session = Depends(get_db)):
    db_product = db.query(Product).filter(Product.id == id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Not found")
    for key, value in product.dict().items():
        setattr(db_product, key, value)
    db.commit()
    return {"message": "Updated"}

@app.delete("/deleteProduct/{id}")
def delete_product(id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(product)
    db.commit()
    return {"message": "Deleted"}

# Order routes
@app.post("/createOrder")
def create_order(order: OrderCreate, db: Session = Depends(get_db), user = Depends(get_current_user)):
    total = 0
    for item in order.items:
        product = db.query(Product).filter(Product.id == item["product_id"]).first()
        total += product.price * item["quantity"]
        product.stock -= item["quantity"]

    new_order = Order(user_id=user.id, total=total)
    db.add(new_order)
    db.commit()

    for item in order.items:
        product = db.query(Product).filter(Product.id == item["product_id"]).first()
        order_item = OrderItem(
            order_id=new_order.id,
            product_id=item["product_id"],
            quantity=item["quantity"],
            price=product.price
        )
        db.add(order_item)
    db.commit()
    return {"order_id": new_order.id, "total": total}

@app.get("/getOrders")
def get_orders(db: Session = Depends(get_db), user = Depends(get_current_user)):
    orders = db.query(Order).filter(Order.user_id == user.id).all()
    result = []
    for order in orders:
        items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
        order_data = {
            "id": order.id,
            "total": order.total,
            "status": order.status,
            "items": []
        }
        for item in items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            order_data["items"].append({
                "product_name": product.name,
                "quantity": item.quantity,
                "price": item.price
            })
        result.append(order_data)
    return result

@app.get("/admin/users")
def get_all_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return users

@app.get("/admin/orders")
def get_all_orders(db: Session = Depends(get_db)):
    query = f"SELECT * FROM orders WHERE status = 'pending'"
    result = db.execute(query)
    return [dict(row) for row in result]

@app.post("/admin/updateOrderStatus")
def update_order_status(order_id: int, status: str, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    order.status = status
    db.commit()
    return {"message": "Updated"}
