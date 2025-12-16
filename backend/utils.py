# utils.py
import hashlib

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def safe_float(val, default=0.0):
    try:
        return float(val)
    except (TypeError, ValueError):
        return default