from __future__ import annotations

import time
from abc import ABC, abstractmethod
from typing import Any, Optional

from app.schemas.chat import IntentInfo


class BaseLLMProvider(ABC):
    @abstractmethod
    async def generate(
        self,
        message: str,
        intent: IntentInfo,
        context: Optional[list[dict[str, Any]]] = None,
        history: Optional[list[dict[str, str]]] = None,
    ) -> str:
        raise NotImplementedError


class CircuitBreaker:
    def __init__(self, failure_threshold: int = 3, recovery_seconds: int = 30):
        self.failure_threshold = failure_threshold
        self.recovery_seconds = recovery_seconds
        self.failures = 0
        self.opened_at: float | None = None

    def allow(self) -> bool:
        if self.opened_at is None:
            return True
        if time.time() - self.opened_at >= self.recovery_seconds:
            self.opened_at = None
            self.failures = 0
            return True
        return False

    def record_success(self) -> None:
        self.failures = 0
        self.opened_at = None

    def record_failure(self) -> None:
        self.failures += 1
        if self.failures >= self.failure_threshold:
            self.opened_at = time.time()


class MockLLMProvider(BaseLLMProvider):
    async def generate(
        self,
        message: str,
        intent: IntentInfo,
        context: Optional[list[dict[str, Any]]] = None,
        history: Optional[list[dict[str, str]]] = None,
    ) -> str:
        offence = (intent.offence_type or "").lower()
        category = (intent.category or "").lower()

        skip_context_for = {
            "domestic_violence",
            "legal_representation",
        }
        use_context = (
            bool(context)
            and category != "emergency"
            and offence not in skip_context_for
        )

        if use_context:
            chunks = []
            for item in context[:2]:
                content = (item.get("content") or "").strip()
                title = (item.get("articleTitle") or item.get("title") or "").strip()
                if content:
                    if title:
                        chunks.append(f"{content}\n(Source: {title})")
                    else:
                        chunks.append(content)
            if chunks:
                body = "\n\n".join(chunks)
                return (
                    "Based on our knowledge base, here is general legal information "
                    "relevant to your query.\n\n"
                    f"{body}\n\n"
                    "This is only general legal information. The exact legal position "
                    "depends on the specific facts of your case. For advice specific to "
                    "your situation, please consult a verified lawyer."
                )

        if category == "emergency" or offence == "domestic_violence":
            return (
                "If you are in immediate danger, contact emergency services or a trusted "
                "person nearby. In situations involving domestic violence, a person may "
                "generally consider approaching the police, a Protection Officer, or "
                "support services. Women's helpline 181 is a commonly referenced support "
                "contact in India. This is general information only. For guidance specific "
                "to your situation, please consult a verified lawyer or local support services."
            )

        if offence == "theft":
            return (
                "Under the Bharatiya Nyaya Sanhita (BNS), theft is generally covered under "
                "Section 303. A person whose property has been stolen may consider the "
                "following general steps:\n\n"
                "1. Preserve any evidence (bills, IMEI number, photos, messages, CCTV if available).\n"
                "2. Visit the nearest police station to report the incident. You can request "
                "that an FIR be registered.\n"
                "3. Note down the FIR number for future reference.\n\n"
                "This is only general legal information. The exact process and sections that "
                "apply depend on the specific facts of your case. For advice specific to your "
                "situation, please consult a verified lawyer."
            )

        if offence == "fir_related":
            return (
                "Filing a First Information Report (FIR) is a general procedure under the "
                "Bharatiya Nagarik Suraksha Sanhita (BNSS). In broad terms:\n\n"
                "1. You can go to the police station that has jurisdiction over the place "
                "where the incident occurred.\n"
                "2. Provide a clear written or oral account of the incident.\n"
                "3. Request a copy of the FIR after it is registered.\n\n"
                "If the police refuse to register an FIR in a cognizable offence, there are "
                "legal remedies available under the law. This is general information only. "
                "For guidance specific to your case, please consult a verified lawyer."
            )

        if offence == "legal_representation":
            return (
                "In general terms under Indian criminal procedure (BNSS framework), a person "
                "dealing with the police may have important rights related to legal consultation "
                "and representation, depending on the stage of the process (for example, during "
                "questioning or after arrest).\n\n"
                "If someone believes the police are preventing them from consulting a lawyer or "
                "exercising a lawful right of representation, they may generally consider:\n\n"
                "1. Clearly and calmly stating that they wish to consult a lawyer.\n"
                "2. Noting the names, ranks, and police station of the officers involved, if safe.\n"
                "3. Seeking help from a verified lawyer as soon as possible.\n"
                "4. If needed, approaching higher police authorities or appropriate legal remedies "
                "with the help of counsel.\n\n"
                "This is only general legal information. The exact rights and remedies depend on "
                "the specific facts and stage of the matter. For guidance specific to your "
                "situation, please consult a verified lawyer."
            )

        if offence == "bail":
            return (
                "Bail is a general legal concept under which a person may seek release from "
                "custody under conditions set by law and the competent authority. The "
                "availability and conditions of bail depend on the nature of the offence, "
                "stage of proceedings, and specific facts. This is general information only. "
                "For guidance specific to a case, please consult a verified lawyer."
            )

        if offence == "consumer_complaint":
            return (
                "Consumer disputes may generally be addressed under the Consumer Protection "
                "Act, 2019. In broad terms, a consumer may raise a complaint regarding defective "
                "goods, deficient services, or unfair trade practices before the appropriate "
                "consumer commission depending on the value of the claim. Keeping bills, "
                "warranties, and written communication helps support a complaint. This is "
                "general legal information only and does not constitute legal advice."
            )

        if offence == "rti":
            return (
                "The Right to Information (RTI) is a general mechanism to seek information from "
                "public authorities, subject to statutory exemptions. Applications are usually "
                "made to the concerned Public Information Officer. This is general information "
                "only. For guidance on a specific request, please consult a verified lawyer or "
                "an RTI resource."
            )

        if category == "referral":
            return (
                "For situation-specific guidance, it is generally appropriate to consult a "
                "verified lawyer who can review the facts and documents. This platform provides "
                "general legal information only and does not create an attorney-client relationship."
            )

        return (
            "Based on general legal information under the current Indian criminal laws "
            "(BNS / BNSS / BSA effective from 1 July 2024), here is some relevant information "
            f'related to your query: "{message}".\n\n'
            "Please note that this is only general information. The exact legal position "
            "depends on the specific facts of your case. For advice specific to your "
            "situation, please consult a verified lawyer."
        )


class LLMClient:
    def __init__(self) -> None:
        from app.core.config import settings

        provider_name = (settings.llm_provider or "mock").lower().strip()
        if provider_name == "openai" and settings.openai_api_key:
            from app.services.openai_provider import OpenAIProvider

            self.provider: BaseLLMProvider = OpenAIProvider()
        else:
            self.provider = MockLLMProvider()
        self.breaker = CircuitBreaker()
    

    async def generate(
        self,
        message: str,
        context: Optional[list[dict[str, Any]]] = None,
        history: Optional[list[dict[str, str]]] = None,
        intent: IntentInfo | None = None,
    ) -> str:
        if intent is None:
            from app.services.intent_extractor import intent_extractor

            intent = intent_extractor.extract(message)
        return await self.generate_reply(
            message=message,
            intent=intent,
            context=context,
            history=history,
        )

    async def generate_reply(
        self,
        message: str,
        intent: IntentInfo,
        context: Optional[list[dict[str, Any]]] = None,
        history: Optional[list[dict[str, str]]] = None,
    ) -> str:
        if not self.breaker.allow():
            return (
                "The AI service is temporarily under high load. Please try again shortly. "
                "For urgent matters, contact local emergency services or a verified lawyer."
            )
        try:
            text = await self.provider.generate(
                message=message,
                intent=intent,
                context=context,
                history=history,
            )
            self.breaker.record_success()
            return text
        except Exception:
            self.breaker.record_failure()
            return (
                "We could not generate a detailed response right now. "
                "Please try again later or consult a verified lawyer for specific guidance."
            )


llm_client = LLMClient()