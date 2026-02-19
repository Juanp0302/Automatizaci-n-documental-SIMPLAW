import bcrypt

try:
    print("Hashing 'admin' with bcrypt directly...")
    password = b"admin"
    hashed = bcrypt.hashpw(password, bcrypt.gensalt())
    print(f"Hash: {hashed.decode('utf-8')}")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
