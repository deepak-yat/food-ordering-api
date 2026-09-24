import re
import secrets

from sqlmodel import Session, select

from app.models.user import User


def generate_unique_username(
    db: Session,
    email: str,
    name: str,
) -> str:
    base = re.sub(
        r"[^a-z0-9]",
        "",
        email.split("@")[0].lower(),
    )

    if not base:
        base = (
            re.sub(
                r"[^a-z0-9]",
                "",
                (name or "").lower(),
            )
            or "user"
        )

    candidate = base

    for _ in range(5):
        existing_user = db.exec(
            select(User).where(
                User.user_name == candidate
            )
        ).first()

        if existing_user is None:
            return candidate

        candidate = f"{base}{secrets.token_hex(2)}"

    return f"{base}{secrets.token_hex(4)}" 