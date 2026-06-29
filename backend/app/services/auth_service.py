from typing import Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from app.models.user import User
from app.schemas.user import UserCreate, Token
from app.core.security import (
    verify_password, 
    get_password_hash, 
    create_access_token, 
    create_refresh_token,
    verify_token
)


async def authenticate_user(
    db: AsyncSession, 
    email: str, 
    password: str
) -> Optional[User]:
    """Verify user credentials."""
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


async def register_user(
    db: AsyncSession, 
    user_in: UserCreate
) -> User:
    """Create a new user in the database."""
    # Check if email exists
    result = await db.execute(select(User).where(User.email == user_in.email))
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists"
        )
    
    hashed_password = get_password_hash(user_in.password)
    user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        role=user_in.role
    )
    db.add(user)
    await db.flush() # Flushes to get ID but doesn't commit yet (session lifecycle handles commit)
    return user


async def refresh_access_token(
    db: AsyncSession, 
    refresh_token: str
) -> Tuple[str, str]:
    """Verify refresh token and issue new access & refresh tokens."""
    payload = verify_token(refresh_token, token_type="refresh")
    email = payload.get("sub")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
        
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
        
    new_access = create_access_token(subject=user.email, role=user.role)
    new_refresh = create_refresh_token(subject=user.email, role=user.role)
    return new_access, new_refresh
