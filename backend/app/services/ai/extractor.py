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
        # Enviar TODO el texto disponible (hasta 60K caracteres para documentos legales extensos)
        truncated_text = text[:60000]
        doc_type_hint = doc_type.prompt_hint or ""

        prompt_system = (
            f"Eres un experto en extracción de información de documentos legales y administrativos colombianos. {doc_type_hint}\n\n"
            "INSTRUCCIONES CRÍTICAS:\n"
            "1. Lee el documento COMPLETO antes de responder. No te detengas en las primeras páginas.\n"
            "2. Para CADA campo solicitado, busca en TODO el documento, incluyendo encabezados, pies de página, firmas, considerandos, artículos y resuelve.\n"
            "3. Si un campo aparece varias veces en el documento (ej. número de resolución en el encabezado y en el cuerpo), usa el valor del ENCABEZADO o la primera aparición oficial.\n"
            "4. Para campos de texto largo (cargos, hechos, fundamentos), extrae el contenido COMPLETO, NO resumas.\n"
            "5. Para fechas: usa formato YYYY-MM-DD.\n"
            "6. Para números: usa solo dígitos.\n"
            "7. Para montos/valores: incluye el número sin signos de pesos ni separadores de miles.\n"
            "8. Si un campo NO se encuentra en el documento, devuelve el valor como null, confianza 0.0, y en source escribe 'No encontrado en el documento'.\n"
            "9. NUNCA inventes información. Si no estás seguro, pon confianza baja (0.3 o menos).\n\n"
            "Campos a extraer:\n"
            f"{field_list_str}\n\n"
            "Responde ÚNICAMENTE con JSON válido en este formato exacto:\n"
            "{\"campos\": [{\"name\": \"nombre_campo\", \"value\": \"valor extraído o null\", \"confidence\": 0.95, \"source\": \"fragmento del texto donde se encontró\"}]}\n\n"
            "IMPORTANTE: Devuelve TODOS los campos solicitados, incluso si no los encontraste (con value: null)."
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

            # Crear un set de campos ya procesados para detectar los que faltan (insensible a mayúsculas/minúsculas)
            processed_field_names = set()

            for item in extracted_items:
                # Buscar el campo correspondiente de forma case-insensitive
                item_name = item.get("name")
                if not item_name:
                    continue
                
                field = next((f for f in fields if f.name.lower() == item_name.lower()), None)
                if not field:
                    continue
                
                processed_field_names.add(field.name.lower())
                val = item.get("value")
                
                # Si el valor es null/vacío, registrar como "No encontrado"
                if val is None or val == "" or val == "null":
                    results.append({
                        "field_id": field.id,
                        "field_name": field.name,
                        "field_label": field.label,
                        "raw_value": "No encontrado",
                        "confidence": 0.0,
                        "source_text": item.get("source", "No encontrado en el documento")
                    })
                    continue

                results.append({
                    "field_id": field.id,
                    "field_name": field.name,
                    "field_label": field.label,
                    "raw_value": str(val),
                    "confidence": min(1.0, max(0.0, float(item.get("confidence", 0.0)))),
                    "source_text": item.get("source")
                })
            
            # Agregar campos que el LLM no devolvió en absoluto (case-insensitive)
            for field in fields:
                if field.name.lower() not in processed_field_names:
                    results.append({
                        "field_id": field.id,
                        "field_name": field.name,
                        "field_label": field.label,
                        "raw_value": "No encontrado",
                        "confidence": 0.0,
                        "source_text": "El modelo no devolvió este campo"
                    })

            return results

        except Exception as e:
            logger.error(f"[Extractor] Error: {e}")
            return []

extractor_service = ExtractorService()
