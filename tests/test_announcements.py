from httpx import AsyncClient

from app.models.announcement import Announcement
from tests.conftest import TestSessionLocal


async def _create_announcement(title: str, content: str, is_active: bool = True) -> int:
    async with TestSessionLocal() as session:
        ann = Announcement(title=title, content=content, is_active=is_active)
        session.add(ann)
        await session.commit()
        await session.refresh(ann)
        return ann.id


async def test_list_announcements_empty(client: AsyncClient) -> None:
    r = await client.get("/api/announcements")
    assert r.status_code == 200
    assert r.json() == []


async def test_list_announcements_with_data(client: AsyncClient) -> None:
    await _create_announcement("Title 1", "Content 1")
    await _create_announcement("Title 2", "Content 2")

    r = await client.get("/api/announcements")
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 2


async def test_list_announcements_excludes_inactive(client: AsyncClient) -> None:
    await _create_announcement("Active", "Content")
    await _create_announcement("Inactive", "Content", is_active=False)

    r = await client.get("/api/announcements")
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 1
    assert data[0]["title"] == "Active"


async def test_list_announcements_pagination(client: AsyncClient) -> None:
    for i in range(3):
        await _create_announcement(f"Ann {i}", f"Content {i}")

    r = await client.get("/api/announcements?page=1&size=2")
    assert r.status_code == 200
    assert len(r.json()) == 2

    r = await client.get("/api/announcements?page=2&size=2")
    assert r.status_code == 200
    assert len(r.json()) == 1


async def test_get_announcement_success(client: AsyncClient) -> None:
    ann_id = await _create_announcement("Test Title", "Test Content")

    r = await client.get(f"/api/announcements/{ann_id}")
    assert r.status_code == 200
    data = r.json()
    assert data["id"] == ann_id
    assert data["title"] == "Test Title"
    assert data["content"] == "Test Content"
    assert data["is_active"] is True


async def test_get_announcement_not_found(client: AsyncClient) -> None:
    r = await client.get("/api/announcements/99999")
    assert r.status_code == 404


async def test_announcements_no_auth_required(client: AsyncClient) -> None:
    """Both list and get endpoints should work without authentication."""
    ann_id = await _create_announcement("Public", "No auth needed")

    r = await client.get("/api/announcements")
    assert r.status_code == 200

    r = await client.get(f"/api/announcements/{ann_id}")
    assert r.status_code == 200
