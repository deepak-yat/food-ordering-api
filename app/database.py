
from sqlmodel import SQLModel, Session, create_engine


DATABASE_URL = (
    "postgresql+psycopg://postgres:postgres@localhost/food_ordering"
)


engine = create_engine(
    DATABASE_URL,
    echo=True
)


def get_db():
    with Session(engine) as session:
        yield session