from datetime import datetime,timedelta,timezone

from jose import JWTError,  jwt

SECRET_KEY="FAMW39RUQvakeurr347gbgqaghJGQ49UGTQGH4graseghsr5hT0UQ4TYU5OWYTWGTKLfaergaswore4gjharg478FGHKLQUGHO8W7ghashrbws45t5R4GHLAQOGYWOP54GY8QOGHQP348Y7G"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTE = 30

def create_access_token(user_id:int,role:str) -> str:
    expire=datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTE
    )
    payload={
        "sub":str(user_id),
        "role":role,
        "exp":expire
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

def decode_access_token(token:str):
    try:
        return jwt.decode (
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )
    except JWTError:
        return "An error occured"