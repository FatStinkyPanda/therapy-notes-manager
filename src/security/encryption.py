import bcrypt

class Encryption:
    @staticmethod
    def hash_password(password: str) -> bytes:
        """Hashes a password using bcrypt."""
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    @staticmethod
    def check_password(password: str, hashed: bytes) -> bool:
        """Checks a password against a hashed version."""
        return bcrypt.checkpw(password.encode('utf-8'), hashed)
