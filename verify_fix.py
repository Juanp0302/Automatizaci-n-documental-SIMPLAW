import sys
import os

# Add backend path to sys.path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.schemas.extractor import ExtractorProjectUpdate

def test_schema():
    print("Testing ExtractorProjectUpdate schema...")
    try:
        data = {"root_folder": "C:\\Documents\\Test", "file_mode": "move"}
        update = ExtractorProjectUpdate(**data)
        print(f"Success! Model dump: {update.model_dump(exclude_unset=True)}")
        if update.root_folder == "C:\\Documents\\Test" and update.file_mode == "move":
            print("Verification PASSED: root_folder and file_mode are accepted.")
        else:
            print("Verification FAILED: Fields not set correctly.")
    except Exception as e:
        print(f"Verification FAILED with error: {e}")

if __name__ == "__main__":
    test_schema()
