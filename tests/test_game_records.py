from httpx import AsyncClient

_GROUP_PAYLOAD = {
    "name": "Test Group",
    "join_policy": "public",
    "uma_1st": 30,
    "uma_2nd": 10,
    "uma_3rd": -10,
    "uma_4th": -30,
}

_CONTEST_PAYLOAD = {
    "name": "Test Contest",
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
) -> dict[str, str]:
    creds = {"username": username, "password": password}
    r = await client.post("/auth/register", json=creds)
    user_id = r.json()["id"]
    login_r = await client.post("/auth/login", json=creds)
    token = login_r.json()["access_token"]
    return {"id": user_id, "headers": {"Authorization": f"Bearer {token}"}}


async def _setup_game(client: AsyncClient) -> dict:
    """Create 4 players, a group, a contest and return IDs."""
    p1 = await _login(client, "player1")
    p2 = await _login(client, "player2")
    p3 = await _login(client, "player3")
    p4 = await _login(client, "player4")

    group_r = await client.post("/groups", json=_GROUP_PAYLOAD, headers=p1["headers"])
    group_id = group_r.json()["id"]

    contest_r = await client.post(
        "/contests",
        json={**_CONTEST_PAYLOAD, "group_id": group_id},
        headers=p1["headers"],
    )
    contest_id = contest_r.json()["id"]

    return {
        "player_ids": [p1["id"], p2["id"], p3["id"], p4["id"]],
        "creator_headers": p1["headers"],
        "other_headers": p2["headers"],
        "group_id": group_id,
        "contest_id": contest_id,
    }


def _record_payload(player_ids: list[int], group_id: int, contest_id: int) -> dict:
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
        "contest_id": contest_id,
    }


async def test_create_game_record_success(client: AsyncClient) -> None:
    ctx = await _setup_game(client)
    payload = _record_payload(ctx["player_ids"], ctx["group_id"], ctx["contest_id"])

    r = await client.post("/game-records", json=payload, headers=ctx["creator_headers"])
    assert r.status_code == 201
    data = r.json()
    assert data["east_point"] == 40000
    assert data["contest_id"] == ctx["contest_id"]


async def test_create_game_record_unauthorized(client: AsyncClient) -> None:
    ctx = await _setup_game(client)
    payload = _record_payload(ctx["player_ids"], ctx["group_id"], ctx["contest_id"])

    r = await client.post("/game-records", json=payload)
    assert r.status_code == 401


async def test_list_game_records_by_contest(client: AsyncClient) -> None:
    ctx = await _setup_game(client)
    payload = _record_payload(ctx["player_ids"], ctx["group_id"], ctx["contest_id"])
    await client.post("/game-records", json=payload, headers=ctx["creator_headers"])

    r = await client.get(f"/game-records?contest_id={ctx['contest_id']}")
    assert r.status_code == 200
    data = r.json()
    assert data["total"] >= 1


async def test_update_game_record_by_group_owner(client: AsyncClient) -> None:
    # creator == group owner → 수정 허용
    ctx = await _setup_game(client)
    payload = _record_payload(ctx["player_ids"], ctx["group_id"], ctx["contest_id"])
    create_r = await client.post(
        "/game-records", json=payload, headers=ctx["creator_headers"]
    )
    record_id = create_r.json()["id"]

    r = await client.put(
        f"/game-records/{record_id}",
        json={"east_point": 50000, "north_point": 0},
        headers=ctx["creator_headers"],
    )
    assert r.status_code == 200
    assert r.json()["east_point"] == 50000


async def test_update_game_record_by_member_forbidden(client: AsyncClient) -> None:
    # 일반 member → 403
    ctx = await _setup_game(client)
    payload = _record_payload(ctx["player_ids"], ctx["group_id"], ctx["contest_id"])
    create_r = await client.post(
        "/game-records", json=payload, headers=ctx["creator_headers"]
    )
    record_id = create_r.json()["id"]

    # player2는 그룹 member (owner/admin 아님)
    await client.post(f"/groups/{ctx['group_id']}/join", headers=ctx["other_headers"])
    r = await client.put(
        f"/game-records/{record_id}",
        json={"east_point": 99999},
        headers=ctx["other_headers"],
    )
    assert r.status_code == 403


async def test_delete_game_record_by_group_owner(client: AsyncClient) -> None:
    # group owner → 삭제 허용
    ctx = await _setup_game(client)
    payload = _record_payload(ctx["player_ids"], ctx["group_id"], ctx["contest_id"])
    create_r = await client.post(
        "/game-records", json=payload, headers=ctx["creator_headers"]
    )
    record_id = create_r.json()["id"]

    r = await client.delete(
        f"/game-records/{record_id}", headers=ctx["creator_headers"]
    )
    assert r.status_code == 204


async def test_delete_game_record_by_member_forbidden(client: AsyncClient) -> None:
    # 일반 member → 403
    ctx = await _setup_game(client)
    payload = _record_payload(ctx["player_ids"], ctx["group_id"], ctx["contest_id"])
    create_r = await client.post(
        "/game-records", json=payload, headers=ctx["creator_headers"]
    )
    record_id = create_r.json()["id"]

    await client.post(f"/groups/{ctx['group_id']}/join", headers=ctx["other_headers"])
    r = await client.delete(f"/game-records/{record_id}", headers=ctx["other_headers"])
    assert r.status_code == 403
