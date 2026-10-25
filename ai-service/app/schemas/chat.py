from pydantic import BaseModel, Field
from typing import Optional, List

class ContextChunk(BaseModel):
    articleTitle: str
    lawVersion: Optional[str] = None
    content: str

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    session_id: Optional[str] = None
    context: List[ContextChunk] = []

class IntentInfo(BaseModel):
    category: str = "general_query"
    offence_type: Optional[str] = None
    offence_date: Optional[str] = None
    jurisdiction: Optional[str] = None
    urgency: str = "low"
    escalation_needed: bool = False

class ChatResponse(BaseModel):
    reply: str
    disclaimer: str
    intent: IntentInfo
    sources: List[str] = []
    moderation_triggered: bool = False
    session_id: Optional[str] = None