import pytest
from httpx import AsyncClient


@pytest.fixture
async def registered_user(client: AsyncClient) -> dict:
    r = await client.post(
        "/api/auth/register", json={"username": "alice", "password": "password123"}
    )
    return r.json()


async def test_register_success(client: AsyncClient) -> None:
    r = await client.post(
        "/api/auth/register", json={"username": "alice", "password": "password123"}
    )
    assert r.status_code == 201
    data = r.json()
    assert data["username"] == "alice"
    assert "id" in data


async def test_register_duplicate_username(
    client: AsyncClient, registered_user: dict
) -> None:
    r = await client.post(
        "/api/auth/register", json={"username": "alice", "password": "otherpassword"}
    )
    assert r.status_code == 409


async def test_login_success(client: AsyncClient, registered_user: dict) -> None:
    r = await client.post(
        "/api/auth/login", json={"username": "alice", "password": "password123"}
    )
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


async def test_login_wrong_password(client: AsyncClient, registered_user: dict) -> None:
    r = await client.post(
        "/api/auth/login", json={"username": "alice", "password": "wrong"}
    )
    assert r.status_code == 401


async def test_refresh_success(client: AsyncClient, registered_user: dict) -> None:
    login_r = await client.post(
        "/api/auth/login", json={"username": "alice", "password": "password123"}
    )
    refresh_token = login_r.json()["refresh_token"]
    r = await client.post("/api/auth/refresh", json={"refresh_token": refresh_token})
    assert r.status_code == 200
    assert "access_token" in r.json()


async def test_refresh_invalid_token(client: AsyncClient) -> None:
    r = await client.post(
        "/api/auth/refresh", json={"refresh_token": "invalid.token.here"}
    )
    assert r.status_code == 401


async def test_me_success(client: AsyncClient, auth_headers: dict[str, str]) -> None:
    r = await client.get("/api/auth/me", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["username"] == "testuser"


async def test_me_no_token(client: AsyncClient) -> None:
    r = await client.get("/api/auth/me")
    assert r.status_code == 401


async def test_register_invalid_username_chars(client: AsyncClient) -> None:
    r = await client.post(
        "/api/auth/register",
        json={"username": "bad user!", "password": "password123"},
    )
    assert r.status_code == 422


async def test_register_username_with_korean(client: AsyncClient) -> None:
    r = await client.post(
        "/api/auth/register",
        json={"username": "유저이름", "password": "password123"},
    )
    assert r.status_code == 201
    assert r.json()["username"] == "유저이름"


async def test_register_username_with_cyrillic(client: AsyncClient) -> None:
    r = await client.post(
        "/api/auth/register",
        json={"username": "Аlice", "password": "password123"},
    )
    assert r.status_code == 422


async def test_register_valid_username_special(client: AsyncClient) -> None:
    r = await client.post(
        "/api/auth/register",
        json={"username": "user_name-01", "password": "password123"},
    )
    assert r.status_code == 201
    assert r.json()["username"] == "user_name-01"


async def test_update_me_nickname(
    client: AsyncClient, auth_headers: dict[str, str]
) -> None:
    r = await client.put(
        "/api/auth/me",
        json={"nickname": "TestNick"},
        headers=auth_headers,
    )
    assert r.status_code == 200
    assert r.json()["nickname"] == "TestNick"

    # Verify via GET /auth/me
    me_r = await client.get("/api/auth/me", headers=auth_headers)
    assert me_r.json()["nickname"] == "TestNick"


async def test_update_me_clear_nickname(
    client: AsyncClient, auth_headers: dict[str, str]
) -> None:
    await client.put(
        "/api/auth/me",
        json={"nickname": "TestNick"},
        headers=auth_headers,
    )
    r = await client.put(
        "/api/auth/me",
        json={"nickname": None},
        headers=auth_headers,
    )
    assert r.status_code == 200
    assert r.json()["nickname"] is None
