import bcrypt

# App policy: 8–24 characters (well under bcrypt's 72-byte limit)
MAX_PASSWORD_LENGTH = 24


def _password_bytes(password: str) -> bytes:
    return password.encode("utf-8")


def hash_password(password: str) -> str:
    return bcrypt.hashpw(_password_bytes(password), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            _password_bytes(plain_password),
            hashed_password.encode("utf-8"),
        )
    except (ValueError, TypeError):
        return False
