from sqlmodel import Field, SQLModel


class MenuItemReviewTag(SQLModel, table=True):
    __tablename__ = "menu_item_review_tags"

    review_id: int = Field(
        foreign_key="menu_item_reviews.review_id",
        primary_key=True,
        index=True,
    )

    tag: str = Field(
        primary_key=True,
        max_length=40,
    )