from app.models.offer import Offer
from app.services.offer_pricing import (
    offer_unit_price,
    best_offer,
)


def test_percentage_offer():
    price = offer_unit_price(
        effective_unit=200,
        has_variant=False,
        discount_type="PERCENTAGE",
        discount_value=20,
    )

    assert price == 160.00


def test_fixed_price_offer():
    price = offer_unit_price(
        effective_unit=200,
        has_variant=False,
        discount_type="FIXED_PRICE",
        discount_value=150,
    )

    assert price == 150.00


def test_fixed_price_does_not_apply_to_replace_variant():
    price = offer_unit_price(
        effective_unit=250,
        has_variant=True,
        discount_type="FIXED_PRICE",
        discount_value=150,
    )

    assert price == 250.00


def test_percentage_offer_applies_to_variant_price():
    price = offer_unit_price(
        effective_unit=250,
        has_variant=True,
        discount_type="PERCENTAGE",
        discount_value=20,
    )

    assert price == 200.00


def test_offer_never_increases_price():
    price = offer_unit_price(
        effective_unit=100,
        has_variant=False,
        discount_type="FIXED_PRICE",
        discount_value=150,
    )

    assert price == 100.00


def test_best_offer_selects_lowest_resulting_price():
    offer_1 = Offer(
        offer_id=1,
        shop_id=1,
        title="10 Percent",
        discount_type="PERCENTAGE",
        discount_value=10,
        start_at=None,
        end_at=None,
    )

    offer_2 = Offer(
        offer_id=2,
        shop_id=1,
        title="Fixed 80",
        discount_type="FIXED_PRICE",
        discount_value=80,
        start_at=None,
        end_at=None,
    )

    selected, price = best_offer(
        effective_unit=100,
        has_variant=False,
        offers=[offer_1, offer_2],
    )

    assert selected.offer_id == 2
    assert price == 80.00


def test_best_offer_tie_uses_lowest_offer_id():
    offer_1 = Offer(
        offer_id=10,
        shop_id=1,
        title="Offer 10",
        discount_type="FIXED_PRICE",
        discount_value=80,
        start_at=None,
        end_at=None,
    )

    offer_2 = Offer(
        offer_id=5,
        shop_id=1,
        title="Offer 5",
        discount_type="FIXED_PRICE",
        discount_value=80,
        start_at=None,
        end_at=None,
    )

    selected, price = best_offer(
        effective_unit=100,
        has_variant=False,
        offers=[offer_1, offer_2],
    )

    assert selected.offer_id == 5
    assert price == 80.00