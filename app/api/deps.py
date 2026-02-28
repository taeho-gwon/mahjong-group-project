from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.repositories.game_record import GameRecordRepository
from app.repositories.group import GroupRepository
from app.repositories.user import UserRepository
from app.services.auth import AuthService
from app.services.game_record import GameRecordService
from app.services.group import GroupService
from app.utils.security import decode_token

_bearer = HTTPBearer()


def get_user_repository(db: AsyncSession = Depends(get_db)) -> UserRepository:
    return UserRepository(db)


def get_group_repository(db: AsyncSession = Depends(get_db)) -> GroupRepository:
    return GroupRepository(db)


def get_auth_service(
    user_repo: UserRepository = Depends(get_user_repository),
) -> AuthService:
    return AuthService(user_repo)


def get_group_service(
    group_repo: GroupRepository = Depends(get_group_repository),
) -> GroupService:
    return GroupService(group_repo)


def get_game_record_repository(
    db: AsyncSession = Depends(get_db),
) -> GameRecordRepository:
    return GameRecordRepository(db)


def get_game_record_service(
    game_record_repo: GameRecordRepository = Depends(get_game_record_repository),
) -> GameRecordService:
    return GameRecordService(game_record_repo)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    user_repo: UserRepository = Depends(get_user_repository),
) -> User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(credentials.credentials)
    except JWTError:
        raise credentials_error

    if payload.get("type") != "access":
        raise credentials_error

    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_error

    user = await user_repo.get_by_id(int(user_id))
    if not user:
        raise credentials_error
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )
    return user
