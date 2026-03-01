from httpx import AsyncClient

_GROUP_PAYLOAD = {
    "name": "Test Group",
    "description": "A test group",
    "join_policy": "public",
}


async def _login(
    client: AsyncClient, username: str, password: str = "password123"
) -> dict[str, str]:
    creds = {"username": username, "password": password}
    await client.post("/auth/register", json=creds)
    r = await client.post("/auth/login", json=creds)
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


async def test_create_group_success(client: AsyncClient) -> None:
    headers = await _login(client, "owner")
    r = await client.post("/groups", json=_GROUP_PAYLOAD, headers=headers)
    assert r.status_code == 201
    assert r.json()["name"] == "Test Group"


async def test_create_group_unauthorized(client: AsyncClient) -> None:
    r = await client.post("/groups", json=_GROUP_PAYLOAD)
    assert r.status_code == 401


async def test_list_groups(client: AsyncClient) -> None:
    headers = await _login(client, "owner")
    await client.post("/groups", json=_GROUP_PAYLOAD, headers=headers)
    r = await client.get("/groups")
    assert r.status_code == 200
    data = r.json()
    assert data["total"] >= 1
    assert len(data["items"]) >= 1


async def test_get_group_success(client: AsyncClient) -> None:
    headers = await _login(client, "owner")
    create_r = await client.post("/groups", json=_GROUP_PAYLOAD, headers=headers)
    group_id = create_r.json()["id"]

    r = await client.get(f"/groups/{group_id}")
    assert r.status_code == 200
    assert r.json()["id"] == group_id


async def test_get_group_not_found(client: AsyncClient) -> None:
    r = await client.get("/groups/99999")
    assert r.status_code == 404


async def test_join_public_group(client: AsyncClient) -> None:
    owner_headers = await _login(client, "owner")
    member_headers = await _login(client, "member")
    create_r = await client.post("/groups", json=_GROUP_PAYLOAD, headers=owner_headers)
    group_id = create_r.json()["id"]

    r = await client.post(f"/groups/{group_id}/join", headers=member_headers)
    assert r.status_code == 200


async def test_join_private_group_forbidden(client: AsyncClient) -> None:
    owner_headers = await _login(client, "owner")
    member_headers = await _login(client, "member")
    private_payload = {**_GROUP_PAYLOAD, "join_policy": "private"}
    create_r = await client.post("/groups", json=private_payload, headers=owner_headers)
    group_id = create_r.json()["id"]

    r = await client.post(f"/groups/{group_id}/join", headers=member_headers)
    assert r.status_code == 403


async def test_delete_group_by_owner(client: AsyncClient) -> None:
    headers = await _login(client, "owner")
    create_r = await client.post("/groups", json=_GROUP_PAYLOAD, headers=headers)
    group_id = create_r.json()["id"]

    r = await client.delete(f"/groups/{group_id}", headers=headers)
    assert r.status_code == 204


async def test_delete_group_by_member_forbidden(client: AsyncClient) -> None:
    owner_headers = await _login(client, "owner")
    member_headers = await _login(client, "member")
    create_r = await client.post("/groups", json=_GROUP_PAYLOAD, headers=owner_headers)
    group_id = create_r.json()["id"]
    await client.post(f"/groups/{group_id}/join", headers=member_headers)

    r = await client.delete(f"/groups/{group_id}", headers=member_headers)
    assert r.status_code == 403


async def test_create_group_creates_overall_contest(client: AsyncClient) -> None:
    headers = await _login(client, "owner")
    create_r = await client.post("/groups", json=_GROUP_PAYLOAD, headers=headers)
    group_id = create_r.json()["id"]

    r = await client.get(f"/contests?group_id={group_id}")
    assert r.status_code == 200
    contests = r.json()
    overall = [c for c in contests if c["contest_type"] == "overall"]
    assert len(overall) == 1
    assert overall[0]["name"] == "전체 랭킹"
