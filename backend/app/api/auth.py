from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.models.user import User
from app.models.company import Company
from app.models.activity_log import ActivityLog
from app.schemas.auth import Token, UserLogin, UserCreate, UserOut
from app.services.auth_service import verify_password, get_password_hash, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is deactivated")

    # Update last login
    user.last_login = datetime.utcnow()
    
    # Log activity
    log = ActivityLog(
        user_id=user.id,
        action="USER_LOGIN",
        entity_type="user",
        entity_id=user.id,
        details=f"User {user.email} logged in successfully"
    )
    db.add(log)
    db.commit()

    company_name = user.company.name if user.company else "Default Company"

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = create_access_token(
        data={"sub": user.email, "role": user.role, "company_id": user.company_id},
        expires_delta=access_token_expires
    )
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "full_name": user.full_name,
        "email": user.email,
        "company_name": company_name
    }

@router.post("/register", response_model=UserOut)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email is already registered")

    # Find or create company
    company = db.query(Company).filter(Company.name == user_data.company_name).first()
    if not company:
        company = Company(name=user_data.company_name)
        db.add(company)
        db.flush()

    new_user = User(
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        role=user_data.role or "auditor",
        company_id=company.id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

@router.get("/me", response_model=UserOut)
def get_profile(current_user: User = Depends(get_current_user)):
    user_out = UserOut.from_orm(current_user)
    if current_user.company:
        user_out.company_name = current_user.company.name
    return user_out
