
import os
import sys
import win32com.client
import pythoncom

# Paths
docx_path = os.path.abspath("test_doc.docx")
pdf_path = os.path.abspath("test_doc.pdf")

print(f"DOCX Path: {docx_path}")
print(f"PDF Path: {pdf_path}")

if not os.path.exists(docx_path):
    print("Error: DOCX file not found!")
    sys.exit(1)

try:
    pythoncom.CoInitialize()
    word = win32com.client.Dispatch("Word.Application")
    word.Visible = False
    
    print("Word Application dispatched.")
    
    try:
        doc = word.Documents.Open(docx_path)
        print(f"Document opened: {doc}")
        
        # wdFormatPDF = 17
        doc.SaveAs(pdf_path, FileFormat=17)
        print("Document saved as PDF.")
        
        doc.Close()
        print("Document closed.")
    except Exception as e:
        print(f"Error during document operations: {e}")
        import traceback
        traceback.print_exc()
    finally:
        word.Quit()
        print("Word application quit.")
        
except Exception as e:
    print(f"Error initializing Word: {e}")
    import traceback
    traceback.print_exc()
finally:
    try:
        pythoncom.CoUninitialize()
    except:
        pass
