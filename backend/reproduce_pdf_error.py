
import os
import sys
from docx2pdf import convert

# Use the same path structure as the app
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMP_DIR = os.path.join(BASE_DIR, "app", "temp")
os.makedirs(TEMP_DIR, exist_ok=True)

docx_path = os.path.join(TEMP_DIR, "test_preview.docx")
pdf_path = os.path.join(TEMP_DIR, "test_preview.pdf")

# Create a dummy docx if it doesn't exist
if not os.path.exists(docx_path):
    from docx import Document
    doc = Document()
    doc.add_paragraph("Hello World")
    doc.save(docx_path)

print(f"Converting {docx_path} to {pdf_path}")
print(f"Abs DOCX: {os.path.abspath(docx_path)}")
print(f"Abs PDF: {os.path.abspath(pdf_path)}")

try:
    convert(os.path.abspath(docx_path), os.path.abspath(pdf_path))
    print("Conversion successful")
except Exception as e:
    print(f"Conversion failed: {e}")
    import traceback
    traceback.print_exc()
