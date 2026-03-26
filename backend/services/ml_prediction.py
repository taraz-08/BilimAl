"""
AI-powered performance prediction using Gemini.
Falls back to rule-based scoring if Gemini is unavailable.
"""
import json
import numpy as np
from models.submission import PredictionLabel


def predict_performance(
    avg_score: float,
    attendance_percent: int,
    completed_assignments: int,
    total_assignments: int,
    student_name: str = "",
    subject_grades=None,
) -> dict:
    """
    Gemini-powered prediction with rule-based fallback.
    Returns {"label", "confidence", "avg_score", "ai_summary"}
    """
    completion_rate = (completed_assignments / max(1, total_assignments)) * 100

    # Rule-based composite (used as fallback + passed to Gemini for context)
    composite = (
        avg_score * 0.5 +
        attendance_percent * 0.3 +
        completion_rate * 0.2
    )

    if composite >= 75:
        label = PredictionLabel.good
        confidence = min(0.99, 0.75 + (composite - 75) / 100)
    elif composite >= 55:
        label = PredictionLabel.average
        confidence = 0.65 + abs(composite - 65) / 200
    else:
        label = PredictionLabel.risk
        confidence = min(0.99, 0.70 + (55 - composite) / 100)

    ai_summary = _gemini_summary(
        avg_score=avg_score,
        attendance_percent=attendance_percent,
        completion_rate=completion_rate,
        composite=composite,
        label=label,
        subject_grades=subject_grades or [],
        student_name=student_name,
    )

    return {
        "label": label,
        "confidence": round(confidence, 2),
        "avg_score": round(avg_score, 1),
        "ai_summary": ai_summary,
    }


def _gemini_summary(avg_score, attendance_percent, completion_rate,
                    composite, label, subject_grades, student_name):
    """Generate a short Kazakh AI analysis using Gemini."""
    try:
        from config import settings
        if not settings.GOOGLE_API_KEY:
            return None
        from google import genai

        subjects_text = ""
        if subject_grades:
            lines = [f"  - {s['subject']}: {s['grade']:.0f}%" for s in subject_grades[:5]]
            subjects_text = "Пәндер бойынша баллдар:\n" + "\n".join(lines)

        label_kk = {"good": "Үздік", "average": "Орташа", "risk": "Қауіп аймағы"}[label.value]

        prompt = f"""Сіз академиялық кеңесші болып табыласыз. Студенттің үлгерімін бағалаңыз.

Студент: {student_name or 'Студент'}
Орташа тест балы: {avg_score:.1f}%
Қатысу пайызы: {attendance_percent}%
Тапсырмаларды аяқтау: {completion_rate:.0f}%
Жалпы композиттік балл: {composite:.1f}/100
{subjects_text}

Болжам нәтижесі: {label_kk}

Осы деректер негізінде 2-3 сөйлемнен тұратын қысқа ҚАЗАҚША талдау жазыңыз:
- Студенттің жағдайын нақты бағалаңыз
- Нені жақсарту керек екенін көрсетіңіз
- Ынталандырушы кеңес беріңіз

Тек талдау мәтінін жазыңыз, басқа ештеңе жоқ."""

        client = genai.Client(api_key=settings.GOOGLE_API_KEY)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )
        return response.text.strip()
    except Exception as e:
        print(f"[Prediction] Gemini error: {e}")
        return None


def predict_from_db(db, student) -> dict:
    """Compute prediction directly from DB records."""
    from models.submission import Grade, Submission, SubmissionStatus, Transcript

    grades = db.query(Grade).filter(Grade.student_id == student.id).all()
    avg_score = (
        float(np.mean([g.total_score / max(1, g.max_score) * 100 for g in grades]))
        if grades else 50.0
    )

    total_sub = db.query(Submission).filter(Submission.student_id == student.id).count()
    done_sub = db.query(Submission).filter(
        Submission.student_id == student.id,
        Submission.status == SubmissionStatus.submitted,
    ).count()

    # Get transcript subjects for richer context
    transcript = db.query(Transcript).filter(
        Transcript.student_id == student.id
    ).order_by(Transcript.uploaded_at.desc()).first()
    subject_grades = []
    if transcript and transcript.subjects:
        subject_grades = [
            s for s in transcript.subjects
            if s.get("grade") is not None
        ]

    student_name = student.user.full_name if student.user else ""

    return predict_performance(
        avg_score=avg_score,
        attendance_percent=student.attendance_percent,
        completed_assignments=done_sub,
        total_assignments=total_sub,
        student_name=student_name,
        subject_grades=subject_grades,
    )
