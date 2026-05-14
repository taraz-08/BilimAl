"""
Google Gemini test question generator from topic text or extracted file content.
Falls back to mock questions if GOOGLE_API_KEY is not set.
"""
import json
from services.alemllm import generate_text
from typing import List, Dict
from config import settings


def generate_questions(topic: str, num_questions: int = 10, difficulty: str = "undergraduate") -> List[Dict]:
    """
    Returns a list of question dicts compatible with QuestionCreate schema.
    """
    if not settings.ALEMLLM_API_KEY:
        return _mock_questions(topic, num_questions)

    prompt = f"""You are an academic test designer. Create {num_questions} exam questions about the following topic.
Topic / Content: {topic[:3000]}
Difficulty: {difficulty}

Mix of question types: 70% multiple_choice, 30% written.

Respond with a JSON array. Each item must have:
{{
  "text": "<question text>",
  "question_type": "multiple_choice" | "written",
  "options": ["A. ...", "B. ...", "C. ...", "D. ..."] or null,
  "correct_answer": "A" | "B" | "C" | "D" or null for written,
  "points": 10
}}
Only output the JSON array, no other text."""

    try:
        text = generate_text(prompt)
        text = text.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        return json.loads(text)
    except Exception as e:
        err_str = str(e)
        if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
            raise RuntimeError("Gemini API квотасы таусылды. Ертең қайталаңыз немесе billing қосыңыз.")
        # Other errors — fall back to mock
        return _mock_questions(topic, num_questions)


def _mock_questions(topic: str, n: int) -> List[Dict]:
    """Fallback questions when Gemini is unavailable."""
    questions = []
    for i in range(n):
        if i % 3 == 2:
            questions.append({
                "text": f"Explain the key concept #{i+1} related to: {topic[:60]}",
                "question_type": "written",
                "options": None,
                "correct_answer": None,
                "points": 15,
            })
        else:
            questions.append({
                "text": f"Which of the following best describes concept #{i+1} in {topic[:40]}?",
                "question_type": "multiple_choice",
                "options": ["A. First option", "B. Second option", "C. Third option", "D. Fourth option"],
                "correct_answer": "A",
                "points": 10,
            })
    return questions
