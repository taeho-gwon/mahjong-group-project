from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, RefreshRequest, TokenResponse
from app.schemas.user import UserCreate, UserResponse
from app.services import auth as auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED
)
async def register(data: UserCreate, db: AsyncSession = Depends(get_db)) -> User:
    return await auth_service.register(db, data)


@router.post("/login", response_model=TokenResponse)
async def login(
    data: LoginRequest, db: AsyncSession = Depends(get_db)
) -> TokenResponse:
    return await auth_service.login(db, data.username, data.password)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    data: RefreshRequest, db: AsyncSession = Depends(get_db)
) -> TokenResponse:
    return await auth_service.refresh_tokens(db, data.refresh_token)


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user
