from fastapi import HTTPException, status
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import user as user_db
from app.models.user import User
from app.schemas.auth import TokenResponse
from app.schemas.user import UserCreate
from app.utils.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_password,
)


async def register(db: AsyncSession, data: UserCreate) -> User:
    if await user_db.get_by_username(db, data.username):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already taken",
        )
    return await user_db.create(db, data)


async def login(db: AsyncSession, username: str, password: str) -> TokenResponse:
    user = await user_db.get_by_username(db, username)
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )
    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


async def refresh_tokens(db: AsyncSession, refresh_token: str) -> TokenResponse:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid refresh token",
    )
    try:
        payload = decode_token(refresh_token)
    except JWTError:
        raise credentials_error

    if payload.get("type") != "refresh":
        raise credentials_error

    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_error

    user = await user_db.get_by_id(db, int(user_id))
    if not user or not user.is_active:
        raise credentials_error

    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )
