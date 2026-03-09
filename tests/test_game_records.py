from httpx import AsyncClient

_GROUP_PAYLOAD = {
    "name": "Test Group",
    "join_policy": "public",
}

_EVENT_PAYLOAD = {
    "name": "Test Event",
    "ranking_type": "score",
    "uma_1st": 30,
    "uma_2nd": 10,
    "uma_3rd": -10,
    "uma_4th": -30,
    "scoring_1st": 4,
    "scoring_2nd": 2,
    "scoring_3rd": 1,
    "scoring_4th": 0,
}


async def _login(
    client: AsyncClient, username: str, password: str = "password123"
) -> dict:
    creds = {"username": username, "password": password}
    r = await client.post("/api/auth/register", json=creds)
    user_id = r.json()["id"]
    login_r = await client.post("/api/auth/login", json=creds)
    token = login_r.json()["access_token"]
    return {"id": user_id, "headers": {"Authorization": f"Bearer {token}"}}


async def _setup_game(client: AsyncClient) -> dict:
    """Create 4 players, a group, an event and return IDs."""
    p1 = await _login(client, "player1")
    p2 = await _login(client, "player2")
    p3 = await _login(client, "player3")
    p4 = await _login(client, "player4")

    group_r = await client.post(
        "/api/groups", json=_GROUP_PAYLOAD, headers=p1["headers"]
    )
    group_id = group_r.json()["id"]

    # All players join the public group
    for p in (p2, p3, p4):
        await client.post(f"/api/groups/{group_id}/join", headers=p["headers"])

    event_r = await client.post(
        "/api/events",
        json={**_EVENT_PAYLOAD, "group_id": group_id},
        headers=p1["headers"],
    )
    event_id = event_r.json()["id"]

    return {
        "player_ids": [p1["id"], p2["id"], p3["id"], p4["id"]],
        "creator_headers": p1["headers"],
        "other_headers": p2["headers"],
        "group_id": group_id,
        "event_id": event_id,
    }


def _record_payload(player_ids: list[int], group_id: int, event_id: int) -> dict:
    return {
        "east_player_id": player_ids[0],
        "south_player_id": player_ids[1],
        "west_player_id": player_ids[2],
        "north_player_id": player_ids[3],
        "east_point": 40000,
        "south_point": 30000,
        "west_point": 20000,
        "north_point": 10000,
        "group_id": group_id,
        "event_id": event_id,
    }


async def test_create_game_record_success(client: AsyncClient) -> None:
    ctx = await _setup_game(client)
    payload = _record_payload(ctx["player_ids"], ctx["group_id"], ctx["event_id"])

    r = await client.post(
        "/api/game-records", json=payload, headers=ctx["creator_headers"]
    )
    assert r.status_code == 201
    data = r.json()
    assert data["east_point"] == 40000
    assert data["event_id"] == ctx["event_id"]


async def test_create_game_record_unauthorized(client: AsyncClient) -> None:
    ctx = await _setup_game(client)
    payload = _record_payload(ctx["player_ids"], ctx["group_id"], ctx["event_id"])

    r = await client.post("/api/game-records", json=payload)
    assert r.status_code == 401


async def test_list_game_records_by_event(client: AsyncClient) -> None:
    ctx = await _setup_game(client)
    payload = _record_payload(ctx["player_ids"], ctx["group_id"], ctx["event_id"])
    await client.post("/api/game-records", json=payload, headers=ctx["creator_headers"])

    r = await client.get(
        f"/api/game-records?event_id={ctx['event_id']}",
        headers=ctx["creator_headers"],
    )
    assert r.status_code == 200
    data = r.json()
    assert data["total"] >= 1


async def test_update_game_record_by_group_owner(client: AsyncClient) -> None:
    # creator == group owner → 수정 허용
    ctx = await _setup_game(client)
    payload = _record_payload(ctx["player_ids"], ctx["group_id"], ctx["event_id"])
    create_r = await client.post(
        "/api/game-records", json=payload, headers=ctx["creator_headers"]
    )
    record_id = create_r.json()["id"]

    r = await client.put(
        f"/api/game-records/{record_id}",
        json={"east_point": 50000, "north_point": 0},
        headers=ctx["creator_headers"],
    )
    assert r.status_code == 200
    assert r.json()["east_point"] == 50000


async def test_update_game_record_by_member_forbidden(client: AsyncClient) -> None:
    # 일반 member → 403
    ctx = await _setup_game(client)
    payload = _record_payload(ctx["player_ids"], ctx["group_id"], ctx["event_id"])
    create_r = await client.post(
        "/api/game-records", json=payload, headers=ctx["creator_headers"]
    )
    record_id = create_r.json()["id"]

    # player2는 그룹 member (owner/admin 아님)
    await client.post(
        f"/api/groups/{ctx['group_id']}/join", headers=ctx["other_headers"]
    )
    r = await client.put(
        f"/api/game-records/{record_id}",
        json={"east_point": 99999},
        headers=ctx["other_headers"],
    )
    assert r.status_code == 403


async def test_delete_game_record_by_group_owner(client: AsyncClient) -> None:
    # group owner → 삭제 허용
    ctx = await _setup_game(client)
    payload = _record_payload(ctx["player_ids"], ctx["group_id"], ctx["event_id"])
    create_r = await client.post(
        "/api/game-records", json=payload, headers=ctx["creator_headers"]
    )
    record_id = create_r.json()["id"]

    r = await client.delete(
        f"/api/game-records/{record_id}", headers=ctx["creator_headers"]
    )
    assert r.status_code == 204


async def test_get_game_record_success(client: AsyncClient) -> None:
    ctx = await _setup_game(client)
    payload = _record_payload(ctx["player_ids"], ctx["group_id"], ctx["event_id"])
    create_r = await client.post(
        "/api/game-records", json=payload, headers=ctx["creator_headers"]
    )
    record_id = create_r.json()["id"]

    r = await client.get(
        f"/api/game-records/{record_id}", headers=ctx["creator_headers"]
    )
    assert r.status_code == 200
    assert r.json()["id"] == record_id


async def test_get_game_record_not_found(client: AsyncClient) -> None:
    ctx = await _setup_game(client)
    r = await client.get("/api/game-records/99999", headers=ctx["creator_headers"])
    assert r.status_code == 404


async def test_create_game_record_invalid_point_sum(client: AsyncClient) -> None:
    ctx = await _setup_game(client)
    payload = _record_payload(ctx["player_ids"], ctx["group_id"], ctx["event_id"])
    payload["east_point"] = 50000  # sum = 50000+30000+20000+10000 = 110000

    r = await client.post(
        "/api/game-records", json=payload, headers=ctx["creator_headers"]
    )
    assert r.status_code == 422


async def test_update_game_record_invalid_point_sum(client: AsyncClient) -> None:
    ctx = await _setup_game(client)
    payload = _record_payload(ctx["player_ids"], ctx["group_id"], ctx["event_id"])
    create_r = await client.post(
        "/api/game-records", json=payload, headers=ctx["creator_headers"]
    )
    record_id = create_r.json()["id"]

    r = await client.put(
        f"/api/game-records/{record_id}",
        json={
            "east_point": 50000,
            "south_point": 30000,
            "west_point": 20000,
            "north_point": 10000,  # sum = 110000
        },
        headers=ctx["creator_headers"],
    )
    assert r.status_code == 422


async def test_create_game_record_non_member_forbidden(client: AsyncClient) -> None:
    ctx = await _setup_game(client)
    payload = _record_payload(ctx["player_ids"], ctx["group_id"], ctx["event_id"])

    # outsider is not a group member (creator must be a member)
    outsider = await _login(client, "outsider_creator")
    r = await client.post(
        "/api/game-records", json=payload, headers=outsider["headers"]
    )
    assert r.status_code == 403


async def test_delete_game_record_by_member_forbidden(client: AsyncClient) -> None:
    # 일반 member → 403
    ctx = await _setup_game(client)
    payload = _record_payload(ctx["player_ids"], ctx["group_id"], ctx["event_id"])
    create_r = await client.post(
        "/api/game-records", json=payload, headers=ctx["creator_headers"]
    )
    record_id = create_r.json()["id"]

    await client.post(
        f"/api/groups/{ctx['group_id']}/join", headers=ctx["other_headers"]
    )
    r = await client.delete(
        f"/api/game-records/{record_id}", headers=ctx["other_headers"]
    )
    assert r.status_code == 403


async def test_list_game_records_unauthorized(client: AsyncClient) -> None:
    r = await client.get("/api/game-records?group_id=1")
    assert r.status_code == 401


async def test_get_game_record_unauthorized(client: AsyncClient) -> None:
    r = await client.get("/api/game-records/1")
    assert r.status_code == 401


async def test_list_game_records_non_member_forbidden(
    client: AsyncClient,
) -> None:
    ctx = await _setup_game(client)
    payload = _record_payload(ctx["player_ids"], ctx["group_id"], ctx["event_id"])
    await client.post("/api/game-records", json=payload, headers=ctx["creator_headers"])

    # outsider is not a member
    outsider = await _login(client, "outsider")
    r = await client.get(
        f"/api/game-records?group_id={ctx['group_id']}",
        headers=outsider["headers"],
    )
    assert r.status_code == 403


async def test_get_game_record_non_member_forbidden(
    client: AsyncClient,
) -> None:
    ctx = await _setup_game(client)
    payload = _record_payload(ctx["player_ids"], ctx["group_id"], ctx["event_id"])
    create_r = await client.post(
        "/api/game-records", json=payload, headers=ctx["creator_headers"]
    )
    record_id = create_r.json()["id"]

    outsider = await _login(client, "outsider")
    r = await client.get(f"/api/game-records/{record_id}", headers=outsider["headers"])
    assert r.status_code == 403


async def test_create_game_record_duplicate_players(client: AsyncClient) -> None:
    ctx = await _setup_game(client)
    payload = _record_payload(ctx["player_ids"], ctx["group_id"], ctx["event_id"])
    # Set south_player_id same as east_player_id
    payload["south_player_id"] = payload["east_player_id"]

    r = await client.post(
        "/api/game-records", json=payload, headers=ctx["creator_headers"]
    )
    assert r.status_code == 422


async def test_create_game_record_non_member_player(client: AsyncClient) -> None:
    """Players who are not group members cannot be included in a game record."""
    ctx = await _setup_game(client)
    # Create a 5th user who is NOT a group member
    outsider = await _login(client, "outsider_player")
    payload = _record_payload(ctx["player_ids"], ctx["group_id"], ctx["event_id"])
    # Replace one player with the non-member
    payload["north_player_id"] = outsider["id"]

    r = await client.post(
        "/api/game-records", json=payload, headers=ctx["creator_headers"]
    )
    assert r.status_code == 400
    assert "not members" in r.json()["detail"]


async def test_update_game_record_partial_point_invalid_sum(
    client: AsyncClient,
) -> None:
    """Partial point update should validate sum against existing record values."""
    ctx = await _setup_game(client)
    payload = _record_payload(ctx["player_ids"], ctx["group_id"], ctx["event_id"])
    create_r = await client.post(
        "/api/game-records", json=payload, headers=ctx["creator_headers"]
    )
    record_id = create_r.json()["id"]

    # Original: east=40000, south=30000, west=20000, north=10000 (sum=100000)
    # Update only east_point to 50000 → merged sum = 50000+30000+20000+10000 = 110000
    r = await client.put(
        f"/api/game-records/{record_id}",
        json={"east_point": 50000},
        headers=ctx["creator_headers"],
    )
    assert r.status_code == 400
    assert "100000" in r.json()["detail"]


async def test_update_game_record_partial_point_valid_sum(
    client: AsyncClient,
) -> None:
    """Partial point update with valid merged sum should succeed."""
    ctx = await _setup_game(client)
    payload = _record_payload(ctx["player_ids"], ctx["group_id"], ctx["event_id"])
    create_r = await client.post(
        "/api/game-records", json=payload, headers=ctx["creator_headers"]
    )
    record_id = create_r.json()["id"]

    # Original: east=40000, south=30000, west=20000, north=10000
    # Update east=50000, north=0 → merged sum = 50000+30000+20000+0 = 100000
    r = await client.put(
        f"/api/game-records/{record_id}",
        json={"east_point": 50000, "north_point": 0},
        headers=ctx["creator_headers"],
    )
    assert r.status_code == 200
    assert r.json()["east_point"] == 50000
    assert r.json()["north_point"] == 0


async def test_update_game_record_duplicate_players(client: AsyncClient) -> None:
    ctx = await _setup_game(client)
    payload = _record_payload(ctx["player_ids"], ctx["group_id"], ctx["event_id"])
    create_r = await client.post(
        "/api/game-records", json=payload, headers=ctx["creator_headers"]
    )
    record_id = create_r.json()["id"]

    # Update south_player_id to same as east_player_id
    r = await client.put(
        f"/api/game-records/{record_id}",
        json={"south_player_id": ctx["player_ids"][0]},
        headers=ctx["creator_headers"],
    )
    assert r.status_code == 400
