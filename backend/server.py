from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
import jwt
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = os.environ.get("JWT_SECRET", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60  # 30 days

security = HTTPBearer()

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# ============= Models =============

class UserRole:
    ADMIN = "admin"
    USER = "user"

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    password_hash: str
    role: str = UserRole.USER
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    username: str
    password: str
    role: str = UserRole.USER

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    role: str
    created_at: datetime

class Person(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    initial_usd: float = 0.0
    initial_iqd: float = 0.0
    owner_user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class PersonCreate(BaseModel):
    name: str
    initial_usd: float = 0.0
    initial_iqd: float = 0.0

class PersonResponse(BaseModel):
    id: str
    name: str
    initial_usd: float
    initial_iqd: float
    owner_user_id: str
    created_at: datetime
    balance_usd: float = 0.0
    balance_iqd: float = 0.0

class Transaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    person_id: str
    type: str  # deposit or withdraw
    currency: str  # USD or IQD
    amount: float
    note: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str

class TransactionCreate(BaseModel):
    person_id: str
    type: str
    currency: str
    amount: float
    note: str = ""

class TransactionUpdate(BaseModel):
    type: Optional[str] = None
    currency: Optional[str] = None
    amount: Optional[float] = None
    note: Optional[str] = None

class AuditLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    actor_user_id: str
    actor_username: str
    action: str
    entity_type: str = ""
    entity_id: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)

# ============= Helper Functions =============

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    
    user = await db.users.find_one({"id": user_id})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return User(**user)

async def get_current_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return current_user

async def log_audit(user: User, action: str, entity_type: str = "", entity_id: str = ""):
    audit = AuditLog(
        actor_user_id=user.id,
        actor_username=user.username,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id
    )
    await db.audit_logs.insert_one(audit.dict())

async def calculate_balance(person_id: str, currency: str) -> float:
    """Calculate current balance for a person in a specific currency"""
    person = await db.people.find_one({"id": person_id})
    if not person:
        return 0.0
    
    # Get initial balance
    initial = person.get(f"initial_{currency.lower()}", 0.0)
    
    # Calculate from transactions
    transactions = await db.transactions.find({
        "person_id": person_id,
        "currency": currency
    }).to_list(None)
    
    balance = initial
    for tx in transactions:
        if tx["type"] == "deposit":
            balance += tx["amount"]
        elif tx["type"] == "withdraw":
            balance -= tx["amount"]
    
    return balance

# ============= Authentication Routes =============

@api_router.post("/auth/register")
async def register(user_create: UserCreate):
    # Check if username exists
    existing = await db.users.find_one({"username": user_create.username})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    user = User(
        username=user_create.username,
        password_hash=hash_password(user_create.password),
        role=user_create.role
    )
    
    await db.users.insert_one(user.dict())
    return {"message": "User created successfully", "user_id": user.id}

@api_router.post("/auth/login")
async def login(user_login: UserLogin):
    user_data = await db.users.find_one({"username": user_login.username})
    if not user_data or not verify_password(user_login.password, user_data["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    user = User(**user_data)
    access_token = create_access_token(data={"sub": user.id})
    
    # Log audit
    await log_audit(user, "login")
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse(
            id=user.id,
            username=user.username,
            role=user.role,
            created_at=user.created_at
        )
    }

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        role=current_user.role,
        created_at=current_user.created_at
    )

# ============= People Routes =============

@api_router.post("/people", response_model=PersonResponse)
async def create_person(person_create: PersonCreate, current_user: User = Depends(get_current_user)):
    person = Person(
        name=person_create.name,
        initial_usd=person_create.initial_usd,
        initial_iqd=person_create.initial_iqd,
        owner_user_id=current_user.id
    )
    
    await db.people.insert_one(person.dict())
    await log_audit(current_user, "create_person", "person", person.id)
    
    return PersonResponse(
        **person.dict(),
        balance_usd=person.initial_usd,
        balance_iqd=person.initial_iqd
    )

@api_router.get("/people", response_model=List[PersonResponse])
async def get_people(search: Optional[str] = None, current_user: User = Depends(get_current_user)):
    # Build query
    query = {}
    if current_user.role != UserRole.ADMIN:
        query["owner_user_id"] = current_user.id
    
    if search:
        query["name"] = {"$regex": search, "$options": "i"}
    
    people = await db.people.find(query).to_list(None)
    
    # Calculate balances for each person
    result = []
    for person_data in people:
        balance_usd = await calculate_balance(person_data["id"], "USD")
        balance_iqd = await calculate_balance(person_data["id"], "IQD")
        
        result.append(PersonResponse(
            **person_data,
            balance_usd=balance_usd,
            balance_iqd=balance_iqd
        ))
    
    return result

@api_router.get("/people/{person_id}", response_model=PersonResponse)
async def get_person(person_id: str, current_user: User = Depends(get_current_user)):
    person = await db.people.find_one({"id": person_id})
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    
    # Check permissions
    if current_user.role != UserRole.ADMIN and person["owner_user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    balance_usd = await calculate_balance(person_id, "USD")
    balance_iqd = await calculate_balance(person_id, "IQD")
    
    return PersonResponse(
        **person,
        balance_usd=balance_usd,
        balance_iqd=balance_iqd
    )

@api_router.delete("/people/{person_id}")
async def delete_person(person_id: str, current_user: User = Depends(get_current_user)):
    person = await db.people.find_one({"id": person_id})
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    
    # Check permissions
    if current_user.role != UserRole.ADMIN and person["owner_user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Delete person and their transactions
    await db.people.delete_one({"id": person_id})
    await db.transactions.delete_many({"person_id": person_id})
    await log_audit(current_user, "delete_person", "person", person_id)
    
    return {"message": "Person deleted successfully"}

# ============= Transaction Routes =============

@api_router.post("/transactions", response_model=Transaction)
async def create_transaction(tx_create: TransactionCreate, current_user: User = Depends(get_current_user)):
    # Verify person exists and user has permission
    person = await db.people.find_one({"id": tx_create.person_id})
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    
    if current_user.role != UserRole.ADMIN and person["owner_user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Check for overdraft
    if tx_create.type == "withdraw":
        current_balance = await calculate_balance(tx_create.person_id, tx_create.currency)
        if current_balance < tx_create.amount:
            raise HTTPException(status_code=400, detail="Insufficient balance")
    
    transaction = Transaction(
        person_id=tx_create.person_id,
        type=tx_create.type,
        currency=tx_create.currency,
        amount=tx_create.amount,
        note=tx_create.note,
        created_by=current_user.id
    )
    
    await db.transactions.insert_one(transaction.dict())
    await log_audit(current_user, f"{tx_create.type}_transaction", "transaction", transaction.id)
    
    return transaction

@api_router.get("/transactions/person/{person_id}", response_model=List[Transaction])
async def get_person_transactions(person_id: str, current_user: User = Depends(get_current_user)):
    # Verify person exists and user has permission
    person = await db.people.find_one({"id": person_id})
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    
    if current_user.role != UserRole.ADMIN and person["owner_user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    transactions = await db.transactions.find({"person_id": person_id}).sort("created_at", -1).to_list(None)
    return [Transaction(**tx) for tx in transactions]

@api_router.put("/transactions/{transaction_id}", response_model=Transaction)
async def update_transaction(
    transaction_id: str,
    tx_update: TransactionUpdate,
    current_user: User = Depends(get_current_user)
):
    tx = await db.transactions.find_one({"id": transaction_id})
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Check permissions
    person = await db.people.find_one({"id": tx["person_id"]})
    if current_user.role != UserRole.ADMIN and person["owner_user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Update fields
    update_data = tx_update.dict(exclude_unset=True)
    if update_data:
        await db.transactions.update_one({"id": transaction_id}, {"$set": update_data})
        await log_audit(current_user, "update_transaction", "transaction", transaction_id)
    
    updated_tx = await db.transactions.find_one({"id": transaction_id})
    return Transaction(**updated_tx)

@api_router.delete("/transactions/{transaction_id}")
async def delete_transaction(transaction_id: str, current_user: User = Depends(get_current_user)):
    tx = await db.transactions.find_one({"id": transaction_id})
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Check permissions
    person = await db.people.find_one({"id": tx["person_id"]})
    if current_user.role != UserRole.ADMIN and person["owner_user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    await db.transactions.delete_one({"id": transaction_id})
    await log_audit(current_user, "delete_transaction", "transaction", transaction_id)
    
    return {"message": "Transaction deleted successfully"}

# ============= Admin Routes =============

@api_router.get("/admin/users", response_model=List[UserResponse])
async def get_users(current_user: User = Depends(get_current_admin)):
    users = await db.users.find().to_list(None)
    return [UserResponse(
        id=u["id"],
        username=u["username"],
        role=u["role"],
        created_at=u["created_at"]
    ) for u in users]

@api_router.post("/admin/users", response_model=UserResponse)
async def create_user(user_create: UserCreate, current_user: User = Depends(get_current_admin)):
    # Check if username exists
    existing = await db.users.find_one({"username": user_create.username})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    user = User(
        username=user_create.username,
        password_hash=hash_password(user_create.password),
        role=user_create.role
    )
    
    await db.users.insert_one(user.dict())
    await log_audit(current_user, "create_user", "user", user.id)
    
    return UserResponse(
        id=user.id,
        username=user.username,
        role=user.role,
        created_at=user.created_at
    )

@api_router.delete("/admin/users/{user_id}")
async def delete_user(user_id: str, current_user: User = Depends(get_current_admin)):
    # Prevent self-deletion
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.users.delete_one({"id": user_id})
    await log_audit(current_user, "delete_user", "user", user_id)
    
    return {"message": "User deleted successfully"}

@api_router.get("/admin/audit", response_model=List[AuditLog])
async def get_audit_logs(limit: int = 100, current_user: User = Depends(get_current_admin)):
    logs = await db.audit_logs.find().sort("created_at", -1).limit(limit).to_list(None)
    return [AuditLog(**log) for log in logs]

# ============= Reports Routes =============

@api_router.get("/reports/monthly")
async def get_monthly_report(month: str, current_user: User = Depends(get_current_user)):
    """Get monthly report. Month format: YYYY-MM"""
    try:
        year, month_num = month.split("-")
        start_date = datetime(int(year), int(month_num), 1)
        
        # Calculate end date (first day of next month)
        if int(month_num) == 12:
            end_date = datetime(int(year) + 1, 1, 1)
        else:
            end_date = datetime(int(year), int(month_num) + 1, 1)
    except:
        raise HTTPException(status_code=400, detail="Invalid month format. Use YYYY-MM")
    
    # Get all people for this user
    query = {}
    if current_user.role != UserRole.ADMIN:
        query["owner_user_id"] = current_user.id
    
    people = await db.people.find(query).to_list(None)
    person_ids = [p["id"] for p in people]
    
    # Get transactions for the month
    transactions = await db.transactions.find({
        "person_id": {"$in": person_ids},
        "created_at": {"$gte": start_date, "$lt": end_date}
    }).to_list(None)
    
    # Calculate totals
    deposits_usd = sum(tx["amount"] for tx in transactions if tx["type"] == "deposit" and tx["currency"] == "USD")
    withdraws_usd = sum(tx["amount"] for tx in transactions if tx["type"] == "withdraw" and tx["currency"] == "USD")
    deposits_iqd = sum(tx["amount"] for tx in transactions if tx["type"] == "deposit" and tx["currency"] == "IQD")
    withdraws_iqd = sum(tx["amount"] for tx in transactions if tx["type"] == "withdraw" and tx["currency"] == "IQD")
    
    return {
        "month": month,
        "deposits_usd": deposits_usd,
        "withdraws_usd": withdraws_usd,
        "deposits_iqd": deposits_iqd,
        "withdraws_iqd": withdraws_iqd,
        "total_transactions": len(transactions)
    }

# Initialize database with admin user
@app.on_event("startup")
async def startup_db():
    # Create admin user if not exists
    admin = await db.users.find_one({"username": "admin"})
    if not admin:
        admin_user = User(
            username="admin",
            password_hash=hash_password("admin123"),
            role=UserRole.ADMIN
        )
        await db.users.insert_one(admin_user.dict())
        logger.info("Admin user created: admin/admin123")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
