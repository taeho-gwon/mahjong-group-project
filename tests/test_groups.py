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


async def test_create_group_with_ranking_settings(client: AsyncClient) -> None:
    headers = await _login(client, "owner")
    payload = {**_GROUP_PAYLOAD, "weekly_start_day": 6, "monthly_start_day": 15}
    r = await client.post("/api/groups", json=payload, headers=headers)
    assert r.status_code == 201
    data = r.json()
    assert data["weekly_start_day"] == 6
    assert data["monthly_start_day"] == 15


async def test_create_group_default_ranking_settings(client: AsyncClient) -> None:
    headers = await _login(client, "owner")
    r = await client.post("/api/groups", json=_GROUP_PAYLOAD, headers=headers)
    assert r.status_code == 201
    data = r.json()
    assert data["weekly_start_day"] == 0
    assert data["monthly_start_day"] == 1


async def test_create_group_invalid_weekly_start_day(client: AsyncClient) -> None:
    headers = await _login(client, "owner")
    payload = {**_GROUP_PAYLOAD, "weekly_start_day": 7}
    r = await client.post("/api/groups", json=payload, headers=headers)
    assert r.status_code == 422


async def test_create_group_invalid_monthly_start_day(client: AsyncClient) -> None:
    headers = await _login(client, "owner")
    payload = {**_GROUP_PAYLOAD, "monthly_start_day": 29}
    r = await client.post("/api/groups", json=payload, headers=headers)
    assert r.status_code == 422


async def test_update_group_ranking_settings(client: AsyncClient) -> None:
    headers = await _login(client, "owner")
    create_r = await client.post("/api/groups", json=_GROUP_PAYLOAD, headers=headers)
    group_id = create_r.json()["id"]

    r = await client.put(
        f"/api/groups/{group_id}",
        json={"weekly_start_day": 5, "monthly_start_day": 10},
        headers=headers,
    )
    assert r.status_code == 200
    assert r.json()["weekly_start_day"] == 5
    assert r.json()["monthly_start_day"] == 10


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


# --- Nickname Tests ---


async def test_join_group_with_nickname(client: AsyncClient) -> None:
    owner_headers = await _login(client, "owner")
    member_headers = await _login(client, "member")
    create_r = await client.post(
        "/api/groups", json=_GROUP_PAYLOAD, headers=owner_headers
    )
    group_id = create_r.json()["id"]

    r = await client.post(
        f"/api/groups/{group_id}/join",
        json={"nickname": "MJ프로"},
        headers=member_headers,
    )
    assert r.status_code == 200

    # Check nickname in group detail
    detail_r = await client.get(f"/api/groups/{group_id}")
    members = detail_r.json()["members"]
    member_info = next(m for m in members if m["username"] == "member")
    assert member_info["nickname"] == "MJ프로"


async def test_join_group_duplicate_nickname_conflict(
    client: AsyncClient,
) -> None:
    owner_headers = await _login(client, "owner")
    m1_headers = await _login(client, "member1")
    m2_headers = await _login(client, "member2")
    create_r = await client.post(
        "/api/groups", json=_GROUP_PAYLOAD, headers=owner_headers
    )
    group_id = create_r.json()["id"]

    await client.post(
        f"/api/groups/{group_id}/join",
        json={"nickname": "SameName"},
        headers=m1_headers,
    )
    r = await client.post(
        f"/api/groups/{group_id}/join",
        json={"nickname": "SameName"},
        headers=m2_headers,
    )
    assert r.status_code == 409


async def test_join_by_invite_with_nickname(client: AsyncClient) -> None:
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
    token = invite_r.json()["invite_url"].split("token=")[1]

    r = await client.post(
        "/api/groups/join-by-invite",
        json={"invite_token": token, "nickname": "InvitedNick"},
        headers=member_headers,
    )
    assert r.status_code == 200

    detail_r = await client.get(f"/api/groups/{group_id}")
    members = detail_r.json()["members"]
    member_info = next(m for m in members if m["username"] == "member")
    assert member_info["nickname"] == "InvitedNick"


async def test_update_member_nickname(client: AsyncClient) -> None:
    owner_headers = await _login(client, "owner")
    member_headers = await _login(client, "member")
    create_r = await client.post(
        "/api/groups", json=_GROUP_PAYLOAD, headers=owner_headers
    )
    group_id = create_r.json()["id"]
    await client.post(f"/api/groups/{group_id}/join", headers=member_headers)

    detail_r = await client.get(f"/api/groups/{group_id}")
    members = detail_r.json()["members"]
    member_id = next(m["id"] for m in members if m["username"] == "member")

    # Member changes own nickname
    r = await client.put(
        f"/api/groups/{group_id}/members/{member_id}/nickname",
        json={"nickname": "NewNick"},
        headers=member_headers,
    )
    assert r.status_code == 200
    assert r.json()["nickname"] == "NewNick"


async def test_update_nickname_duplicate_conflict(
    client: AsyncClient,
) -> None:
    owner_headers = await _login(client, "owner")
    m1_headers = await _login(client, "member1")
    m2_headers = await _login(client, "member2")
    create_r = await client.post(
        "/api/groups", json=_GROUP_PAYLOAD, headers=owner_headers
    )
    group_id = create_r.json()["id"]

    await client.post(
        f"/api/groups/{group_id}/join",
        json={"nickname": "TakenNick"},
        headers=m1_headers,
    )
    await client.post(f"/api/groups/{group_id}/join", headers=m2_headers)

    detail_r = await client.get(f"/api/groups/{group_id}")
    members = detail_r.json()["members"]
    m2_id = next(m["id"] for m in members if m["username"] == "member2")

    r = await client.put(
        f"/api/groups/{group_id}/members/{m2_id}/nickname",
        json={"nickname": "TakenNick"},
        headers=m2_headers,
    )
    assert r.status_code == 409


async def test_update_nickname_by_owner(client: AsyncClient) -> None:
    owner_headers = await _login(client, "owner")
    member_headers = await _login(client, "member")
    create_r = await client.post(
        "/api/groups", json=_GROUP_PAYLOAD, headers=owner_headers
    )
    group_id = create_r.json()["id"]
    await client.post(f"/api/groups/{group_id}/join", headers=member_headers)

    detail_r = await client.get(f"/api/groups/{group_id}")
    members = detail_r.json()["members"]
    member_id = next(m["id"] for m in members if m["username"] == "member")

    # Owner changes member's nickname
    r = await client.put(
        f"/api/groups/{group_id}/members/{member_id}/nickname",
        json={"nickname": "OwnerSet"},
        headers=owner_headers,
    )
    assert r.status_code == 200
    assert r.json()["nickname"] == "OwnerSet"


async def test_update_nickname_by_non_member_forbidden(
    client: AsyncClient,
) -> None:
    owner_headers = await _login(client, "owner")
    member_headers = await _login(client, "member")
    other_headers = await _login(client, "other")
    create_r = await client.post(
        "/api/groups", json=_GROUP_PAYLOAD, headers=owner_headers
    )
    group_id = create_r.json()["id"]
    await client.post(f"/api/groups/{group_id}/join", headers=member_headers)

    detail_r = await client.get(f"/api/groups/{group_id}")
    members = detail_r.json()["members"]
    member_id = next(m["id"] for m in members if m["username"] == "member")

    r = await client.put(
        f"/api/groups/{group_id}/members/{member_id}/nickname",
        json={"nickname": "Hacked"},
        headers=other_headers,
    )
    assert r.status_code == 403


async def test_member_info_includes_user_nickname(
    client: AsyncClient,
) -> None:
    """Set user nickname, join group, verify user_nickname in member info."""
    owner_headers = await _login(client, "owner")
    member_headers = await _login(client, "member")

    # Set user-level nickname
    await client.put(
        "/api/auth/me",
        json={"nickname": "GlobalNick"},
        headers=member_headers,
    )

    create_r = await client.post(
        "/api/groups", json=_GROUP_PAYLOAD, headers=owner_headers
    )
    group_id = create_r.json()["id"]
    await client.post(f"/api/groups/{group_id}/join", headers=member_headers)

    detail_r = await client.get(f"/api/groups/{group_id}")
    members = detail_r.json()["members"]
    member_info = next(m for m in members if m["username"] == "member")
    assert member_info["user_nickname"] == "GlobalNick"
    assert member_info["nickname"] is None
