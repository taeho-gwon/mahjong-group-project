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
    await client.post("/api/auth/register", json=creds)
    r = await client.post("/api/auth/login", json=creds)
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


async def test_create_group_success(client: AsyncClient) -> None:
    headers = await _login(client, "owner")
    r = await client.post("/api/groups", json=_GROUP_PAYLOAD, headers=headers)
    assert r.status_code == 201
    assert r.json()["name"] == "Test Group"


async def test_create_group_unauthorized(client: AsyncClient) -> None:
    r = await client.post("/api/groups", json=_GROUP_PAYLOAD)
    assert r.status_code == 401


async def test_list_groups(client: AsyncClient) -> None:
    headers = await _login(client, "owner")
    await client.post("/api/groups", json=_GROUP_PAYLOAD, headers=headers)
    r = await client.get("/api/groups")
    assert r.status_code == 200
    data = r.json()
    assert data["total"] >= 1
    assert len(data["items"]) >= 1


async def test_get_group_success(client: AsyncClient) -> None:
    headers = await _login(client, "owner")
    create_r = await client.post("/api/groups", json=_GROUP_PAYLOAD, headers=headers)
    group_id = create_r.json()["id"]

    r = await client.get(f"/api/groups/{group_id}")
    assert r.status_code == 200
    assert r.json()["id"] == group_id


async def test_get_group_not_found(client: AsyncClient) -> None:
    r = await client.get("/api/groups/99999")
    assert r.status_code == 404


async def test_join_public_group(client: AsyncClient) -> None:
    owner_headers = await _login(client, "owner")
    member_headers = await _login(client, "member")
    create_r = await client.post(
        "/api/groups", json=_GROUP_PAYLOAD, headers=owner_headers
    )
    group_id = create_r.json()["id"]

    r = await client.post(f"/api/groups/{group_id}/join", headers=member_headers)
    assert r.status_code == 200


async def test_join_private_group_forbidden(client: AsyncClient) -> None:
    owner_headers = await _login(client, "owner")
    member_headers = await _login(client, "member")
    private_payload = {**_GROUP_PAYLOAD, "join_policy": "private"}
    create_r = await client.post(
        "/api/groups", json=private_payload, headers=owner_headers
    )
    group_id = create_r.json()["id"]

    r = await client.post(f"/api/groups/{group_id}/join", headers=member_headers)
    assert r.status_code == 403


async def test_delete_group_by_owner(client: AsyncClient) -> None:
    headers = await _login(client, "owner")
    create_r = await client.post("/api/groups", json=_GROUP_PAYLOAD, headers=headers)
    group_id = create_r.json()["id"]

    r = await client.delete(f"/api/groups/{group_id}", headers=headers)
    assert r.status_code == 204


async def test_delete_group_by_member_forbidden(client: AsyncClient) -> None:
    owner_headers = await _login(client, "owner")
    member_headers = await _login(client, "member")
    create_r = await client.post(
        "/api/groups", json=_GROUP_PAYLOAD, headers=owner_headers
    )
    group_id = create_r.json()["id"]
    await client.post(f"/api/groups/{group_id}/join", headers=member_headers)

    r = await client.delete(f"/api/groups/{group_id}", headers=member_headers)
    assert r.status_code == 403


async def test_create_group_creates_default_aggregate_event(
    client: AsyncClient,
) -> None:
    headers = await _login(client, "owner")
    create_r = await client.post("/api/groups", json=_GROUP_PAYLOAD, headers=headers)
    group_id = create_r.json()["id"]

    r = await client.get(f"/api/events?group_id={group_id}")
    assert r.status_code == 200
    events = r.json()
    aggregate = [
        e for e in events if e["event_type"] == "aggregate" and e["is_default"] is True
    ]
    assert len(aggregate) == 1
    assert aggregate[0]["name"] == "전체 랭킹"


async def test_list_my_groups(client: AsyncClient) -> None:
    headers = await _login(client, "owner")
    await client.post("/api/groups", json=_GROUP_PAYLOAD, headers=headers)

    r = await client.get("/api/groups/me", headers=headers)
    assert r.status_code == 200
    assert len(r.json()) >= 1


async def test_update_group_by_owner(client: AsyncClient) -> None:
    headers = await _login(client, "owner")
    create_r = await client.post("/api/groups", json=_GROUP_PAYLOAD, headers=headers)
    group_id = create_r.json()["id"]

    r = await client.put(
        f"/api/groups/{group_id}",
        json={"name": "Updated Group"},
        headers=headers,
    )
    assert r.status_code == 200
    assert r.json()["name"] == "Updated Group"


async def test_update_group_by_member_forbidden(client: AsyncClient) -> None:
    owner_headers = await _login(client, "owner")
    member_headers = await _login(client, "member")
    create_r = await client.post(
        "/api/groups", json=_GROUP_PAYLOAD, headers=owner_headers
    )
    group_id = create_r.json()["id"]
    await client.post(f"/api/groups/{group_id}/join", headers=member_headers)

    r = await client.put(
        f"/api/groups/{group_id}",
        json={"name": "Hacked"},
        headers=member_headers,
    )
    assert r.status_code == 403


async def test_generate_invite_link(client: AsyncClient) -> None:
    headers = await _login(client, "owner")
    create_r = await client.post("/api/groups", json=_GROUP_PAYLOAD, headers=headers)
    group_id = create_r.json()["id"]

    r = await client.post(f"/api/groups/{group_id}/invite-link", headers=headers)
    assert r.status_code == 200
    assert "invite_url" in r.json()


async def test_join_by_invite(client: AsyncClient) -> None:
    owner_headers = await _login(client, "owner")
    member_headers = await _login(client, "member")
    private_payload = {**_GROUP_PAYLOAD, "join_policy": "private"}
    create_r = await client.post(
        "/api/groups", json=private_payload, headers=owner_headers
    )
    group_id = create_r.json()["id"]

    invite_r = await client.post(
        f"/api/groups/{group_id}/invite-link", headers=owner_headers
    )
    # Extract token from invite_url query param
    invite_url = invite_r.json()["invite_url"]
    token = invite_url.split("token=")[1]

    r = await client.post(
        "/api/groups/join-by-invite",
        json={"invite_token": token},
        headers=member_headers,
    )
    assert r.status_code == 200
    assert r.json()["id"] == group_id


async def test_leave_group(client: AsyncClient) -> None:
    owner_headers = await _login(client, "owner")
    member_headers = await _login(client, "member")
    create_r = await client.post(
        "/api/groups", json=_GROUP_PAYLOAD, headers=owner_headers
    )
    group_id = create_r.json()["id"]
    await client.post(f"/api/groups/{group_id}/join", headers=member_headers)

    r = await client.delete(f"/api/groups/{group_id}/leave", headers=member_headers)
    assert r.status_code == 204


async def test_remove_member(client: AsyncClient) -> None:
    owner_headers = await _login(client, "owner")
    member_auth = await _login(client, "member")

    create_r = await client.post(
        "/api/groups", json=_GROUP_PAYLOAD, headers=owner_headers
    )
    group_id = create_r.json()["id"]
    await client.post(f"/api/groups/{group_id}/join", headers=member_auth)

    # Get member user id from group detail
    detail_r = await client.get(f"/api/groups/{group_id}")
    members = detail_r.json()["members"]
    member_id = next(m["id"] for m in members if m["username"] == "member")

    r = await client.delete(
        f"/api/groups/{group_id}/members/{member_id}", headers=owner_headers
    )
    assert r.status_code == 204


async def test_update_member_role(client: AsyncClient) -> None:
    owner_headers = await _login(client, "owner")
    member_auth = await _login(client, "member")

    create_r = await client.post(
        "/api/groups", json=_GROUP_PAYLOAD, headers=owner_headers
    )
    group_id = create_r.json()["id"]
    await client.post(f"/api/groups/{group_id}/join", headers=member_auth)

    detail_r = await client.get(f"/api/groups/{group_id}")
    members = detail_r.json()["members"]
    member_id = next(m["id"] for m in members if m["username"] == "member")

    r = await client.put(
        f"/api/groups/{group_id}/members/{member_id}/role",
        json={"role": "admin"},
        headers=owner_headers,
    )
    assert r.status_code == 200
    assert r.json()["role"] == "admin"
