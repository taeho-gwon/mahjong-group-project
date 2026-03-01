from httpx import AsyncClient

_GROUP_PAYLOAD = {
    "name": "Test Group",
    "join_policy": "public",
}

_CONTEST_PAYLOAD = {
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
    await client.post("/auth/register", json=creds)
    r = await client.post("/auth/login", json=creds)
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


async def _create_group(client: AsyncClient, headers: dict[str, str]) -> int:
    r = await client.post("/groups", json=_GROUP_PAYLOAD, headers=headers)
    return r.json()["id"]


async def _create_contest(
    client: AsyncClient, headers: dict[str, str], group_id: int
) -> int:
    payload = {**_CONTEST_PAYLOAD, "group_id": group_id}
    r = await client.post("/contests", json=payload, headers=headers)
    return r.json()["id"]


async def test_create_contest_success(client: AsyncClient) -> None:
    headers = await _login(client, "owner")
    group_id = await _create_group(client, headers)
    payload = {**_CONTEST_PAYLOAD, "group_id": group_id}

    r = await client.post("/contests", json=payload, headers=headers)
    assert r.status_code == 201
    assert r.json()["name"] == "Spring League"


async def test_create_contest_unauthorized(client: AsyncClient) -> None:
    headers = await _login(client, "owner")
    group_id = await _create_group(client, headers)
    payload = {**_CONTEST_PAYLOAD, "group_id": group_id}

    r = await client.post("/contests", json=payload)
    assert r.status_code == 401


async def test_list_contests_by_group(client: AsyncClient) -> None:
    headers = await _login(client, "owner")
    group_id = await _create_group(client, headers)
    await _create_contest(client, headers, group_id)

    r = await client.get(f"/contests?group_id={group_id}")
    assert r.status_code == 200
    assert len(r.json()) >= 1


async def test_update_contest_by_creator(client: AsyncClient) -> None:
    headers = await _login(client, "owner")
    group_id = await _create_group(client, headers)
    contest_id = await _create_contest(client, headers, group_id)

    r = await client.put(
        f"/contests/{contest_id}",
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


async def test_update_contest_by_other_forbidden(client: AsyncClient) -> None:
    owner_headers = await _login(client, "owner")
    other_headers = await _login(client, "other")
    group_id = await _create_group(client, owner_headers)
    contest_id = await _create_contest(client, owner_headers, group_id)

    r = await client.put(
        f"/contests/{contest_id}",
        json={
            "name": "Hacked",
            "uma_1st": 50,
            "uma_2nd": 20,
            "uma_3rd": -20,
            "uma_4th": -50,
        },  # noqa: E501
        headers=other_headers,
    )
    assert r.status_code == 403


async def test_delete_contest_by_creator(client: AsyncClient) -> None:
    headers = await _login(client, "owner")
    group_id = await _create_group(client, headers)
    contest_id = await _create_contest(client, headers, group_id)

    r = await client.delete(f"/contests/{contest_id}", headers=headers)
    assert r.status_code == 204


async def test_delete_contest_by_other_forbidden(client: AsyncClient) -> None:
    owner_headers = await _login(client, "owner")
    other_headers = await _login(client, "other")
    group_id = await _create_group(client, owner_headers)
    contest_id = await _create_contest(client, owner_headers, group_id)

    r = await client.delete(f"/contests/{contest_id}", headers=other_headers)
    assert r.status_code == 403


async def test_create_overall_contest_directly_forbidden(client: AsyncClient) -> None:
    headers = await _login(client, "owner")
    group_id = await _create_group(client, headers)
    payload = {**_CONTEST_PAYLOAD, "group_id": group_id, "contest_type": "overall"}

    r = await client.post("/contests", json=payload, headers=headers)
    assert r.status_code == 400


async def test_delete_overall_contest_forbidden(client: AsyncClient) -> None:
    headers = await _login(client, "owner")
    group_id = await _create_group(client, headers)

    # 그룹 생성 시 overall contest가 자동 생성됨
    list_r = await client.get(f"/contests?group_id={group_id}")
    overall = next(c for c in list_r.json() if c["contest_type"] == "overall")

    r = await client.delete(f"/contests/{overall['id']}", headers=headers)
    assert r.status_code == 400
