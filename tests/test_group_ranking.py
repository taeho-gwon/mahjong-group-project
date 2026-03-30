from httpx import AsyncClient


async def _login(
    client: AsyncClient, username: str, password: str = "password123"
) -> dict:
    creds = {"username": username, "password": password}
    r = await client.post("/api/auth/register", json=creds)
    user_id = r.json()["id"]
    login_r = await client.post("/api/auth/login", json=creds)
    token = login_r.json()["access_token"]
    return {"id": user_id, "headers": {"Authorization": f"Bearer {token}"}}


_GROUP_PAYLOAD = {"name": "Test Group", "join_policy": "public"}

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


async def _setup_group_with_records(client: AsyncClient) -> dict:
    """Create 4 players, a group, a regular event, and 2 game records."""
    p1 = await _login(client, "player1")
    p2 = await _login(client, "player2")
    p3 = await _login(client, "player3")
    p4 = await _login(client, "player4")

    group_r = await client.post(
        "/api/groups", json=_GROUP_PAYLOAD, headers=p1["headers"]
    )
    group_id = group_r.json()["id"]

    for p in (p2, p3, p4):
        await client.post(f"/api/groups/{group_id}/join", headers=p["headers"])

    event_r = await client.post(
        "/api/events",
        json={**_EVENT_PAYLOAD, "group_id": group_id},
        headers=p1["headers"],
    )
    event_id = event_r.json()["id"]

    # Game 1: p1=1st(40k), p2=2nd(30k), p3=3rd(20k), p4=4th(10k)
    await client.post(
        "/api/game-records",
        json={
            "east_player_id": p1["id"],
            "south_player_id": p2["id"],
            "west_player_id": p3["id"],
            "north_player_id": p4["id"],
            "east_point": 40000,
            "south_point": 30000,
            "west_point": 20000,
            "north_point": 10000,
            "group_id": group_id,
            "event_id": event_id,
        },
        headers=p1["headers"],
    )

    # Game 2: p2=1st(50k), p1=2nd(25k), p3=3rd(15k), p4=4th(10k)
    await client.post(
        "/api/game-records",
        json={
            "east_player_id": p2["id"],
            "south_player_id": p1["id"],
            "west_player_id": p3["id"],
            "north_player_id": p4["id"],
            "east_point": 50000,
            "south_point": 25000,
            "west_point": 15000,
            "north_point": 10000,
            "group_id": group_id,
            "event_id": event_id,
        },
        headers=p1["headers"],
    )

    return {
        "players": [p1, p2, p3, p4],
        "group_id": group_id,
        "event_id": event_id,
    }


async def test_group_ranking_basic(client: AsyncClient) -> None:
    """Test basic group ranking: all players ranked correctly."""
    ctx = await _setup_group_with_records(client)
    p1 = ctx["players"][0]

    r = await client.get(
        f"/api/groups/{ctx['group_id']}/ranking",
        headers=p1["headers"],
    )
    assert r.status_code == 200
    data = r.json()

    assert data["ranking_type"] == "score"
    items = data["items"]
    assert len(items) == 4

    # p2: game1 2nd (5+10=15), game2 1st (25+30=55) => 70
    # p1: game1 1st (15+30=45), game2 2nd (0+10=10) => 55
    # p3: game1 3rd (-5-10=-15), game2 3rd (-10-10=-20) => -35
    # p4: game1 4th (-15-30=-45), game2 4th (-15-30=-45) => -90
    assert items[0]["rank"] == 1
    assert items[0]["ranking_score"] == 70.0
    assert items[0]["total_games"] == 2

    assert items[1]["rank"] == 2
    assert items[1]["ranking_score"] == 55.0

    assert items[2]["rank"] == 3
    assert items[3]["rank"] == 4

    # Verify display_name and username are present
    for item in items:
        assert "display_name" in item
        assert "username" in item
        assert "user_id" in item
        assert "placement_counts" in item


async def test_group_ranking_period_filter(client: AsyncClient) -> None:
    """Test ranking with period=daily returns records for today."""
    ctx = await _setup_group_with_records(client)
    p1 = ctx["players"][0]

    # Records created today, so daily period should include them
    r = await client.get(
        f"/api/groups/{ctx['group_id']}/ranking?period=daily",
        headers=p1["headers"],
    )
    assert r.status_code == 200
    data = r.json()
    # Records were just created, so they should appear in daily
    assert len(data["items"]) == 4


async def test_group_ranking_empty(client: AsyncClient) -> None:
    """Group with no records should return empty ranking."""
    p1 = await _login(client, "player1")
    group_r = await client.post(
        "/api/groups", json=_GROUP_PAYLOAD, headers=p1["headers"]
    )
    group_id = group_r.json()["id"]

    r = await client.get(
        f"/api/groups/{group_id}/ranking",
        headers=p1["headers"],
    )
    assert r.status_code == 200
    data = r.json()
    assert data["items"] == []
    assert data["ranking_type"] == "score"


async def test_group_ranking_private_group_non_member(client: AsyncClient) -> None:
    """Non-member accessing private group ranking should get 403."""
    p1 = await _login(client, "player1")
    p2 = await _login(client, "player2")

    group_r = await client.post(
        "/api/groups",
        json={"name": "Private Group", "join_policy": "private"},
        headers=p1["headers"],
    )
    group_id = group_r.json()["id"]

    r = await client.get(
        f"/api/groups/{group_id}/ranking",
        headers=p2["headers"],
    )
    assert r.status_code == 403


async def test_group_ranking_group_not_found(client: AsyncClient) -> None:
    """Ranking for non-existent group should return 404."""
    p1 = await _login(client, "player1")
    r = await client.get(
        "/api/groups/99999/ranking",
        headers=p1["headers"],
    )
    assert r.status_code == 404


async def test_group_ranking_display_name_priority(client: AsyncClient) -> None:
    """Display name should use group nickname when set, otherwise username."""
    p1 = await _login(client, "player1")
    p2 = await _login(client, "player2")
    p3 = await _login(client, "player3")
    p4 = await _login(client, "player4")

    group_r = await client.post(
        "/api/groups", json=_GROUP_PAYLOAD, headers=p1["headers"]
    )
    group_id = group_r.json()["id"]

    # p2 joins without group nickname -> falls back to username
    await client.post(f"/api/groups/{group_id}/join", headers=p2["headers"])
    # p3 joins with group nickname -> should use group nickname
    await client.post(
        f"/api/groups/{group_id}/join",
        json={"nickname": "GroupNick3"},
        headers=p3["headers"],
    )
    await client.post(f"/api/groups/{group_id}/join", headers=p4["headers"])

    event_r = await client.post(
        "/api/events",
        json={**_EVENT_PAYLOAD, "group_id": group_id},
        headers=p1["headers"],
    )
    event_id = event_r.json()["id"]

    await client.post(
        "/api/game-records",
        json={
            "east_player_id": p1["id"],
            "south_player_id": p2["id"],
            "west_player_id": p3["id"],
            "north_player_id": p4["id"],
            "east_point": 40000,
            "south_point": 30000,
            "west_point": 20000,
            "north_point": 10000,
            "group_id": group_id,
            "event_id": event_id,
        },
        headers=p1["headers"],
    )

    r = await client.get(
        f"/api/groups/{group_id}/ranking",
        headers=p1["headers"],
    )
    assert r.status_code == 200
    items = {item["user_id"]: item for item in r.json()["items"]}

    # p1: no nickname -> username
    assert items[p1["id"]]["display_name"] == "player1"
    # p2: no nickname -> username
    assert items[p2["id"]]["display_name"] == "player2"
    # p3: group nickname set -> group nickname
    assert items[p3["id"]]["display_name"] == "GroupNick3"
    # p4: no nickname -> username
    assert items[p4["id"]]["display_name"] == "player4"


async def test_group_ranking_tied_players(client: AsyncClient) -> None:
    """Two players with the same score should share the same rank, next rank skipped."""
    p1 = await _login(client, "player1")
    p2 = await _login(client, "player2")
    p3 = await _login(client, "player3")
    p4 = await _login(client, "player4")

    group_r = await client.post(
        "/api/groups", json=_GROUP_PAYLOAD, headers=p1["headers"]
    )
    group_id = group_r.json()["id"]

    for p in (p2, p3, p4):
        await client.post(f"/api/groups/{group_id}/join", headers=p["headers"])

    event_r = await client.post(
        "/api/events",
        json={**_EVENT_PAYLOAD, "group_id": group_id},
        headers=p1["headers"],
    )
    event_id = event_r.json()["id"]

    # Game: p1=1st(40k), p2=2nd(30k), p3=3rd(20k), p4=4th(10k)
    await client.post(
        "/api/game-records",
        json={
            "east_player_id": p1["id"],
            "south_player_id": p2["id"],
            "west_player_id": p3["id"],
            "north_player_id": p4["id"],
            "east_point": 40000,
            "south_point": 30000,
            "west_point": 20000,
            "north_point": 10000,
            "group_id": group_id,
            "event_id": event_id,
        },
        headers=p1["headers"],
    )

    # Game: p2=1st(40k), p1=2nd(30k), p4=3rd(20k), p3=4th(10k)
    # After 2 games: p1 and p2 should have the same total_score
    # p1: game1 1st(15+30=45) + game2 2nd(5+10=15) = 60
    # p2: game1 2nd(5+10=15) + game2 1st(15+30=45) = 60
    await client.post(
        "/api/game-records",
        json={
            "east_player_id": p2["id"],
            "south_player_id": p1["id"],
            "west_player_id": p4["id"],
            "north_player_id": p3["id"],
            "east_point": 40000,
            "south_point": 30000,
            "west_point": 20000,
            "north_point": 10000,
            "group_id": group_id,
            "event_id": event_id,
        },
        headers=p1["headers"],
    )

    r = await client.get(
        f"/api/groups/{group_id}/ranking",
        headers=p1["headers"],
    )
    assert r.status_code == 200
    items = r.json()["items"]
    assert len(items) == 4

    # p1 and p2 tied at rank 1
    assert items[0]["rank"] == 1
    assert items[1]["rank"] == 1
    # p3 and p4 also tied (symmetric games), both rank 3
    assert items[2]["rank"] == 3
    assert items[3]["rank"] == 3
