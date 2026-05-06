import json
import logging
import asyncio
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.extractor import ExtractedDocument, ExtractionRule, ExtractionAlert, DocumentFieldValue
from app.services.ai.llm_provider import llm_service

logger = logging.getLogger(__name__)

class RulesEngine:
    def evaluate_condition(self, cond: Dict[str, Any], field_map: Dict[str, str], doc_map: Dict[str, Any]) -> bool:
        field_name = cond.get("field", "")
        # Buscar en campos extraídos o en atributos del documento
        raw_value = str(field_map.get(field_name, doc_map.get(field_name, "")))
        
        operator = cond.get("operator", "==") # El UI usa ==
        target = str(cond.get("value", ""))
        
        value = raw_value.lower()
        target = target.lower()

        try:
            if operator == "==":
                return value == target
            elif operator == "!=":
                return value != target
            elif operator == "contains":
                return target in value
            elif operator == ">":
                return float(value) > float(target)
            elif operator == "<":
                return float(value) < float(target)
        except Exception as e:
            logger.error(f"[RulesEngine] Error evaluating condition: {e}")
            return False
            
        return False

    async def apply_rules(self, db: Session, document_id: int) -> int:
        doc = db.query(ExtractedDocument).filter(ExtractedDocument.id == document_id).first()
        if not doc:
            return 0
        
        rules = db.query(ExtractionRule).filter(
            ExtractionRule.project_id == doc.project_id,
            ExtractionRule.is_active == True
        ).all()
        
        if not rules:
            return 0
            
        # Preparar datos para evaluación
        field_values = db.query(DocumentFieldValue).filter(DocumentFieldValue.document_id == document_id).all()
        field_map = {f.field_name: (f.normalized_value or f.raw_value or "") for f in field_values}
        doc_map = {
            "status": doc.status,
            "doc_type_id": str(doc.doc_type_id),
            "classification_confidence": doc.classification_confidence,
            "page_count": doc.page_count
        }
        
        triggered_count = 0
        
        for rule in rules:
            try:
                matched = False
                
                if rule.logic_type == "llm" and rule.prompt:
                    # Lógica basada en IA
                    system_prompt = "Actúa como un validador de documentos legales. Analiza el texto y responde ÚNICAMENTE con la palabra 'SI' o 'NO'."
                    user_prompt = f"REGLA: {rule.prompt}\n\nDOCUMENTO:\n{doc.ocr_text[:6000]}"
                    
                    try:
                        # Obtenemos el proveedor de los settings del proyecto o default
                        response = await llm_service.complete(
                            db=db,
                            provider="openai", # Default por ahora, luego puede ser dinámico
                            model="gpt-4o",
                            messages=[
                                {"role": "system", "content": system_prompt},
                                {"role": "user", "content": user_prompt}
                            ]
                        )
                        matched = "SI" in response.upper()
                    except Exception as e:
                        logger.error(f"Error in LLM Rule {rule.id}: {e}")
                        continue
                else:
                    # Lógica simple basada en atributos
                    conditions = json.loads(rule.condition_json or "[]")
                    if not conditions:
                        continue
                        
                    results = [self.evaluate_condition(c, field_map, doc_map) for c in conditions]
                    matched = all(results)

                if matched:
                    # Evitar duplicados
                    existing = db.query(ExtractionAlert).filter(
                        ExtractionAlert.document_id == document_id,
                        ExtractionAlert.rule_id == rule.id
                    ).first()
                    
                    if not existing:
                        alert = ExtractionAlert(
                            document_id=document_id,
                            rule_id=rule.id,
                            rule_name=rule.name,
                            severity=rule.severity,
                            message=rule.description or rule.name
                        )
                        db.add(alert)
                        triggered_count += 1
            
            except Exception as e:
                logger.error(f"[RulesEngine] Error applying rule {rule.id}: {e}")
                
        db.commit()
        return triggered_count

rules_engine = RulesEngine()
