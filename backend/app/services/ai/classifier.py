import json
import logging
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from app.services.ai.llm_provider import llm_service
from app.models.extractor import DocType

logger = logging.getLogger(__name__)

def safe_parse_json_list(val: Any) -> List[str]:
    if isinstance(val, list):
        return val
    if not isinstance(val, str):
        return []
    try:
        parsed = json.loads(val)
        if isinstance(parsed, list):
            return parsed
        return [str(parsed)]
    except:
        return []

class ClassifierService:
    async def classify(
        self,
        db: Session,
        text: str,
        doc_types: List[DocType],
        provider: str,
        model: str
    ) -> Tuple[Optional[int], float]:
        if not doc_types:
            return None, 0.0
        if not text or len(text.strip()) < 10:
            return None, 0.0

        # Preparar la lista de tipos para el prompt
        type_list = []
        for i, dt in enumerate(doc_types):
            aliases = safe_parse_json_list(dt.aliases)
            alias_str = f" (también conocido como: {', '.join(aliases)})" if aliases else ""
            
            # Añadir descripción e instrucciones (prompts) si existen
            info_parts = []
            if dt.description:
                info_parts.append(f"Descripción: {dt.description}")
            if dt.prompt_hint:
                info_parts.append(f"Instrucciones: {dt.prompt_hint}")
            
            info_str = f" — {' | '.join(info_parts)}" if info_parts else ""
            type_list.append(f"{i + 1}. \"{dt.name}\"{alias_str}{info_str}")
        
        type_str = "\n".join(type_list)
        truncated_text = text[:3000]

        prompt_system = (
            "Eres un sistema de clasificación documental experto. "
            "Debes clasificar el documento en UNO de los tipos documentales disponibles y devolver una confianza del 0.0 al 1.0. "
            "Si el documento no encaja claramente en ningún tipo, usa el tipo que más se aproxime o el tipo 'Otro'. "
            "Responde ÚNICAMENTE con JSON en el formato: {\"tipo\": \"nombre exacto del tipo\", \"confianza\": 0.0}"
        )

        prompt_user = (
            f"Tipos documentales disponibles:\n{type_str}\n\n"
            f"Texto del documento:\n{truncated_text}\n\n"
            "Clasifica este documento."
        )

        try:
            content = await llm_service.complete(
                db=db,
                provider=provider,
                messages=[
                    {"role": "system", "content": prompt_system},
                    {"role": "user", "content": prompt_user}
                ],
                model=model,
                temperature=0.0,
                json_mode=(provider != "anthropic")
            )

            # Limpiar y parsear JSON
            clean_content = content.replace("```json", "").replace("```", "").strip()
            parsed = json.loads(clean_content)
            
            tipo_candidato = str(parsed.get("tipo", "")).strip().lower()
            confidence = float(parsed.get("confianza", 0.0))
            confidence = min(1.0, max(0.0, confidence))

            # Buscar el match en nuestra lista
            match = None
            for dt in doc_types:
                name = dt.name.lower()
                aliases = [a.lower() for a in safe_parse_json_list(dt.aliases)]
                if name == tipo_candidato or tipo_candidato in aliases:
                    match = dt
                    break
            
            if match:
                return match.id, confidence
            else:
                # Si no hay match exacto, devolvemos el último (suele ser 'Otro') con confianza baja
                return doc_types[-1].id, min(confidence, 0.4)

        except Exception as e:
            logger.error(f"[Classifier] Error: {e}")
            return None, 0.0

classifier_service = ClassifierService()
