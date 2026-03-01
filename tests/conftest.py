import os

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.api.deps import get_db
from app.main import app
from app.models.base import (
    Base,  # noqa: F401 — triggers all model registration via app import
)

TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://mahjong:mahjong@localhost:5433/mahjong_test",
)

# NullPool: 커넥션 풀링 비활성화 → 테스트 간 이벤트 루프 충돌 방지
test_engine = create_async_engine(TEST_DATABASE_URL, poolclass=NullPool)
TestSessionLocal = async_sessionmaker(test_engine, expire_on_commit=False)

# Truncation order respects FK dependencies
_TABLES = ["game_records", "contests", "group_members", "groups", "users"]


@pytest.fixture(autouse=True)
async def setup_db() -> None:
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with TestSessionLocal() as session:
        for table in _TABLES:
            await session.execute(
                text(f"TRUNCATE TABLE {table} RESTART IDENTITY CASCADE")
            )
        await session.commit()


@pytest.fixture
async def client() -> AsyncClient:
    async with TestSessionLocal() as session:

        async def _override_get_db() -> AsyncSession:
            yield session

        app.dependency_overrides[get_db] = _override_get_db
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as ac:
            yield ac
        app.dependency_overrides.clear()


@pytest.fixture
async def auth_headers(client: AsyncClient) -> dict[str, str]:
    await client.post(
        "/auth/register", json={"username": "testuser", "password": "password123"}
    )
    r = await client.post(
        "/auth/login", json={"username": "testuser", "password": "password123"}
    )
    return {"Authorization": f"Bearer {r.json()['access_token']}"}
