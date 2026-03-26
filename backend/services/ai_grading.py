"""
Google Gemini powered written answer grading service.
Falls back to a simple length-based mock if GOOGLE_API_KEY is not set.
"""
import json
from google import genai
from config import settings
from typing import Tuple


def grade_written_answer(question: str, answer: str, max_points: int = 10) -> Tuple[float, str]:
    """
    Returns (score, feedback) for a student's written answer.
    """
    if not settings.GOOGLE_API_KEY:
        score = min(max_points, max(1, len(answer) // 30))
        return float(score), "AI grading unavailable in demo mode. Score auto-estimated."

    client = genai.Client(api_key=settings.GOOGLE_API_KEY)

    prompt = f"""Сіз академиялық бағалаушысыз. Студенттің жазба жауабын бағалаңыз.

Сұрақ: {question}
Студент жауабы: {answer}
Максималды балл: {max_points}

Бағалау критерийлері:
1. Мазмұнның дұрыстығы
2. Жауаптың толықтығы
3. Жауаптың анықтығы мен сауаттылығы

МАҢЫЗДЫ: feedback өрісін міндетті түрде ҚАЗАҚ тілінде жазыңыз.

JSON форматында жауап беріңіз (тек осы өрістер):
{{
  "score": <0-ден {max_points}-ке дейінгі сан>,
  "feedback": "<2-3 сөйлемнен тұратын қазақша түсінік>"
}}
Тек JSON объектісін шығарыңыз, басқа мәтін жоқ."""

    response = client.models.generate_content(model="gemini-2.5-flash", contents=prompt)

    try:
        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        result = json.loads(text)
        score = float(min(max_points, max(0, result.get("score", 0))))
        feedback = result.get("feedback", "No feedback provided.")
        return score, feedback
    except Exception:
        score = min(max_points, max(1, len(answer) // 30))
        return float(score), "Could not parse AI response. Score auto-estimated."
