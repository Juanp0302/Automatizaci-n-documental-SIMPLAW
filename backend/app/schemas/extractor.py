from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict

# --- Project ---
class ExtractorProjectBase(BaseModel):
    name: str
    client: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = "active"
    root_folder: Optional[str] = None
    file_mode: Optional[str] = "analyze"
    connector_ocr: Optional[str] = "azure_di"
    connector_llm: Optional[str] = "openai"
    llm_classify_model: Optional[str] = "gpt-4o-mini"
    llm_extract_model: Optional[str] = "gpt-4o"
    confidence_threshold: Optional[float] = 0.7
    auto_process: Optional[bool] = True

class ExtractorProjectCreate(ExtractorProjectBase):
    pass

class ExtractorProjectUpdate(BaseModel):
    name: Optional[str] = None
    client: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    root_folder: Optional[str] = None
    file_mode: Optional[str] = None
    connector_ocr: Optional[str] = None
    connector_llm: Optional[str] = None
    llm_classify_model: Optional[str] = None
    llm_extract_model: Optional[str] = None
    confidence_threshold: Optional[float] = None
    auto_process: Optional[bool] = None

class ExtractorProject(ExtractorProjectBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

# --- DocField ---
class DocFieldBase(BaseModel):
    name: str
    label: str
    field_type: str = "text"
    is_required: bool = False
    is_multi: bool = False
    aliases: Optional[str] = "[]"
    enum_values: Optional[str] = "[]"
    prompt_hint: Optional[str] = None
    excel_column: Optional[str] = None
    sort_order: int = 0

class DocFieldCreate(DocFieldBase):
    pass

class DocField(DocFieldBase):
    id: int
    doc_type_id: int
    model_config = ConfigDict(from_attributes=True)

# --- DocType ---
class DocTypeBase(BaseModel):
    name: str
    aliases: Optional[str] = "[]"
    description: Optional[str] = None
    prompt_hint: Optional[str] = None
    color: Optional[str] = "#3b82f6"
    sort_order: int = 0

class DocTypeCreate(DocTypeBase):
    fields: List[DocFieldCreate] = []

class DocType(DocTypeBase):
    id: int
    project_id: int
    fields: List[DocField] = []
    model_config = ConfigDict(from_attributes=True)

# --- DocumentFieldValue ---
class DocumentFieldValueBase(BaseModel):
    field_name: str
    field_label: str
    raw_value: Optional[str] = None
    normalized_value: Optional[str] = None
    confidence: Optional[float] = None
    is_manual: Optional[bool] = False
    source_text: Optional[str] = None

class DocumentFieldValue(DocumentFieldValueBase):
    id: int
    document_id: int
    field_id: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)

# --- ExtractedDocument ---
class ExtractedDocumentBase(BaseModel):
    file_path: str
    file_name: str
    file_ext: Optional[str] = None
    file_size: Optional[int] = None
    status: str = "pending"

class ExtractedDocument(ExtractedDocumentBase):
    id: int
    project_id: int
    doc_type_id: Optional[int] = None
    classification_confidence: Optional[float] = None
    ocr_text: Optional[str] = None
    page_count: Optional[int] = None
    review_status: Optional[str] = "none"
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    field_values: List[DocumentFieldValue] = []
    model_config = ConfigDict(from_attributes=True)


# --- Rules ---
class ExtractionRuleBase(BaseModel):
    name: str
    description: Optional[str] = None
    doc_type_id: Optional[int] = None
    logic_type: str = "simple"
    condition_json: Optional[str] = None
    prompt: Optional[str] = None
    action_type: str = "alert"
    severity: str = "warning"
    is_active: bool = True

class ExtractionRuleCreate(ExtractionRuleBase):
    pass

class ExtractionRuleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    doc_type_id: Optional[int] = None
    logic_type: Optional[str] = None
    condition_json: Optional[str] = None
    prompt: Optional[str] = None
    action_type: Optional[str] = None
    severity: Optional[str] = None
    is_active: Optional[bool] = None

class ExtractionRule(ExtractionRuleBase):
    id: int
    project_id: int
    model_config = ConfigDict(from_attributes=True)

class ExtractionAlertBase(BaseModel):
    rule_name: str
    severity: str
    message: Optional[str] = None
    is_resolved: bool = False

class ExtractionAlert(ExtractionAlertBase):
    id: int
    document_id: int
    rule_id: Optional[int] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Settings ---
class ExtractorSettingBase(BaseModel):
    key: str
    value: str

class ExtractorSettingCreate(ExtractorSettingBase):
    pass

class ExtractorSetting(ExtractorSettingBase):
    id: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)

# --- Actions ---
class DocumentReviewUpdate(BaseModel):
    status: str

class ProcessBatchRequest(BaseModel):
    file_paths: List[str]
    project_id: int
