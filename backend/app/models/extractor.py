from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class ExtractorProject(Base):
    __tablename__ = "extractor_projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    client = Column(String, nullable=True)
    description = Column(String, nullable=True)
    status = Column(String, default="active") # active, archived
    root_folder = Column(String, nullable=True)
    file_mode = Column(String, default="analyze") # analyze, move, copy
    
    # Configuración de IA por proyecto
    connector_ocr = Column(String, default="azure_di")
    connector_llm = Column(String, default="openai")
    llm_classify_model = Column(String, default="gpt-4o-mini")
    llm_extract_model = Column(String, default="gpt-4o")
    confidence_threshold = Column(Float, default=0.7)
    auto_process = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner_id = Column(Integer, ForeignKey("users.id"))
    
    # Relationships
    doc_types = relationship("DocType", back_populates="project", cascade="all, delete-orphan")
    documents = relationship("ExtractedDocument", back_populates="project", cascade="all, delete-orphan")
    rules = relationship("ExtractionRule", back_populates="project", cascade="all, delete-orphan")

class DocType(Base):
    __tablename__ = "doc_types"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("extractor_projects.id", ondelete="CASCADE"))
    name = Column(String, nullable=False)
    aliases = Column(Text, default="[]") # JSON list of aliases
    description = Column(String, nullable=True)
    prompt_hint = Column(Text, nullable=True)
    color = Column(String, default="#3b82f6")
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    project = relationship("ExtractorProject", back_populates="doc_types")
    fields = relationship("DocField", back_populates="doc_type", cascade="all, delete-orphan")
    documents = relationship("ExtractedDocument", back_populates="doc_type")

class DocField(Base):
    __tablename__ = "doc_fields"

    id = Column(Integer, primary_key=True, index=True)
    doc_type_id = Column(Integer, ForeignKey("doc_types.id", ondelete="CASCADE"))
    name = Column(String, nullable=False) # internal name (slug)
    label = Column(String, nullable=False) # display name
    field_type = Column(String, default="text") # text, number, date, enum, boolean
    is_required = Column(Boolean, default=False)
    is_multi = Column(Boolean, default=False)
    aliases = Column(Text, default="[]") # JSON list
    enum_values = Column(Text, default="[]") # JSON list
    prompt_hint = Column(Text, nullable=True)
    excel_column = Column(String, nullable=True)
    sort_order = Column(Integer, default=0)

    # Relationships
    doc_type = relationship("DocType", back_populates="fields")

class ExtractedDocument(Base):
    __tablename__ = "extracted_documents"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("extractor_projects.id", ondelete="CASCADE"))
    file_path = Column(String, nullable=False)
    file_name = Column(String, nullable=False)
    file_ext = Column(String, nullable=True)
    file_size = Column(Integer, nullable=True)
    file_hash = Column(String, index=True)
    file_modified = Column(DateTime, nullable=True)
    page_count = Column(Integer, nullable=True)
    
    status = Column(String, default="pending") # pending, processing, completed, error
    doc_type_id = Column(Integer, ForeignKey("doc_types.id"), nullable=True)
    classification_confidence = Column(Float, nullable=True)
    
    ocr_text = Column(Text, nullable=True)
    ocr_provider = Column(String, nullable=True)
    llm_provider = Column(String, nullable=True)
    
    dest_path = Column(String, nullable=True)
    review_status = Column(String, default="none") # none, approved, rejected
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    project = relationship("ExtractorProject", back_populates="documents")
    doc_type = relationship("DocType", back_populates="documents")
    field_values = relationship("DocumentFieldValue", back_populates="document", cascade="all, delete-orphan")
    alerts = relationship("ExtractionAlert", back_populates="document", cascade="all, delete-orphan")

class DocumentFieldValue(Base):
    __tablename__ = "document_field_values"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("extracted_documents.id", ondelete="CASCADE"))
    field_id = Column(Integer, ForeignKey("doc_fields.id"), nullable=True)
    field_name = Column(String, nullable=False)
    field_label = Column(String, nullable=False)
    raw_value = Column(Text, nullable=True)
    normalized_value = Column(Text, nullable=True)
    confidence = Column(Float, nullable=True)
    is_manual = Column(Boolean, default=False)
    source_text = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    document = relationship("ExtractedDocument", back_populates="field_values")

class ExtractionRule(Base):
    __tablename__ = "extraction_rules"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("extractor_projects.id", ondelete="CASCADE"))
    doc_type_id = Column(Integer, ForeignKey("doc_types.id", ondelete="SET NULL"), nullable=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    logic_type = Column(String, default="simple") # simple, math, llm
    condition_json = Column(Text, default="[]") # JSON logic
    prompt = Column(Text, nullable=True) # For LLM rules
    action_type = Column(String, default="alert") # alert, field_update
    severity = Column(String, default="warning") # info, warning, error
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    project = relationship("ExtractorProject", back_populates="rules")
    doc_type = relationship("DocType")

class ExtractionAlert(Base):
    __tablename__ = "extraction_alerts"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("extracted_documents.id", ondelete="CASCADE"))
    rule_id = Column(Integer, ForeignKey("extraction_rules.id"), nullable=True)
    rule_name = Column(String, nullable=False)
    severity = Column(String, default="info")
    message = Column(Text, nullable=True)
    is_resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    document = relationship("ExtractedDocument", back_populates="alerts")

class ExtractorSetting(Base):
    __tablename__ = "extractor_settings"

    key = Column(String, primary_key=True)
    value = Column(Text, nullable=True)
