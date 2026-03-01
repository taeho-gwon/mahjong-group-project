from httpx import AsyncClient

_GROUP_PAYLOAD = {
    "name": "Shared Group",
    "description": "A shared group",
    "join_policy": "public",
}


async def _login(
    client: AsyncClient, username: str, password: str = "password123"
) -> dict[str, str]:
    creds = {"username": username, "password": password}
    await client.post("/api/auth/register", json=creds)
    r = await client.post("/api/auth/login", json=creds)
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


async def test_get_user_profile_with_shared_groups(client: AsyncClient) -> None:
    headers_a = await _login(client, "alice")
    headers_b = await _login(client, "bob")

    # alice creates a group (auto-joined as owner)
    r = await client.post("/api/groups", json=_GROUP_PAYLOAD, headers=headers_a)
    group_id = r.json()["id"]

    # bob joins
    await client.post(f"/api/groups/{group_id}/join", headers=headers_b)

    # get alice's id
    me_a = await client.get("/api/auth/me", headers=headers_a)
    alice_id = me_a.json()["id"]

    # bob views alice's profile
    r = await client.get(f"/api/users/{alice_id}", headers=headers_b)
    assert r.status_code == 200
    data = r.json()
    assert data["username"] == "alice"
    assert len(data["shared_groups"]) == 1
    assert data["shared_groups"][0]["name"] == "Shared Group"


async def test_get_user_profile_no_shared_groups(client: AsyncClient) -> None:
    headers_a = await _login(client, "alice")
    headers_b = await _login(client, "bob")

    me_a = await client.get("/api/auth/me", headers=headers_a)
    alice_id = me_a.json()["id"]

    # bob views alice — no shared groups
    r = await client.get(f"/api/users/{alice_id}", headers=headers_b)
    assert r.status_code == 200
    data = r.json()
    assert data["username"] == "alice"
    assert data["shared_groups"] == []


async def test_get_user_profile_not_found(client: AsyncClient) -> None:
    headers = await _login(client, "alice")
    r = await client.get("/api/users/99999", headers=headers)
    assert r.status_code == 404


async def test_get_user_profile_unauthorized(client: AsyncClient) -> None:
    r = await client.get("/api/users/1")
    assert r.status_code == 401
