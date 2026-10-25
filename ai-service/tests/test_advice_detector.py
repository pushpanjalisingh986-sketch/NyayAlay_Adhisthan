import pytest
from app.services.advice_detector import is_definitive_legal_advice, sanitize_response


# ============================================================
# POSITIVE CASES — must be detected as definitive legal advice
# ============================================================

POSITIVE_CASES = [
    "You must file an FIR immediately.",
    "You should plead guilty.",
    "You need to accept the settlement.",
    "You have to go to the police station today.",
    "I advise you to file a case right now.",
    "My advice is to not talk to the other party.",
    "As your lawyer, you must sign these papers.",
    "You will win this case for sure.",
    "The court will definitely grant bail.",
    "There is a 100% chance you will get compensation.",
    "This is guaranteed under the law.",
    "I recommend that you file a complaint tomorrow.",
    "You are required to appear in court without fail.",
    "Do not go to the police under any circumstances.",
    "Do not file FIR, it will harm your case.",
    "Sign the papers immediately.",
    "Accept the settlement offer now.",
    "File a case immediately against him.",
    "You must not speak to anyone about this.",
    "You should hire a criminal lawyer today.",
]


# ============================================================
# NEGATIVE CASES — must NOT be treated as definitive advice
# ============================================================

NEGATIVE_CASES = [
    "Under BNS Section 303, theft is defined as...",
    "A person may consider reporting the incident to the police.",
    "Filing an FIR is a general procedure under BNSS.",
    "Bail may be available depending on the facts of the case.",
    "This is general legal information only.",
    "Please consult a verified lawyer for advice specific to your situation.",
    "Evidence such as bills and IMEI numbers can be useful.",
    "Domestic violence matters may involve the PWDVA 2005.",
    "You can request a copy of the FIR after registration.",
    "In general terms, the police station with jurisdiction handles the complaint.",
    "The exact legal position depends on the specific facts.",
    "Helpline 181 can be contacted for support.",
    "Transitional provisions may apply for offences before 1 July 2024.",
    "A Protection Officer may be approached in some situations.",
    "Consumer complaints can be filed before the appropriate forum.",
    "RTI is a general mechanism to seek information from public authorities.",
    "This does not constitute legal advice.",
    "Laws can vary by facts and jurisdiction.",
    "Preserve any available evidence if possible.",
    "Note down the FIR number for future reference.",
]


class TestIsDefinitiveLegalAdvice:
    @pytest.mark.parametrize("text", POSITIVE_CASES)
    def test_positive_cases_trigger(self, text):
        assert is_definitive_legal_advice(text) is True, f"Should trigger for: {text}"

    @pytest.mark.parametrize("text", NEGATIVE_CASES)
    def test_negative_cases_do_not_trigger(self, text):
        assert is_definitive_legal_advice(text) is False, f"Should NOT trigger for: {text}"


class TestSanitizeResponse:
    def test_sanitize_replaces_advice(self):
        bad = "You must file an FIR immediately."
        result = sanitize_response(bad)
        assert "You must" not in result
        assert "general legal information" in result.lower() or "consult a verified lawyer" in result.lower()

    def test_sanitize_keeps_safe_text(self):
        safe = "Under BNS Section 303, theft is defined in general terms."
        result = sanitize_response(safe)
        assert result == safe