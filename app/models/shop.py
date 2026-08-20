from sqlmodel import Field,SQLModel

class Shop(SQLModel,table=True):

    __tablename__ = "shops"

    shop_id : int | None = Field(
        default=None,
        primary_key=True
        )
    
    shop_name: str
    description : str | None =  None

    owner_user_id : int = Field(
        foreign_key="users.user_id",
        unique=True,
        index=True
    )

    is_approved :bool = Field(
        default=False)
    is_active :bool = Field(
        default=False )