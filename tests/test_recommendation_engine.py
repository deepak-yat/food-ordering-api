from types import SimpleNamespace

from app.services.recommendation_engine import apply_diversity, score_candidate


def candidate(category_name="Biryani"):
    return SimpleNamespace(category_name=category_name)


def test_content_affinity_drives_personalized_explanation():
    score, reason = score_candidate(
        item=candidate("Biryani"),
        category_affinity={"biryani": 3},
        popularity_count=0,
        max_popularity=10,
        rating_info=None,
        has_personalization=True,
    )

    assert score == 0.55
    assert reason == "Based on your orders in Biryani"


def test_rating_with_fewer_than_three_reviews_does_not_affect_score_or_reason():
    score_without_rating, reason_without_rating = score_candidate(
        item=candidate("Biryani"),
        category_affinity={},
        popularity_count=1,
        max_popularity=10,
        rating_info=None,
        has_personalization=True,
    )
    score_with_insufficient_rating, reason_with_insufficient_rating = score_candidate(
        item=candidate("Biryani"),
        category_affinity={},
        popularity_count=1,
        max_popularity=10,
        rating_info={"average_rating": 5.0, "review_count": 2},
        has_personalization=True,
    )

    assert score_with_insufficient_rating == score_without_rating
    assert reason_with_insufficient_rating == reason_without_rating == "Popular on Foodly"


def test_cold_start_uses_popularity_only_even_if_item_is_highly_rated():
    score_without_rating, reason_without_rating = score_candidate(
        item=candidate("Biryani"),
        category_affinity={"biryani": 100},
        popularity_count=2,
        max_popularity=10,
        rating_info=None,
        has_personalization=False,
    )
    score_with_rating, reason_with_rating = score_candidate(
        item=candidate("Biryani"),
        category_affinity={"biryani": 100},
        popularity_count=2,
        max_popularity=10,
        rating_info={"average_rating": 5.0, "review_count": 100},
        has_personalization=False,
    )

    assert score_with_rating == score_without_rating == 0.06
    assert reason_with_rating == reason_without_rating == "Popular on Foodly"


def test_rating_dominant_pick_gets_rating_explanation():
    score, reason = score_candidate(
        item=candidate("Biryani"),
        category_affinity={},
        popularity_count=1,
        max_popularity=10,
        rating_info={"average_rating": 5.0, "review_count": 20},
        has_personalization=True,
    )

    assert score == 0.18
    assert reason == "Highly rated by other customers"


def test_popularity_explanation_when_popularity_outweighs_small_affinity():
    score, reason = score_candidate(
        item=candidate("Biryani"),
        category_affinity={"biryani": 1},
        popularity_count=10,
        max_popularity=10,
        rating_info=None,
        has_personalization=True,
    )

    assert score == 0.48333333333333334
    assert reason == "Popular on Foodly"


def test_diversity_caps_shop_and_backfills_from_ranked_candidates():
    ranked = [
        {"item_id": item_id, "shop_id": 1, "category_name": f"category-{item_id}"}
        for item_id in range(1, 11)
    ] + [
        {"item_id": 11, "shop_id": 2, "category_name": "biryani"},
        {"item_id": 12, "shop_id": 3, "category_name": "mandi"},
    ]

    selected = apply_diversity(ranked, limit=5, max_per_shop=3, max_per_category=4)

    assert [item["item_id"] for item in selected] == [1, 2, 3, 11, 12]
    assert sum(item["shop_id"] == 1 for item in selected) == 3


def test_diversity_caps_category_across_shops():
    ranked = [
        {"item_id": item_id, "shop_id": item_id, "category_name": "Biryani"}
        for item_id in range(1, 7)
    ] + [
        {"item_id": 7, "shop_id": 7, "category_name": "Mandi"},
    ]

    selected = apply_diversity(ranked, limit=6, max_per_shop=3, max_per_category=4)

    assert [item["item_id"] for item in selected] == [1, 2, 3, 4, 7]


def test_diversity_returns_empty_for_non_positive_limit():
    assert apply_diversity([], limit=0) == []
