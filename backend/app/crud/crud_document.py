from typing import List

from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.document import Document
from app.schemas.document import DocumentCreate, DocumentUpdate


class CRUDDocument(CRUDBase[Document, DocumentCreate, DocumentUpdate]):
    def create_with_owner(
        self, db: Session, *, obj_in: DocumentCreate, owner_id: int
    ) -> Document:
        obj_in_data = jsonable_encoder(obj_in)
        db_obj = self.model(**obj_in_data, user_id=owner_id)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_multi_filtered(
        self,
        db: Session,
        *,
        skip: int = 0,
        limit: int = 100,
        search: str = None,
        start_date: 'datetime' = None,
        end_date: 'datetime' = None,
        owner_id: int = None
    ) -> List[Document]:
        query = db.query(self.model)
        
        if owner_id:
            query = query.filter(Document.user_id == owner_id)
        
        if search:
            query = query.filter(Document.title.ilike(f"%{search}%"))
        
        if start_date:
            query = query.filter(Document.created_at >= start_date)
            
        if end_date:
            query = query.filter(Document.created_at <= end_date)
            
        return (
            query
            .order_by(Document.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_multi_by_owner(
        self,
        db: Session,
        *,
        owner_id: int,
        skip: int = 0,
        limit: int = 100,
        search: str = None,
        start_date: 'datetime' = None,
        end_date: 'datetime' = None
    ) -> List[Document]:
        return self.get_multi_filtered(
            db, 
            owner_id=owner_id, 
            skip=skip, 
            limit=limit, 
            search=search, 
            start_date=start_date, 
            end_date=end_date
        )


document = CRUDDocument(Document)
