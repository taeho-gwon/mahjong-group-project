from httpx import AsyncClient

_GROUP_PAYLOAD = {
    "name": "Test Group",
    "join_policy": "public",
}

_EVENT_PAYLOAD = {
    "name": "Spring League",
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
    await client.post("/api/auth/register", json=creds)
    r = await client.post("/api/auth/login", json=creds)
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


async def _create_group(client: AsyncClient, headers: dict[str, str]) -> int:
    r = await client.post("/api/groups", json=_GROUP_PAYLOAD, headers=headers)
    return r.json()["id"]


async def _create_event(
    client: AsyncClient, headers: dict[str, str], group_id: int
) -> int:
    payload = {**_EVENT_PAYLOAD, "group_id": group_id}
    r = await client.post("/api/events", json=payload, headers=headers)
    return r.json()["id"]


async def test_create_event_success(client: AsyncClient) -> None:
    headers = await _login(client, "owner")
    group_id = await _create_group(client, headers)
    payload = {**_EVENT_PAYLOAD, "group_id": group_id}

    r = await client.post("/api/events", json=payload, headers=headers)
    assert r.status_code == 201
    assert r.json()["name"] == "Spring League"


async def test_create_event_unauthorized(client: AsyncClient) -> None:
    headers = await _login(client, "owner")
    group_id = await _create_group(client, headers)
    payload = {**_EVENT_PAYLOAD, "group_id": group_id}

    r = await client.post("/api/events", json=payload)
    assert r.status_code == 401


async def test_get_event_success(client: AsyncClient) -> None:
    headers = await _login(client, "owner")
    group_id = await _create_group(client, headers)
    event_id = await _create_event(client, headers, group_id)

    r = await client.get(f"/api/events/{event_id}", headers=headers)
    assert r.status_code == 200
    assert r.json()["id"] == event_id
    assert r.json()["name"] == "Spring League"


async def test_get_event_not_found(client: AsyncClient) -> None:
    headers = await _login(client, "owner")
    r = await client.get("/api/events/99999", headers=headers)
    assert r.status_code == 404


async def test_list_events_by_group(client: AsyncClient) -> None:
    headers = await _login(client, "owner")
    group_id = await _create_group(client, headers)
    await _create_event(client, headers, group_id)

    r = await client.get(f"/api/events?group_id={group_id}", headers=headers)
    assert r.status_code == 200
    data = r.json()
    assert data["total"] >= 1
    assert len(data["items"]) >= 1


async def test_list_events_unauthorized(client: AsyncClient) -> None:
    headers = await _login(client, "owner")
    group_id = await _create_group(client, headers)

    r = await client.get(f"/api/events?group_id={group_id}")
    assert r.status_code == 401


async def test_get_event_unauthorized(client: AsyncClient) -> None:
    headers = await _login(client, "owner")
    group_id = await _create_group(client, headers)
    event_id = await _create_event(client, headers, group_id)

    r = await client.get(f"/api/events/{event_id}")
    assert r.status_code == 401


async def test_list_events_non_member_forbidden(client: AsyncClient) -> None:
    owner_headers = await _login(client, "owner")
    other_headers = await _login(client, "outsider")
    group_id = await _create_group(client, owner_headers)
    await _create_event(client, owner_headers, group_id)

    r = await client.get(
        f"/api/events?group_id={group_id}", headers=other_headers
    )
    assert r.status_code == 403


async def test_get_event_non_member_forbidden(client: AsyncClient) -> None:
    owner_headers = await _login(client, "owner")
    other_headers = await _login(client, "outsider")
    group_id = await _create_group(client, owner_headers)
    event_id = await _create_event(client, owner_headers, group_id)

    r = await client.get(
        f"/api/events/{event_id}", headers=other_headers
    )
    assert r.status_code == 403


async def test_update_event_by_creator(client: AsyncClient) -> None:
    headers = await _login(client, "owner")
    group_id = await _create_group(client, headers)
    event_id = await _create_event(client, headers, group_id)

    r = await client.put(
        f"/api/events/{event_id}",
        json={
            "name": "Updated League",
            "uma_1st": 50,
            "uma_2nd": 20,
            "uma_3rd": -20,
            "uma_4th": -50,
        },
        headers=headers,
    )
    assert r.status_code == 200
    assert r.json()["name"] == "Updated League"


async def test_update_event_by_other_forbidden(client: AsyncClient) -> None:
    owner_headers = await _login(client, "owner")
    other_headers = await _login(client, "other")
    group_id = await _create_group(client, owner_headers)
    event_id = await _create_event(client, owner_headers, group_id)

    r = await client.put(
        f"/api/events/{event_id}",
        json={
            "name": "Hacked",
            "uma_1st": 50,
            "uma_2nd": 20,
            "uma_3rd": -20,
            "uma_4th": -50,
        },
        headers=other_headers,
    )
    assert r.status_code == 403


async def test_delete_event_by_creator(client: AsyncClient) -> None:
    headers = await _login(client, "owner")
    group_id = await _create_group(client, headers)
    event_id = await _create_event(client, headers, group_id)

    r = await client.delete(f"/api/events/{event_id}", headers=headers)
    assert r.status_code == 204


async def test_delete_event_by_other_forbidden(client: AsyncClient) -> None:
    owner_headers = await _login(client, "owner")
    other_headers = await _login(client, "other")
    group_id = await _create_group(client, owner_headers)
    event_id = await _create_event(client, owner_headers, group_id)

    r = await client.delete(f"/api/events/{event_id}", headers=other_headers)
    assert r.status_code == 403


async def test_update_event_by_admin_allowed(client: AsyncClient) -> None:
    owner_headers = await _login(client, "owner")
    admin_headers = await _login(client, "admin_user")
    group_id = await _create_group(client, owner_headers)
    event_id = await _create_event(client, owner_headers, group_id)

    # Join and promote to admin
    await client.post(f"/api/groups/{group_id}/join", headers=admin_headers)
    detail_r = await client.get(
        f"/api/groups/{group_id}", headers=owner_headers
    )
    admin_id = next(
        m["id"] for m in detail_r.json()["members"]
        if m["username"] == "admin_user"
    )
    await client.put(
        f"/api/groups/{group_id}/members/{admin_id}/role",
        json={"role": "admin"},
        headers=owner_headers,
    )

    r = await client.put(
        f"/api/events/{event_id}",
        json={"name": "Admin Updated"},
        headers=admin_headers,
    )
    assert r.status_code == 200
    assert r.json()["name"] == "Admin Updated"


async def test_delete_event_by_owner_of_other_creator(
    client: AsyncClient,
) -> None:
    owner_headers = await _login(client, "owner")
    admin_headers = await _login(client, "admin_user")
    group_id = await _create_group(client, owner_headers)

    # Join and promote to admin, then admin creates event
    await client.post(f"/api/groups/{group_id}/join", headers=admin_headers)
    detail_r = await client.get(
        f"/api/groups/{group_id}", headers=owner_headers
    )
    admin_id = next(
        m["id"] for m in detail_r.json()["members"]
        if m["username"] == "admin_user"
    )
    await client.put(
        f"/api/groups/{group_id}/members/{admin_id}/role",
        json={"role": "admin"},
        headers=owner_headers,
    )

    event_id = await _create_event(client, admin_headers, group_id)

    # Owner deletes admin's event
    r = await client.delete(f"/api/events/{event_id}", headers=owner_headers)
    assert r.status_code == 204


async def test_update_event_by_member_forbidden(client: AsyncClient) -> None:
    owner_headers = await _login(client, "owner")
    member_headers = await _login(client, "member")
    group_id = await _create_group(client, owner_headers)
    event_id = await _create_event(client, owner_headers, group_id)
    await client.post(f"/api/groups/{group_id}/join", headers=member_headers)

    r = await client.put(
        f"/api/events/{event_id}",
        json={"name": "Hacked"},
        headers=member_headers,
    )
    assert r.status_code == 403


async def test_delete_event_by_member_forbidden(client: AsyncClient) -> None:
    owner_headers = await _login(client, "owner")
    member_headers = await _login(client, "member")
    group_id = await _create_group(client, owner_headers)
    event_id = await _create_event(client, owner_headers, group_id)
    await client.post(f"/api/groups/{group_id}/join", headers=member_headers)

    r = await client.delete(f"/api/events/{event_id}", headers=member_headers)
    assert r.status_code == 403


async def test_create_event_by_member_forbidden(client: AsyncClient) -> None:
    owner_headers = await _login(client, "owner")
    member_headers = await _login(client, "member")
    group_id = await _create_group(client, owner_headers)
    await client.post(f"/api/groups/{group_id}/join", headers=member_headers)

    payload = {**_EVENT_PAYLOAD, "group_id": group_id}
    r = await client.post("/api/events", json=payload, headers=member_headers)
    assert r.status_code == 403


async def test_create_event_by_non_member_forbidden(client: AsyncClient) -> None:
    owner_headers = await _login(client, "owner")
    other_headers = await _login(client, "outsider")
    group_id = await _create_group(client, owner_headers)

    payload = {**_EVENT_PAYLOAD, "group_id": group_id}
    r = await client.post("/api/events", json=payload, headers=other_headers)
    assert r.status_code == 403


async def test_create_event_by_admin_allowed(client: AsyncClient) -> None:
    owner_headers = await _login(client, "owner")
    admin_headers = await _login(client, "admin_user")
    group_id = await _create_group(client, owner_headers)
    await client.post(f"/api/groups/{group_id}/join", headers=admin_headers)

    # Promote to admin: get member id
    detail_r = await client.get(
        f"/api/groups/{group_id}", headers=owner_headers
    )
    admin_id = next(
        m["id"] for m in detail_r.json()["members"]
        if m["username"] == "admin_user"
    )
    await client.put(
        f"/api/groups/{group_id}/members/{admin_id}/role",
        json={"role": "admin"},
        headers=owner_headers,
    )

    payload = {**_EVENT_PAYLOAD, "group_id": group_id}
    r = await client.post("/api/events", json=payload, headers=admin_headers)
    assert r.status_code == 201


async def test_create_independent_event(client: AsyncClient) -> None:
    headers = await _login(client, "owner")
    group_id = await _create_group(client, headers)
    payload = {
        **_EVENT_PAYLOAD,
        "group_id": group_id,
        "name": "Practice Match",
        "event_type": "independent",
    }

    r = await client.post("/api/events", json=payload, headers=headers)
    assert r.status_code == 201
    data = r.json()
    assert data["event_type"] == "independent"


# --- Event Type Change Tests ---


async def test_change_event_type_regular_to_independent(
    client: AsyncClient,
) -> None:
    headers = await _login(client, "owner")
    group_id = await _create_group(client, headers)
    event_id = await _create_event(client, headers, group_id)

    r = await client.put(
        f"/api/events/{event_id}",
        json={"event_type": "independent"},
        headers=headers,
    )
    assert r.status_code == 200
    assert r.json()["event_type"] == "independent"


async def test_change_event_type_independent_to_regular(
    client: AsyncClient,
) -> None:
    headers = await _login(client, "owner")
    group_id = await _create_group(client, headers)
    payload = {
        **_EVENT_PAYLOAD,
        "group_id": group_id,
        "event_type": "independent",
    }
    r = await client.post("/api/events", json=payload, headers=headers)
    event_id = r.json()["id"]
    assert r.json()["event_type"] == "independent"

    r = await client.put(
        f"/api/events/{event_id}",
        json={"event_type": "regular"},
        headers=headers,
    )
    assert r.status_code == 200
    assert r.json()["event_type"] == "regular"


# --- Close Event Tests ---


async def test_close_event_success(client: AsyncClient) -> None:
    """Owner closes an event -> 200, is_closed=True."""
    headers = await _login(client, "owner")
    group_id = await _create_group(client, headers)
    event_id = await _create_event(client, headers, group_id)

    r = await client.post(f"/api/events/{event_id}/close", headers=headers)
    assert r.status_code == 200
    assert r.json()["is_closed"] is True


async def test_close_event_already_closed(client: AsyncClient) -> None:
    """Closing an already closed event -> 400."""
    headers = await _login(client, "owner")
    group_id = await _create_group(client, headers)
    event_id = await _create_event(client, headers, group_id)

    await client.post(f"/api/events/{event_id}/close", headers=headers)
    r = await client.post(f"/api/events/{event_id}/close", headers=headers)
    assert r.status_code == 400


async def test_close_event_non_admin_forbidden(client: AsyncClient) -> None:
    """Non-admin member tries to close -> 403."""
    owner_headers = await _login(client, "owner")
    member_headers = await _login(client, "member_user")
    group_id = await _create_group(client, owner_headers)
    event_id = await _create_event(client, owner_headers, group_id)

    # member joins the group
    await client.post(f"/api/groups/{group_id}/join", headers=member_headers)

    r = await client.post(f"/api/events/{event_id}/close", headers=member_headers)
    assert r.status_code == 403


async def test_update_closed_event_blocked(client: AsyncClient) -> None:
    """Updating a closed event -> 400."""
    headers = await _login(client, "owner")
    group_id = await _create_group(client, headers)
    event_id = await _create_event(client, headers, group_id)

    await client.post(f"/api/events/{event_id}/close", headers=headers)

    r = await client.put(
        f"/api/events/{event_id}",
        json={"name": "Should Fail"},
        headers=headers,
    )
    assert r.status_code == 400


async def test_create_game_record_closed_event_blocked(client: AsyncClient) -> None:
    """Adding a game record to a closed event -> 400."""
    # Register 4 players
    creds = [{"username": f"p{i}", "password": "password123"} for i in range(1, 5)]
    ids = []
    for c in creds:
        reg_r = await client.post("/api/auth/register", json=c)
        ids.append(reg_r.json()["id"])
    login_r = await client.post("/api/auth/login", json=creds[0])
    headers = {"Authorization": f"Bearer {login_r.json()['access_token']}"}

    group_r = await client.post("/api/groups", json=_GROUP_PAYLOAD, headers=headers)
    group_id = group_r.json()["id"]

    event_id = await _create_event(client, headers, group_id)

    # Close the event
    await client.post(f"/api/events/{event_id}/close", headers=headers)

    # Try to add a game record
    record_payload = {
        "east_player_id": ids[0],
        "south_player_id": ids[1],
        "west_player_id": ids[2],
        "north_player_id": ids[3],
        "east_point": 40000,
        "south_point": 30000,
        "west_point": 20000,
        "north_point": 10000,
        "group_id": group_id,
        "event_id": event_id,
    }
    r = await client.post("/api/game-records", json=record_payload, headers=headers)
    assert r.status_code == 400
