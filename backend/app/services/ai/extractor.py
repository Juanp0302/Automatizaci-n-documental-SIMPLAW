import json
import logging
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from app.services.ai.llm_provider import llm_service
from app.models.extractor import DocField, DocType

logger = logging.getLogger(__name__)

def safe_parse_json_list(val: Any) -> List[Any]:
    if isinstance(val, list):
        return val
    if not isinstance(val, str):
        return []
    try:
        parsed = json.loads(val)
        if isinstance(parsed, list):
            return parsed
        return []
    except:
        return []

class ExtractorService:
    async def extract_fields(
        self,
        db: Session,
        text: str,
        fields: List[DocField],
        doc_type: DocType,
        provider: str,
        model: str
    ) -> List[Dict[str, Any]]:
        if not text or not fields:
            return []

        # Construir la lista de campos para el prompt
        field_specs = []
        for f in fields:
            spec = f"- \"{f.name}\" ({f.label}): tipo {f.field_type}"
            if f.is_required:
                spec += " [OBLIGATORIO]"
            
            enum_vals = safe_parse_json_list(f.enum_values)
            if enum_vals:
                spec += f" — valores posibles: {', '.join(map(str, enum_vals))}"
            
            if f.prompt_hint:
                spec += f" — instrucción: {f.prompt_hint}"
            
            field_specs.append(spec)
        
        field_list_str = "\n".join(field_specs)
        truncated_text = text[:30000] # Aumentado significativamente para cubrir documentos legales largos
        doc_type_hint = doc_type.prompt_hint or ""

        prompt_system = (
            f"Eres un experto en extracción de información de documentos legales y administrativos. {doc_type_hint}\n\n"
            "Tu tarea es extraer los campos solicitados del documento de forma EXHAUSTIVA y PRECISA.\n"
            "REGLA CRÍTICA: Para campos de texto largo (como cargos, hechos o fundamentos), NO resumas. Extrae el contenido completo y detallado tal como aparece en el texto.\n\n"
            "Para cada campo devuelve:\n"
            "- el valor extraído (exactamente como aparece o normalizado si es fecha/número)\n"
            "- una confianza de 0.0 a 1.0\n"
            "- el fragmento de texto (source) que soporta el valor\n\n"
            "Si no encuentras un valor, usa null. Para fechas usa YYYY-MM-DD. Para números usa solo dígitos.\n\n"
            "Campos a extraer:\n"
            f"{field_list_str}\n\n"
            "Responde ÚNICAMENTE con JSON en el formato:\n"
            "{\"campos\": [{\"name\": \"nombre_campo\", \"value\": \"valor\", \"confidence\": 0.0, \"source\": \"...\"}]}"
        )

        try:
            content = await llm_service.complete(
                db=db,
                provider=provider,
                messages=[
                    {"role": "system", "content": prompt_system},
                    {"role": "user", "content": f"Texto del documento:\n{truncated_text}"}
                ],
                model=model,
                temperature=0.0,
                json_mode=(provider != "anthropic")
            )

            # Limpiar y parsear JSON
            clean_content = content.replace("```json", "").replace("```", "").strip()
            parsed = json.loads(clean_content)
            
            extracted_items = parsed.get("campos", [])
            results = []

            for item in extracted_items:
                # Buscar el campo correspondiente en nuestra lista
                field = next((f for f in fields if f.name == item.get("name")), None)
                if not field:
                    continue
                
                val = item.get("value")
                if val is None or val == "" or val == "null":
                    continue

                results.append({
                    "field_id": field.id,
                    "field_name": field.name,
                    "field_label": field.label,
                    "raw_value": str(val),
                    "confidence": min(1.0, max(0.0, float(item.get("confidence", 0.0)))),
                    "source_text": item.get("source")
                })
            
            return results

        except Exception as e:
            logger.error(f"[Extractor] Error: {e}")
            return []

extractor_service = ExtractorService()
