from __future__ import annotations

from typing import Any, Optional

from openai import AsyncOpenAI

from app.core.config import settings
from app.schemas.chat import IntentInfo
from app.services.llm_client import BaseLLMProvider

SYSTEM_PROMPT = """You are NyayAlay, an Indian legal-information assistant.

Hard rules:
- Provide GENERAL legal information only. Never give definitive legal advice.
- Do NOT tell the user what they must/should do as instructions that replace a lawyer.
- Prefer current Indian criminal framework references: BNS / BNSS / BSA (effective 1 July 2024) when relevant.
- If domestic violence or immediate danger is involved, mention emergency services and women's helpline 181, without commanding actions.
- If context chunks are provided, use them carefully and only if they match the user's topic; ignore mismatched context.
- Always end with a short reminder that this is general information and they should consult a verified lawyer for their specific situation.
- Be concise, clear, and structured (short paragraphs or numbered steps when helpful).
"""


class OpenAIProvider(BaseLLMProvider):
    def __init__(self) -> None:
        kwargs: dict[str, Any] = {"api_key": settings.openai_api_key}
        if settings.openai_base_url:
            kwargs["base_url"] = settings.openai_base_url
        self.client = AsyncOpenAI(**kwargs)
        self.model = settings.openai_model

    async def generate(
        self,
        message: str,
        intent: IntentInfo,
        context: Optional[list[dict[str, Any]]] = None,
        history: Optional[list[dict[str, str]]] = None,
    ) -> str:
        parts: list[str] = [
            f"User message: {message}",
            f"Intent category: {intent.category}",
            f"Offence type: {intent.offence_type or 'n/a'}",
            f"Urgency: {intent.urgency}",
        ]

        if context:
            ctx_lines = []
            for item in context[:3]:
                title = (item.get("articleTitle") or item.get("title") or "").strip()
                content = (item.get("content") or "").strip()
                if content:
                    ctx_lines.append(f"- {title}: {content}" if title else f"- {content}")
            if ctx_lines:
                parts.append("Knowledge base context:\n" + "\n".join(ctx_lines))

        if history:
            hist = []
            for h in history[-6:]:
                role = h.get("role", "user")
                content = h.get("content", "")
                if content:
                    hist.append(f"{role}: {content}")
            if hist:
                parts.append("Recent conversation:\n" + "\n".join(hist))

        user_payload = "\n\n".join(parts)

        resp = await self.client.chat.completions.create(
            model=self.model,
            temperature=0.2,
            max_tokens=700,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_payload},
            ],
        )
        text = (resp.choices[0].message.content or "").strip()
        if not text:
            raise RuntimeError("Empty LLM response")
        return text