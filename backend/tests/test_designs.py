import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_design(client: AsyncClient, auth_headers: dict):
    resp = await client.post("/api/designs/", json={
        "name": "My Card",
        "printer": "Thermal",
        "card_type": "Company",
        "front_fields": [{"id": "f1", "type": "name", "label": "Full Name", "x": 20, "y": 30, "width": 180, "height": 24}],
        "back_fields": [],
    }, headers=auth_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "My Card"
    assert len(data["front_fields"]) == 1


@pytest.mark.asyncio
async def test_list_designs(client: AsyncClient, auth_headers: dict):
    # Create a design first
    await client.post("/api/designs/", json={"name": "Card 1"}, headers=auth_headers)

    resp = await client.get("/api/designs/", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) >= 1


@pytest.mark.asyncio
async def test_get_design(client: AsyncClient, auth_headers: dict):
    create_resp = await client.post("/api/designs/", json={"name": "Fetch Me"}, headers=auth_headers)
    design_id = create_resp.json()["id"]

    resp = await client.get(f"/api/designs/{design_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["name"] == "Fetch Me"


@pytest.mark.asyncio
async def test_update_design(client: AsyncClient, auth_headers: dict):
    create_resp = await client.post("/api/designs/", json={"name": "Old Name"}, headers=auth_headers)
    design_id = create_resp.json()["id"]

    resp = await client.put(f"/api/designs/{design_id}", json={"name": "New Name"}, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["name"] == "New Name"


@pytest.mark.asyncio
async def test_delete_design(client: AsyncClient, auth_headers: dict):
    create_resp = await client.post("/api/designs/", json={"name": "Delete Me"}, headers=auth_headers)
    design_id = create_resp.json()["id"]

    resp = await client.delete(f"/api/designs/{design_id}", headers=auth_headers)
    assert resp.status_code == 204

    resp = await client.get(f"/api/designs/{design_id}", headers=auth_headers)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_design_requires_auth(client: AsyncClient):
    resp = await client.get("/api/designs/")
    assert resp.status_code == 403
