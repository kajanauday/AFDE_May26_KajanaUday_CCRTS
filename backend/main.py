"""
Customer Complaint & Resolution Tracking System – FastAPI Backend
Run: uvicorn main:app --reload --port 8000
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine, SessionLocal
from routers import auth, complaints, users, dashboard, feedback, categories, notifications
import models
from auth import hash_password


# ---------------------------------------------------------------------------
# Seed helpers
# ---------------------------------------------------------------------------

ROLES = ["admin", "support_agent", "supervisor", "customer", "quality_team"]

DEFAULT_CATEGORIES = [
    {"name": "Billing & Payments", "description": "Issues related to invoices, charges, and payment processing"},
    {"name": "Technical Support", "description": "Software, hardware, and connectivity issues"},
    {"name": "Delivery & Shipping", "description": "Order delivery delays or incorrect shipments"},
    {"name": "Product Quality", "description": "Defective or substandard products"},
    {"name": "Customer Service", "description": "Issues with service representatives or support quality"},
    {"name": "Account & Access", "description": "Login, account suspension, or access permission issues"},
    {"name": "Refunds & Returns", "description": "Return requests and refund processing"},
    {"name": "Other", "description": "Miscellaneous complaints that do not fit other categories"},
]

SEED_USERS = [
    {
        "name": "System Admin",
        "email": "admin@ccrts.com",
        "password": "admin123",
        "role": "admin",
        "phone": "+1-555-0100",
    },
    {
        "name": "Support Agent Alice",
        "email": "alice@ccrts.com",
        "password": "agent123",
        "role": "support_agent",
        "phone": "+1-555-0101",
    },
    {
        "name": "Supervisor Bob",
        "email": "bob@ccrts.com",
        "password": "super123",
        "role": "supervisor",
        "phone": "+1-555-0102",
    },
]


def seed_database():
    db = SessionLocal()
    try:
        # 1. Roles
        for role_name in ROLES:
            if not db.query(models.Role).filter(models.Role.name == role_name).first():
                db.add(models.Role(name=role_name))
        db.commit()

        # 2. Seed users
        for user_data in SEED_USERS:
            if not db.query(models.User).filter(models.User.email == user_data["email"]).first():
                role = db.query(models.Role).filter(models.Role.name == user_data["role"]).first()
                if role:
                    db.add(
                        models.User(
                            name=user_data["name"],
                            email=user_data["email"],
                            password_hash=hash_password(user_data["password"]),
                            phone=user_data.get("phone"),
                            role_id=role.id,
                        )
                    )
        db.commit()

        # 3. Categories
        for cat in DEFAULT_CATEGORIES:
            if not db.query(models.Category).filter(models.Category.name == cat["name"]).first():
                db.add(models.Category(name=cat["name"], description=cat["description"]))
        db.commit()

    finally:
        db.close()


# ---------------------------------------------------------------------------
# Lifespan: create tables + seed on startup
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    Base.metadata.create_all(bind=engine)
    seed_database()
    yield
    # Shutdown (nothing to do)


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Customer Complaint & Resolution Tracking System",
    description="CCRTS REST API – manage complaints, agents, and resolutions",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(categories.router)
app.include_router(complaints.router)
app.include_router(dashboard.router)
app.include_router(feedback.router)
app.include_router(notifications.router)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "message": "CCRTS API is running", "version": "1.0.0"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}
