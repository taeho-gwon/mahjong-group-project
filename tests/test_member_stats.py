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


async def test_member_stats_basic(client: AsyncClient) -> None:
    """Test basic member stats: game count, placements, score."""
    ctx = await _setup_group_with_records(client)
    p1 = ctx["players"][0]

    r = await client.get(
        f"/api/groups/{ctx['group_id']}/members/{p1['id']}/stats",
        headers=p1["headers"],
    )
    assert r.status_code == 200
    data = r.json()

    assert data["total_games"] == 2
    assert data["placement_counts"]["first"] == 1
    assert data["placement_counts"]["second"] == 1
    assert data["placement_counts"]["third"] == 0
    assert data["placement_counts"]["fourth"] == 0

    # Game 1: (40000-25000)/1000 + 30 = 15 + 30 = 45
    # Game 2: (25000-25000)/1000 + 10 = 0 + 10 = 10
    # Total: 55
    assert data["ranking_score"] == 55.0
    assert data["rank"] is not None


async def test_member_stats_with_event_filter(client: AsyncClient) -> None:
    """Test stats filtered by event_id."""
    ctx = await _setup_group_with_records(client)
    p1 = ctx["players"][0]

    r = await client.get(
        f"/api/groups/{ctx['group_id']}/members/{p1['id']}/stats"
        f"?event_id={ctx['event_id']}",
        headers=p1["headers"],
    )
    assert r.status_code == 200
    data = r.json()
    assert data["total_games"] == 2
    assert data["ranking_score"] == 55.0


async def test_member_stats_no_games(client: AsyncClient) -> None:
    """User with no games should return zero stats and null rank."""
    p1 = await _login(client, "player1")
    p2 = await _login(client, "player2")

    group_r = await client.post(
        "/api/groups", json=_GROUP_PAYLOAD, headers=p1["headers"]
    )
    group_id = group_r.json()["id"]
    await client.post(f"/api/groups/{group_id}/join", headers=p2["headers"])

    r = await client.get(
        f"/api/groups/{group_id}/members/{p2['id']}/stats",
        headers=p1["headers"],
    )
    assert r.status_code == 200
    data = r.json()
    assert data["total_games"] == 0
    assert data["rank"] is None
    assert data["ranking_score"] == 0.0
    assert data["placement_counts"]["first"] == 0
    assert data["placement_counts"]["second"] == 0
    assert data["placement_counts"]["third"] == 0
    assert data["placement_counts"]["fourth"] == 0


async def test_member_stats_ranking_order(client: AsyncClient) -> None:
    """Verify rank ordering: higher score = lower rank number."""
    ctx = await _setup_group_with_records(client)
    p1 = ctx["players"][0]
    p2 = ctx["players"][1]

    r1 = await client.get(
        f"/api/groups/{ctx['group_id']}/members/{p1['id']}/stats",
        headers=p1["headers"],
    )
    r2 = await client.get(
        f"/api/groups/{ctx['group_id']}/members/{p2['id']}/stats",
        headers=p1["headers"],
    )
    data1 = r1.json()
    data2 = r2.json()

    # p2 game1: 2nd (30k→5+10=15), game2: 1st (50k→25+30=55) => total=70
    # p1 game1: 1st (40k→15+30=45), game2: 2nd (25k→0+10=10) => total=55
    # p2 should be ranked higher
    assert data2["ranking_score"] == 70.0
    assert data1["ranking_score"] == 55.0
    assert data2["rank"] < data1["rank"]


async def test_member_stats_unauthorized(client: AsyncClient) -> None:
    """Unauthenticated request should return 401."""
    r = await client.get("/api/groups/1/members/1/stats")
    assert r.status_code == 401


async def test_member_stats_private_group_non_member(client: AsyncClient) -> None:
    """Non-member accessing private group stats should get 403."""
    p1 = await _login(client, "player1")
    p2 = await _login(client, "player2")

    group_r = await client.post(
        "/api/groups",
        json={"name": "Private Group", "join_policy": "private"},
        headers=p1["headers"],
    )
    group_id = group_r.json()["id"]

    r = await client.get(
        f"/api/groups/{group_id}/members/{p1['id']}/stats",
        headers=p2["headers"],
    )
    assert r.status_code == 403


async def test_member_stats_group_not_found(client: AsyncClient) -> None:
    """Stats for non-existent group should return 404."""
    p1 = await _login(client, "player1")
    r = await client.get(
        "/api/groups/99999/members/1/stats",
        headers=p1["headers"],
    )
    assert r.status_code == 404


async def test_member_stats_event_not_in_group(client: AsyncClient) -> None:
    """Event that doesn't belong to the group should return 404."""
    ctx = await _setup_group_with_records(client)
    p1 = ctx["players"][0]

    # Create another group + event
    group2_r = await client.post(
        "/api/groups",
        json={"name": "Other Group", "join_policy": "public"},
        headers=p1["headers"],
    )
    group2_id = group2_r.json()["id"]
    event2_r = await client.post(
        "/api/events",
        json={**_EVENT_PAYLOAD, "name": "Other Event", "group_id": group2_id},
        headers=p1["headers"],
    )
    event2_id = event2_r.json()["id"]

    # Try to use event2 with group1
    r = await client.get(
        f"/api/groups/{ctx['group_id']}/members/{p1['id']}/stats?event_id={event2_id}",
        headers=p1["headers"],
    )
    assert r.status_code == 404


async def test_member_stats_independent_event_excluded(
    client: AsyncClient,
) -> None:
    """Independent events should not be included in group-wide stats."""
    ctx = await _setup_group_with_records(client)
    p1 = ctx["players"][0]
    p2 = ctx["players"][1]
    p3 = ctx["players"][2]
    p4 = ctx["players"][3]

    # Create an independent event
    indie_event_r = await client.post(
        "/api/events",
        json={
            **_EVENT_PAYLOAD,
            "name": "Practice Event",
            "event_type": "independent",
            "group_id": ctx["group_id"],
        },
        headers=p1["headers"],
    )
    indie_event_id = indie_event_r.json()["id"]

    # Add a game in the independent event
    await client.post(
        "/api/game-records",
        json={
            "east_player_id": p1["id"],
            "south_player_id": p2["id"],
            "west_player_id": p3["id"],
            "north_player_id": p4["id"],
            "east_point": 60000,
            "south_point": 20000,
            "west_point": 10000,
            "north_point": 10000,
            "group_id": ctx["group_id"],
            "event_id": indie_event_id,
        },
        headers=p1["headers"],
    )

    # Group-wide stats should still only have 2 games from regular event
    r = await client.get(
        f"/api/groups/{ctx['group_id']}/members/{p1['id']}/stats",
        headers=p1["headers"],
    )
    assert r.status_code == 200
    assert r.json()["total_games"] == 2

    # But stats for the independent event itself should show 1 game
    r2 = await client.get(
        f"/api/groups/{ctx['group_id']}/members/{p1['id']}/stats"
        f"?event_id={indie_event_id}",
        headers=p1["headers"],
    )
    assert r2.status_code == 200
    assert r2.json()["total_games"] == 1
