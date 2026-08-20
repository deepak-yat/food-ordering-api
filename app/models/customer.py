from sqlmodel import SQLModel,Field

class Customer(SQLModel,table=True):
    __tablename__="customers"

    customer_id : int | None=Field(
        default=None,
        primary_key=True
    )

    user_id : int = Field(
        foreign_key="users.user_id",
        unique=True,
        index=True
    )
    
    customer_name : str

    phone : str | None =  None
