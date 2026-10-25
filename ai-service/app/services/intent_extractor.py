from app.schemas.chat import IntentInfo
import re


class IntentExtractor:
    """
    Structured intent extractor.
    Rule-based for now. Designed to be upgraded later
    to LLM function-calling without changing the response contract.
    """

    def extract(self, message: str) -> IntentInfo:
        text = message.lower()
        category = "general_query"
        offence_type = None
        urgency = "low"
        escalation_needed = False
        jurisdiction = None

        # --- Procedure / Offence detection ---
        if any(k in text for k in ["fir", "police complaint", "report to police", "thana", "chowki"]):
            category = "procedure"
            offence_type = "fir_related"
        elif any(k in text for k in ["stole", "stolen", "theft", "chor", "chori", "robbery", "snatching", "pickpocket"]):
            category = "procedure"
            offence_type = "theft"
        elif any(k in text for k in ["bail", "zamanat", "release from jail"]):
            category = "procedure"
            offence_type = "bail"
        elif any(
            k in text
            for k in [
                "domestic violence",
                "husband beat",
                "husband is beating",
                "beating me",
                "beats me",
                "hitting me",
                "hit me",
                "wife beat",
                "dowry",
                "498a",
                "cruelty by husband",
                "domestic abuse",
                "abuse at home",
            ]
        ):
            category = "procedure"
            offence_type = "domestic_violence"
            urgency = "high"
            escalation_needed = True
        elif any(k in text for k in ["consumer", "refund", "defective product", "cheated by company", "online fraud"]):
            category = "procedure"
            offence_type = "consumer_complaint"
        elif any(k in text for k in ["rti", "right to information", "information under rti"]):
            category = "procedure"
            offence_type = "rti"
        elif any(
            k in text
            for k in [
                "right of representation",
                "right of representaton",  # common typo
                "right to representation",
                "right to representaton",
                "right to counsel",
                "legal representation",
                "legal representaton",
                "advocate present",
                "lawyer present",
                "police denying lawyer",
                "not allowing lawyer",
                "not allowing advocate",
                "violating my right",
                "voilating my right",  # common typo
            ]
        ):
            category = "procedure"
            offence_type = "legal_representation"
        elif any(k in text for k in ["motor accident", "road accident", "hit and run", "insurance claim"]):
            category = "procedure"
            offence_type = "motor_accident"
        elif any(k in text for k in ["lawyer", "advocate", "legal help", "consult a lawyer", "need a lawyer"]):
            category = "referral"
            escalation_needed = True

        # --- Crisis / Emergency signals ---
        crisis_keywords = [
            "kill me",
            "suicide",
            "want to die",
            "threat to life",
            "he will kill",
            "she will kill",
            "danger to my life",
            "scared for my life",
            "going to attack me",
        ]
        if any(k in text for k in crisis_keywords):
            urgency = "high"
            escalation_needed = True
            category = "emergency"

        # --- Basic offence date extraction ---
        offence_date = None
        date_match = re.search(r"\b(20\d{2})[-/](\d{1,2})[-/](\d{1,2})\b", text)
        if date_match:
            offence_date = f"{date_match.group(1)}-{date_match.group(2).zfill(2)}-{date_match.group(3).zfill(2)}"

        return IntentInfo(
            category=category,
            offence_type=offence_type,
            offence_date=offence_date,
            jurisdiction=jurisdiction,
            urgency=urgency,
            escalation_needed=escalation_needed,
        )


intent_extractor = IntentExtractor()
