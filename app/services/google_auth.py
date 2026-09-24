import os

from dotenv import load_dotenv
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests


load_dotenv()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

if not GOOGLE_CLIENT_ID:
    raise RuntimeError("GOOGLE_CLIENT_ID is not set")


def verify_google_id_token(token: str) -> dict:
    """Verify a Google ID token and return its verified claims."""

    claims = google_id_token.verify_oauth2_token(
        token,
        google_requests.Request(),
        GOOGLE_CLIENT_ID,
    )

    if not claims.get("email_verified", False):
        raise ValueError("Google email is not verified")

    return claims