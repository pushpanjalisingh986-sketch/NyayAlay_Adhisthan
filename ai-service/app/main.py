from fastapi import FastAPI, Depends, HTTPException
from app.core.config import settings
from app.core.security import verify_internal_service_key
from app.core.prompts import LEGAL_DISCLAIMER
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.llm_client import llm_client
from app.services.advice_detector import is_definitive_legal_advice, sanitize_response
from app.services.intent_extractor import intent_extractor
from app.services.session_store import session_store
import hashlib
import math

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    docs_url="/docs" if settings.debug else None,
)

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "ai-service",
        "version": "0.1.0",
    }

@app.post(
    "/internal/v1/chat",
    response_model=ChatResponse,
    dependencies=[Depends(verify_internal_service_key)],
)
async def chat(request: ChatRequest):
    session_id = request.session_id
    if not session_id or not session_store.get_session(session_id):
        session_id = session_store.create_session()

    added = session_store.add_message(session_id, "user", request.message)
    if not added:
        raise HTTPException(
            status_code=429,
            detail="Session message limit reached. Please start a new chat.",
        )

    intent = intent_extractor.extract(request.message)
        # Safety-first override (domestic violence / high urgency)
    if (
        getattr(intent, "offence_type", None) == "domestic_violence"
        or getattr(intent, "urgency", None) == "high"
        or getattr(intent, "escalation_needed", False) is True
    ):
        reply = (
            "If you are in immediate danger, contact emergency services or a trusted person nearby. "
            "In situations involving domestic violence, a person may generally consider approaching "
            "the police, a Protection Officer, or support services. Women's helpline 181 is a commonly "
            "referenced support contact in India. "
            "This is general information only. For guidance specific to your situation, please consult "
            "a verified lawyer or local support services."
        )
        session_store.add_message(session_id, "assistant", reply)
        return ChatResponse(
            reply=reply,
            disclaimer=LEGAL_DISCLAIMER,
            intent=intent,
            sources=[],
            moderation_triggered=False,
            session_id=session_id,
        )
    context_payload = [
        {
            "articleTitle": c.articleTitle,
            "lawVersion": c.lawVersion,
            "content": c.content,
        }
        for c in (request.context or [])
    ]

    raw_reply = await llm_client.generate(request.message, context=context_payload)

    moderation_triggered = is_definitive_legal_advice(raw_reply)
    safe_reply = sanitize_response(raw_reply)

    session_store.add_message(session_id, "assistant", safe_reply)

    sources = [c.articleTitle for c in (request.context or [])]

    return ChatResponse(
        reply=safe_reply,
        disclaimer=LEGAL_DISCLAIMER,
        intent=intent,
        sources=sources,
        moderation_triggered=moderation_triggered,
        session_id=session_id,
    )

@app.post("/internal/v1/embed", dependencies=[Depends(verify_internal_service_key)])
async def embed(request: dict):
    """
    1536-dim embedding endpoint.
    Deterministic local mock for development.
    """
    text = (request.get("text") or "").strip()
    if not text:
        return {"embedding": [0.0] * 1536, "dim": 1536, "provider": "mock"}

    vec = [0.0] * 1536
    tokens = text.lower().split()
    for tok in tokens:
        h = int(hashlib.sha256(tok.encode("utf-8")).hexdigest(), 16)
        idx = h % 1536
        sign = 1.0 if (h // 1536) % 2 == 0 else -1.0
        vec[idx] += sign

    norm = math.sqrt(sum(v * v for v in vec)) or 1.0
    vec = [v / norm for v in vec]

    return {
        "embedding": vec,
        "dim": 1536,
        "provider": "mock-hash",
    }

@app.post("/internal/v1/risk", dependencies=[Depends(verify_internal_service_key)])
async def risk_stub():
    return {"risk_level": "low", "message": "Risk detection stub"}