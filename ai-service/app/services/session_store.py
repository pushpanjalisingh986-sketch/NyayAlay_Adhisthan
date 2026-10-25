from dataclasses import dataclass, field
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from uuid import uuid4
import threading

@dataclass
class ChatMessage:
    role: str  # "user" | "assistant"
    content: str
    created_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class Session:
    session_id: str
    messages: List[ChatMessage] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)
    last_accessed_at: datetime = field(default_factory=datetime.utcnow)

    def touch(self):
        self.last_accessed_at = datetime.utcnow()


class InMemorySessionStore:
    """
    Ephemeral session store for anonymous chats.

    Design choices:
    - No database writes (privacy)
    - TTL-based expiry
    - Max messages per session (cost + abuse control)
    - Thread-safe for basic concurrent access
    """

    def __init__(self, ttl_minutes: int = 60, max_messages: int = 10):
        self._sessions: Dict[str, Session] = {}
        self._ttl = timedelta(minutes=ttl_minutes)
        self._max_messages = max_messages
        self._lock = threading.Lock()

    def create_session(self) -> str:
        session_id = str(uuid4())
        with self._lock:
            self._sessions[session_id] = Session(session_id=session_id)
        return session_id

    def get_session(self, session_id: str) -> Optional[Session]:
        with self._lock:
            self._cleanup_expired()
            session = self._sessions.get(session_id)
            if session:
                session.touch()
            return session

    def add_message(self, session_id: str, role: str, content: str) -> bool:
        with self._lock:
            self._cleanup_expired()
            session = self._sessions.get(session_id)
            if not session:
                return False

            if len(session.messages) >= self._max_messages:
                return False  # limit reached

            session.messages.append(ChatMessage(role=role, content=content))
            session.touch()
            return True

    def get_history(self, session_id: str) -> List[ChatMessage]:
        session = self.get_session(session_id)
        if not session:
            return []
        return list(session.messages)

    def _cleanup_expired(self):
        now = datetime.utcnow()
        expired = [
            sid for sid, s in self._sessions.items()
            if now - s.last_accessed_at > self._ttl
        ]
        for sid in expired:
            del self._sessions[sid]


# Singleton instance used by the AI service
session_store = InMemorySessionStore(ttl_minutes=60, max_messages=10)