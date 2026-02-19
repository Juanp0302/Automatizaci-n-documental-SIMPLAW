import bcrypt

password = b"admin"
try:
    hashed = bcrypt.hashpw(password, bcrypt.gensalt())
    print(f"Generated hash: {hashed.decode('utf-8')}")
except Exception as e:
    print(f"Error: {e}")
