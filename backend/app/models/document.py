from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    generated_file_path = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user_id = Column(Integer, ForeignKey("users.id"))
    template_id = Column(Integer, ForeignKey("templates.id"))
    
    # Versioning
    version = Column(Integer, default=1)
    parent_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    
    # Relationships
    # Self-referential relationship (Adjacency List)
    children = relationship(
        "Document", 
        cascade="all, delete-orphan",
        back_populates="parent"
    )

    parent = relationship(
        "Document", 
        remote_side=[id], 
        back_populates="children"
    )



    user = relationship("User", backref="documents")
    template = relationship("Template", backref="documents")
