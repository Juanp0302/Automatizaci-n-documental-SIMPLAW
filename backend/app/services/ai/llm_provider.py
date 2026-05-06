import os
import json
from typing import List, Dict, Optional, Any
from openai import OpenAI
from anthropic import Anthropic
from sqlalchemy.orm import Session
from app.models.extractor import ExtractorSetting

class LLMProvider:
    _instance = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _get_api_key(self, db: Session, key_name: str) -> str:
        # 1. Check in database settings
        setting = db.query(ExtractorSetting).filter(ExtractorSetting.key == key_name).first()
        if setting and setting.value:
            return setting.value
        
        # 2. Check in environment variables
        env_val = os.getenv(key_name.upper())
        if env_val:
            return env_val
        
        return ""

    def _get_openai_client(self, db: Session, provider: str = "openai") -> OpenAI:
        key_name = "openai_api_key" if provider == "openai" else "kimi_api_key"
        base_url = "https://api.moonshot.cn/v1" if provider == "kimi" else None
        
        api_key = self._get_api_key(db, key_name)
        if not api_key:
            name = "OpenAI" if provider == "openai" else "Kimi (Moonshot)"
            raise ValueError(f"{name} API key not configured.")
        
        return OpenAI(api_key=api_key, base_url=base_url)

    def _get_anthropic_client(self, db: Session) -> Anthropic:
        api_key = self._get_api_key(db, "anthropic_api_key")
        if not api_key:
            raise ValueError("Anthropic (Claude) API key not configured.")
        
        return Anthropic(api_key=api_key)

    async def complete(
        self,
        db: Session,
        provider: str,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.0,
        json_mode: bool = False
    ) -> str:
        if provider in ["openai", "kimi"]:
            client = self._get_openai_client(db, provider)
            response_format = {"type": "json_object"} if json_mode else None
            
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                response_format=response_format,
                max_tokens=4000 # Aumentado para permitir extracciones largas
            )
            return response.choices[0].message.content or ""
            
        elif provider == "anthropic":
            client = self._get_anthropic_client(db)
            
            system_msg = next((m["content"] for m in messages if m["role"] == "system"), None)
            user_messages = [m for m in messages if m["role"] != "system"]
            
            response = client.messages.create(
                model=model,
                max_tokens=4096,
                temperature=temperature,
                system=system_msg,
                messages=user_messages
            )
            
            return response.content[0].text if response.content else ""
        
        raise ValueError(f"Unsupported LLM provider: {provider}")

llm_service = LLMProvider.get_instance()
