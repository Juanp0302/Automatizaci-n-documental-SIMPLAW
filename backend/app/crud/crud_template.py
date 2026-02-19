from typing import List
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.template import Template
from app.schemas.template import TemplateCreate, TemplateUpdate

class CRUDTemplate(CRUDBase[Template, TemplateCreate, TemplateUpdate]):
    def create_with_owner(
        self, db: Session, *, obj_in: TemplateCreate, owner_id: int
    ) -> Template:
        obj_in_data = jsonable_encoder(obj_in)
        if obj_in_data.get("variables_schema"):
            import json
            obj_in_data["variables_schema"] = json.dumps(obj_in_data["variables_schema"])
        db_obj = self.model(**obj_in_data, owner_id=owner_id)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self, db: Session, *, db_obj: Template, obj_in: TemplateUpdate | dict
    ) -> Template:
        obj_data = jsonable_encoder(db_obj)
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)
            
        if update_data.get("variables_schema") is not None and not isinstance(update_data["variables_schema"], str):
             import json
             update_data["variables_schema"] = json.dumps(update_data["variables_schema"])

        return super().update(db, db_obj=db_obj, obj_in=update_data)

    def get_multi_by_owner(
        self, db: Session, *, owner_id: int, skip: int = 0, limit: int = 100
    ) -> List[Template]:
        return (
            db.query(self.model)
            .filter(Template.owner_id == owner_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

template = CRUDTemplate(Template)
