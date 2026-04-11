from decimal import Decimal

import pytest
from httpx import AsyncClient

from app.services.pricing_service import calc_total, calc_unit_price, get_discount_label


class TestPricingService:
    def test_thermal_base_price(self):
        price = calc_unit_price("Thermal", "Matte", "None", "Single Side")
        assert price == Decimal("2.50")

    def test_inkjet_base_price(self):
        price = calc_unit_price("Inkjet", "Matte", "None", "Single Side")
        assert price == Decimal("1.20")

    def test_glossy_surcharge(self):
        price = calc_unit_price("Thermal", "Glossy", "None", "Single Side")
        assert price == Decimal("2.80")

    def test_metallic_surcharge(self):
        price = calc_unit_price("Thermal", "Metallic", "None", "Single Side")
        assert price == Decimal("3.30")

    def test_rfid_surcharge(self):
        price = calc_unit_price("Thermal", "Matte", "RFID", "Single Side")
        assert price == Decimal("4.00")

    def test_led_surcharge(self):
        price = calc_unit_price("Thermal", "Matte", "LED", "Single Side")
        assert price == Decimal("4.50")

    def test_both_sides_surcharge(self):
        price = calc_unit_price("Thermal", "Matte", "None", "Both Sides")
        assert price == Decimal("2.90")

    def test_all_surcharges(self):
        # Thermal(2.5) + Metallic(0.8) + LED(2.0) + Both Sides(0.4) = 5.70
        price = calc_unit_price("Thermal", "Metallic", "LED", "Both Sides")
        assert price == Decimal("5.70")

    def test_no_discount_under_50(self):
        total = calc_total(Decimal("2.50"), 10)
        assert total == Decimal("25.00")

    def test_7_percent_discount_at_50(self):
        total = calc_total(Decimal("2.50"), 50)
        # 2.50 * 50 * 0.93 = 116.25
        assert total == Decimal("116.25")

    def test_12_percent_discount_at_100(self):
        total = calc_total(Decimal("5.70"), 100)
        # 5.70 * 100 * 0.88 = 501.60
        assert total == Decimal("501.60")

    def test_18_percent_discount_at_200(self):
        total = calc_total(Decimal("2.50"), 200)
        # 2.50 * 200 * 0.82 = 410.00
        assert total == Decimal("410.00")

    def test_25_percent_discount_at_500(self):
        total = calc_total(Decimal("2.50"), 500)
        # 2.50 * 500 * 0.75 = 937.50
        assert total == Decimal("937.50")

    def test_discount_labels(self):
        assert get_discount_label(10) == ""
        assert get_discount_label(50) == "7% OFF"
        assert get_discount_label(100) == "12% OFF"
        assert get_discount_label(200) == "18% OFF"
        assert get_discount_label(500) == "25% OFF"


@pytest.mark.asyncio
async def test_pricing_endpoint(client: AsyncClient):
    resp = await client.post("/api/pricing/calculate", json={
        "printer": "Thermal",
        "finish": "Metallic",
        "chip_type": "LED",
        "print_side": "Both Sides",
        "quantity": 100,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["unit_price"] == 5.70
    assert data["total_price"] == 501.60
    assert data["discount_label"] == "12% OFF"
