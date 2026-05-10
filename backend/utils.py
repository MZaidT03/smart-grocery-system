# utils.py
from werkzeug.security import generate_password_hash, check_password_hash
import hashlib

def hash_password(password: str) -> str:
    # Use pbkdf2:sha256 for secure hashing
    return generate_password_hash(password)

def verify_password(stored_hash: str, password: str) -> bool:
    try:
        # Check if it's the new werkzeug format
        if check_password_hash(stored_hash, password):
            return True
    except ValueError:
        pass
    
    # Fallback to old sha256 method for existing users
    old_hash = hashlib.sha256(password.encode()).hexdigest()
    return stored_hash == old_hash

def safe_float(val, default=0.0):
    try:
        return float(val)
    except (TypeError, ValueError):
        return default