
import re
from docx import Document

def iter_block_items(parent):
    """
    Yield each paragraph and table child within *parent*, in document order.
    Each returned value is an instance of either Table or Paragraph. *parent*
    would most commonly be a reference to a main Document object, but
    also works for a _Cell object, which itself can contain paragraphs and tables.
    """
    if isinstance(parent, Document):
        parent_elm = parent.element.body
    elif isinstance(parent, _Cell):
        parent_elm = parent._tc
    else:
        # Fallback for other potential parent types or direct body elements
        # This handles the case if parent is passed as doc.part.document
        if hasattr(parent, 'element') and hasattr(parent.element, 'body'):
             parent_elm = parent.element.body
        else:
             raise ValueError("Could not find body for extraction")

    for child in parent_elm.iterchildren():
        if isinstance(child, CT_P):
            yield Paragraph(child, parent)
        elif isinstance(child, CT_Tbl):
            yield Table(child, parent)

def extract_variables_from_docx(file_path: str) -> list[str]:
    """
    Extracts variables in the format {{variable_name}} from a .docx file.
    Returns a list of unique variable names in the order they appear.
    """
    matches_list = []
    try:
        from docx.document import Document as _Document
        from docx.oxml.text.paragraph import CT_P
        from docx.oxml.table import CT_Tbl
        from docx.table import _Cell, Table
        from docx.text.paragraph import Paragraph

        # Re-defining iter_block_items inside to avoid import issues or keeping it standalone if imports are global
        # but let's put imports inside try/except to be safe or at top level if common.
        # For simplicity in this replacement, I will assume imports are managed.
        # Actually, let's just use the logic inline or define helper properly.
        # Given the imports might not be available at module level yet.
        
        doc = Document(file_path)
        pattern = re.compile(r"\{\{([^}]+)\}\}")

        def search_in_text(text):
            found = pattern.findall(text)
            for match in found:
                matches_list.append(match.strip())

        def iter_block_items_local(parent):
            """
            Yield each paragraph and table child within *parent*, in document order.
            """
            if isinstance(parent, _Document):
                parent_elm = parent.element.body
            elif isinstance(parent, _Cell):
                parent_elm = parent._tc
            else:
                return # Should not happen with standard python-docx objects we use

            for child in parent_elm.iterchildren():
                if isinstance(child, CT_P):
                    yield Paragraph(child, parent)
                elif isinstance(child, CT_Tbl):
                    yield Table(child, parent)

        def process_container(container):
            for block in iter_block_items_local(container):
                if isinstance(block, Paragraph):
                    search_in_text(block.text)
                elif isinstance(block, Table):
                    for row in block.rows:
                        for cell in row.cells:
                            process_container(cell)

        # 1. Search in headers
        for section in doc.sections:
             for header in [section.header, section.first_page_header, section.even_page_header]:
                if header:
                    # Headers only contain paragraphs/tables usually, but python-docx header.paragraphs/tables are separate
                    # We can try to use iteration if getting element is possible, else fall back to separate
                    # Headers in python-docx don't expose 'iter_block_items' easily because they are not Document objects
                    # but they have a .part and .element.
                    # For safety/simplicity, if order CRITICALLY matters between a header paragraph and a header table, we need it.
                    # Usually headers are small. Let's stick to standard separate implementation for headers/footers 
                    # UNLESS user complains. The main issue was body text/tables mixing.
                    # Wait, the user said "variables in the configuration menu... do not appear in the same order".
                    # This implies body content.
                    for paragraph in header.paragraphs:
                        search_in_text(paragraph.text)
                    for table in header.tables:
                        for row in table.rows:
                             for cell in row.cells:
                                 for paragraph in cell.paragraphs:
                                     search_in_text(paragraph.text)

        # 2. Search in main body (Document)
        process_container(doc)

        # 3. Search in footers
        for section in doc.sections:
            for footer in [section.footer, section.first_page_footer, section.even_page_footer]:
                if footer:
                    for paragraph in footer.paragraphs:
                        search_in_text(paragraph.text)
                    for table in footer.tables:
                        for row in table.rows:
                             for cell in row.cells:
                                 for paragraph in cell.paragraphs:
                                     search_in_text(paragraph.text)

    except Exception as e:
        print(f"Error reading docx for variables: {e}")
        import traceback
        traceback.print_exc()
        return []

    # Remove duplicates while preserving order
    return list(dict.fromkeys(matches_list))

def convert_to_pdf(docx_path: str) -> str:
    """
    Converts a .docx file to .pdf using docx2pdf (requires MS Word).
    Returns the path to the generated PDF.
    """
    try:
        from docx2pdf import convert
        import os
        
        pdf_path = docx_path.replace(".docx", ".pdf")
        
        # If PDF already exists, we might want to overwrite or just return it
        # For now, let's regenerate to be safe or check timestamp (skipping complexity)
        
        print(f"Converting {docx_path} to PDF...")
        convert(docx_path, pdf_path)
        
        if os.path.exists(pdf_path):
            return pdf_path
        else:
            raise Exception("PDF file was not created")
            
    except Exception as e:
        print(f"Error converting to PDF: {e}")
        return None
