import os
import fitz  # PyMuPDF
from typing import Dict, Any, Tuple
from azure.ai.formrecognizer import DocumentAnalysisClient
from azure.core.credentials import AzureKeyCredential
from sqlalchemy.orm import Session
from app.models.extractor import ExtractorSetting

class OCRService:
    _instance = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _get_setting(self, db: Session, key_name: str) -> str:
        setting = db.query(ExtractorSetting).filter(ExtractorSetting.key == key_name).first()
        if setting and setting.value:
            return setting.value
        return os.getenv(key_name.upper(), "")

    def extract_text_from_pdf_local(self, file_path: str) -> Tuple[str, int]:
        """Extrae texto usando PyMuPDF (fitz). Bueno para PDFs digitales."""
        try:
            doc = fitz.open(file_path)
            text_parts = []
            for page in doc:
                text_parts.append(page.get_text())
            text = "\n".join(text_parts).strip()
            page_count = len(doc)
            doc.close()
            return text, page_count
        except Exception as e:
            print(f"[OCR] Local extraction failed: {e}")
            return "", 0

    async def extract_text_with_azure(self, db: Session, file_path: str) -> Tuple[str, int]:
        """Extrae texto usando Azure Form Recognizer. Necesario para documentos escaneados."""
        endpoint = self._get_setting(db, "azure_di_endpoint")
        key = self._get_setting(db, "azure_di_key")

        if not endpoint or not key:
            print("[OCR] Azure DI not configured.")
            return "", 0

        try:
            client = DocumentAnalysisClient(endpoint, AzureKeyCredential(key))
            with open(file_path, "rb") as f:
                poller = client.begin_analyze_document("prebuilt-read", document=f)
                result = poller.result()
            
            text = result.content or ""
            page_count = len(result.pages) if result.pages else 1
            return text, page_count
        except Exception as e:
            print(f"[OCR] Azure DI failed: {e}")
            return "", 0

    async def get_text(self, db: Session, file_path: str) -> Dict[str, Any]:
        """
        Estrategia híbrida: intenta local primero, si hay poco texto, usa Azure.
        """
        ext = os.path.splitext(file_path)[1].lower()
        
        if ext == ".pdf":
            text, page_count = self.extract_text_from_pdf_local(file_path)
            
            # Si hay más de 50 caracteres por página, asumimos que es digital y suficiente
            if len(text) > (page_count * 50):
                return {
                    "text": text,
                    "page_count": page_count,
                    "provider": "pymupdf"
                }
            
            # De lo contrario, intentar con Azure
            azure_text, azure_pages = await self.extract_text_with_azure(db, file_path)
            if azure_text:
                return {
                    "text": azure_text,
                    "page_count": azure_pages,
                    "provider": "azure_di"
                }
            
            # Si Azure falla o no está configurado, devolvemos lo que sacó fitz (aunque sea poco)
            return {
                "text": text,
                "page_count": page_count,
                "provider": "pymupdf"
            }

        elif ext in [".png", ".jpg", ".jpeg", ".tiff", ".tif"]:
            text, page_count = await self.extract_text_with_azure(db, file_path)
            return {
                "text": text,
                "page_count": page_count,
                "provider": "azure_di"
            }
            
        return {"text": "", "page_count": 1, "provider": "none"}

ocr_service = OCRService.get_instance()
