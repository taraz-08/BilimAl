"""
Google Vision API OCR + Gemini grading for handwritten essays.
"""
import base64
import json
import requests
from config import settings


def extract_text_from_image(image_bytes: bytes) -> str:
    """Use Google Cloud Vision API to extract text from handwritten image."""
    if not settings.VISION_API_KEY:
        raise RuntimeError("VISION_API_KEY конфигурацияланмаған")

    url = f"https://vision.googleapis.com/v1/images:annotate?key={settings.VISION_API_KEY}"
    payload = {
        "requests": [{
            "image": {"content": base64.b64encode(image_bytes).decode("utf-8")},
            "features": [{"type": "DOCUMENT_TEXT_DETECTION"}]
        }]
    }
    resp = requests.post(url, json=payload, timeout=30)
    resp.raise_for_status()
    data = resp.json()

    try:
        text = data["responses"][0]["fullTextAnnotation"]["text"]
        return text.strip()
    except (KeyError, IndexError):
        return ""


def grade_extracted_text(text: str, topic: str, max_points: int = 10) -> dict:
    """Grade extracted handwritten text using Gemini."""
    if not settings.ALEMLLM_API_KEY:
        raise RuntimeError("ALEMLLM_API_KEY конфигурацияланмаған")

    from services.alemllm import generate_text

    prompt = f"""Сіз академиялық бағалаушысыз. Студенттің қолмен жазған шығармасын бағалаңыз.

Тақырып / Тапсырма: {topic}
Студент жазбасы:
{text}

Максималды балл: {max_points}

Бағалау критерийлері:
1. Тақырыпқа сәйкестігі
2. Мазмұнның тереңдігі мен дұрыстығы
3. Тілдің сауаттылығы
4. Ойдың бірізділігі мен логикасы

МАҢЫЗДЫ: feedback өрісін міндетті түрде ҚАЗАҚ тілінде жазыңыз.

JSON форматында жауап беріңіз:
{{
  "score": <0-ден {max_points}-ке дейінгі сан>,
  "feedback": "<3-4 сөйлемнен тұратын қазақша пікір>",
  "strengths": "<күшті жақтары>",
  "improvements": "<жақсарту керек жерлері>"
}}
Тек JSON объектісін шығарыңыз."""

    text_resp = generate_text(prompt)
    if not text_resp:
        return {}
    text_resp = text_resp.strip()
    if text_resp.startswith("```"):
        text_resp = text_resp.split("```")[1]
        if text_resp.startswith("json"):
            text_resp = text_resp[4:]

    result = json.loads(text_resp)
    return {
        "score": float(min(max_points, max(0, result.get("score", 0)))),
        "feedback": result.get("feedback", ""),
        "strengths": result.get("strengths", ""),
        "improvements": result.get("improvements", ""),
    }
