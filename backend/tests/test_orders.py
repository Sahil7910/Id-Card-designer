import pytest
from httpx import AsyncClient


ORDER_PAYLOAD = {
    "items": [
        {
            "card_type": "Company",
            "printer": "Thermal",
            "print_side": "Single Side",
            "orientation": "Horizontal",
            "chip_type": "None",
            "finish": "Matte",
            "material": "PVC Plastic",
            "quantity": 100,
            "front_field_count": 5,
            "back_field_count": 0,
        }
    ],
    "shipping": {
        "first_name": "John",
        "last_name": "Doe",
        "email": "john@example.com",
        "phone": "+1234567890",
        "address1": "123 Main St",
        "city": "New York",
        "state": "NY",
        "zip": "10001",
        "country": "United States",
    },
    "shipping_method": "standard",
    "payment_method": "card",
}


@pytest.mark.asyncio
async def test_place_order(client: AsyncClient, auth_headers: dict):
    resp = await client.post("/api/orders/", json=ORDER_PAYLOAD, headers=auth_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["order_number"].startswith("ORD-")
    assert data["status"] == "confirmed"
    assert data["total_cards"] == 100
    assert len(data["items"]) == 1
    # Verify server-side pricing: Thermal + Matte + None + Single Side = $2.50
    # 100 qty = 12% discount: 2.50 * 100 * 0.88 = $220.00
    assert data["items"][0]["unit_price"] == 2.50
    assert data["items"][0]["total_price"] == 220.00


@pytest.mark.asyncio
async def test_list_orders(client: AsyncClient, auth_headers: dict):
    await client.post("/api/orders/", json=ORDER_PAYLOAD, headers=auth_headers)

    resp = await client.get("/api/orders/", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) >= 1


@pytest.mark.asyncio
async def test_get_order(client: AsyncClient, auth_headers: dict):
    create_resp = await client.post("/api/orders/", json=ORDER_PAYLOAD, headers=auth_headers)
    order_id = create_resp.json()["id"]

    resp = await client.get(f"/api/orders/{order_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["order_number"].startswith("ORD-")


@pytest.mark.asyncio
async def test_order_requires_auth(client: AsyncClient):
    resp = await client.post("/api/orders/", json=ORDER_PAYLOAD)
    assert resp.status_code == 403
