import re

# Strong patterns that indicate definitive legal advice
ADVICE_PATTERNS = [
    r"\byou must\b",
    r"\byou should\b",
    r"\byou need to\b",
    r"\byou have to\b",
    r"\bfile a case immediately\b",
    r"\bfile fir immediately\b",
    r"\bplead guilty\b",
    r"\byou will win\b",
    r"\byou will lose\b",
    r"\bcourt will definitely\b",
    r"\b100% chance\b",
    r"\bguaranteed\b",
    r"\bi advise you to\b",
    r"\bmy advice is\b",
    r"\bas your lawyer\b",
    r"\bi recommend that you\b",
    r"\byou are required to\b",
    r"\bdo not go to (the )?police\b",
    r"\bdo not file fir\b",
    r"\bsign the papers\b",
    r"\baccept the settlement\b",
]

SAFE_REWRITE = (
    "I can only provide general legal information. "
    "Based on publicly available law, here is some relevant information. "
    "For advice specific to your situation, please consult a verified lawyer."
)

def is_definitive_legal_advice(text: str) -> bool:
    """
    Returns True if the text contains definitive legal advice.
    This is a hard legal boundary.
    """
    text_lower = text.lower()
    for pattern in ADVICE_PATTERNS:
        if re.search(pattern, text_lower):
            return True
    return False

def sanitize_response(text: str) -> str:
    """
    If definitive advice is detected, replace with a safe informational response.
    """
    if is_definitive_legal_advice(text):
        return SAFE_REWRITE
    return text
    