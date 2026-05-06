
from app.db.session import engine
from sqlalchemy import inspect

def check_schema():
    inspector = inspect(engine)
    columns = inspector.get_columns('doc_types')
    print("Columns in 'doc_types' table:")
    for column in columns:
        print(f" - {column['name']} ({column['type']})")

if __name__ == "__main__":
    check_schema()
