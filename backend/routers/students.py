from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.user import User, StudentProfile
from models.submission import Grade, Recommendation, PredictionResult, Transcript
from schemas.student import (
    StudentProfile as StudentProfileOut, GradeOut, RankingEntry,
    RecommendationOut, PredictionOut, TranscriptOut, JournalOut, TeacherRankingEntry
)
from dependencies import require_student, require_teacher
from services.ml_prediction import predict_from_db
from services.recommendation import generate_recommendations
from services.file_parser import extract_text
import numpy as np
import json

router = APIRouter(prefix="/students", tags=["students"])


def _get_student_profile(user: User, db: Session) -> StudentProfile:
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return profile


def _avg_score(grades):
    if not grades:
        return 0.0
    return float(np.mean([g.total_score / max(1, g.max_score) * 100 for g in grades]))


def _grade_letter(pct: float) -> str:
    if pct >= 80: return "A"
    if pct >= 65: return "B"
    if pct >= 50: return "C"
    return "D"


@router.get("/me", response_model=StudentProfileOut)
def get_my_profile(current_user: User = Depends(require_student), db: Session = Depends(get_db)):
    profile = _get_student_profile(current_user, db)
    return StudentProfileOut(
        id=profile.id,
        user_id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        student_id=profile.student_id,
        specialization=profile.specialization,
        group_id=profile.group_id,
        group_name=profile.group.name if profile.group else None,
        year=profile.year,
        attendance_percent=profile.attendance_percent,
    )


@router.get("/grades", response_model=List[GradeOut])
def get_my_grades(current_user: User = Depends(require_student), db: Session = Depends(get_db)):
    profile = _get_student_profile(current_user, db)
    grades = db.query(Grade).filter(Grade.student_id == profile.id).all()
    result = []
    for g in grades:
        title = g.submission.test.title if g.submission and g.submission.test else None
        result.append(GradeOut(
            id=g.id,
            submission_id=g.submission_id,
            total_score=g.total_score,
            max_score=g.max_score,
            ai_score=g.ai_score,
            ai_feedback=g.ai_feedback,
            status=g.status,
            test_title=title,
        ))
    return result


@router.get("/ranking", response_model=List[RankingEntry])
def get_ranking(current_user: User = Depends(require_student), db: Session = Depends(get_db)):
    profile = _get_student_profile(current_user, db)

    # Rank within same group if student has a group, otherwise all students
    if profile.group_id:
        group_students = db.query(StudentProfile).filter(
            StudentProfile.group_id == profile.group_id
        ).all()
    else:
        group_students = db.query(StudentProfile).all()

    scores = []
    for s in group_students:
        grades = db.query(Grade).filter(Grade.student_id == s.id).all()
        avg = _avg_score(grades)
        scores.append((s, avg))
    scores.sort(key=lambda x: x[1], reverse=True)

    return [
        RankingEntry(
            rank=i + 1,
            student_id=s.id,
            full_name=s.user.full_name,
            avg_score=round(avg, 1),
            is_me=(s.id == profile.id),
            specialization=s.specialization,
        )
        for i, (s, avg) in enumerate(scores)
    ]


@router.get("/recommendations", response_model=List[RecommendationOut])
def get_recommendations(current_user: User = Depends(require_student), db: Session = Depends(get_db)):
    profile = _get_student_profile(current_user, db)
    grades = db.query(Grade).filter(Grade.student_id == profile.id).all()
    avg = _avg_score(grades)
    weak = [g.submission.test.title for g in grades if g.total_score / max(1, g.max_score) < 0.6 and g.submission]
    recs = generate_recommendations(avg, profile.attendance_percent, weak)
    return [RecommendationOut(id=i, **r) for i, r in enumerate(recs)]


@router.get("/prediction", response_model=PredictionOut)
def get_prediction(current_user: User = Depends(require_student), db: Session = Depends(get_db)):
    profile = _get_student_profile(current_user, db)
    result = predict_from_db(db, profile)
    return PredictionOut(**result)


@router.get("/journal", response_model=JournalOut)
def get_journal(current_user: User = Depends(require_student), db: Session = Depends(get_db)):
    profile = _get_student_profile(current_user, db)
    grades = db.query(Grade).filter(Grade.student_id == profile.id).all()
    avg = _avg_score(grades)
    test_count = len(grades)

    # Get latest transcript GPA
    transcript = db.query(Transcript).filter(
        Transcript.student_id == profile.id
    ).order_by(Transcript.uploaded_at.desc()).first()
    gpa = transcript.gpa if transcript else None

    # Prediction
    prediction = predict_from_db(db, profile)
    label = prediction["label"]

    # Build analysis — incorporate transcript subject grades
    strengths = []
    weaknesses = []
    strong_subjects = []   # subjects with grade >= 85
    weak_subjects = []     # subjects with grade < 75

    if transcript and transcript.subjects:
        for s in transcript.subjects:
            grade = s.get("grade")
            name = s.get("subject", "")[:40]
            if grade is None:
                continue
            if grade >= 85:
                strong_subjects.append(f"{name} ({grade:.0f}%)")
            elif grade < 75:
                weak_subjects.append(f"{name} ({grade:.0f}%)")

    # Add subject-based strengths/weaknesses
    if strong_subjects:
        strengths.extend(strong_subjects[:3])
    if weak_subjects:
        weaknesses.extend(weak_subjects[:3])

    # Test performance
    if avg >= 80:
        strengths.append(f"Тест орташа балы {avg:.1f}%")
    elif avg >= 65:
        strengths.append(f"Орташа деңгейдегі тест нәтижесі {avg:.1f}%")
    else:
        weaknesses.append(f"Тест нәтижесі төмен: {avg:.1f}%")

    if profile.attendance_percent >= 90:
        strengths.append("Жоғары қатысу деңгейі")
    elif profile.attendance_percent < 70:
        weaknesses.append("Қатысу деңгейі төмен")

    if test_count >= 3:
        strengths.append(f"{test_count} тест тапсырылды")
    elif test_count == 0:
        weaknesses.append("Тест тапсырылмаған")

    # Build analysis text
    gpa_text = f" Транскрипт GPA: {gpa}." if gpa else ""
    if weak_subjects:
        weak_names = ", ".join(s.split("(")[0].strip() for s in weak_subjects[:2])
        improve_hint = f" Жақсарту қажет: {weak_names}."
    else:
        improve_hint = ""

    if label == "good":
        analysis = f"Сіздің үлгеріміңіз өте жақсы деңгейде. Орташа балл {avg:.1f}%, қатысу {profile.attendance_percent}%.{gpa_text}"
        advice = f"Осы қарқынды сақтап, күрделі тапсырмаларға назар аударыңыз.{improve_hint}"
    elif label == "average":
        analysis = f"Үлгеріміңіз орташа деңгейде. Орташа балл {avg:.1f}%, қатысу {profile.attendance_percent}%.{gpa_text}"
        advice = f"Әлсіз пәндерге көбірек уақыт бөліп, мұғаліммен кеңесіңіз.{improve_hint}"
    else:
        analysis = f"Үлгеріміңізде қиындықтар бар. Орташа балл {avg:.1f}%, қатысу {profile.attendance_percent}%.{gpa_text}"
        advice = f"Дереу кеңес алыңыз және оқу жоспарыңызды қайта қарастырыңыз.{improve_hint}"

    return JournalOut(
        avg_score=round(avg, 1),
        attendance_percent=profile.attendance_percent,
        test_count=test_count,
        prediction_label=label,
        gpa=gpa,
        analysis=analysis,
        strengths=strengths,
        weaknesses=weaknesses,
        advice=advice,
        transcript_subjects=transcript.subjects if transcript else None,
        transcript_filename=transcript.filename if transcript else None,
    )


@router.post("/transcript", response_model=TranscriptOut)
async def upload_transcript(
    file: UploadFile = File(...),
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    profile = _get_student_profile(current_user, db)
    text = await extract_text(file)
    if not text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from file")

    subjects = _parse_transcript(text)
    # Try to read GPA directly from transcript text first
    gpa = _extract_gpa_from_text(text)
    if gpa is None and subjects:
        numeric = [s["grade"] for s in subjects if s.get("grade")]
        if numeric:
            gpa = round(sum(numeric) / len(numeric), 2)

    transcript = Transcript(
        student_id=profile.id,
        filename=file.filename,
        subjects=subjects,
        gpa=gpa,
    )
    db.add(transcript)
    db.commit()
    db.refresh(transcript)
    return transcript


def _parse_transcript(text: str):
    """
    Parse SKPU-format Kazakh university transcript.
    Extracts subjects with percentage grades and letter grades.
    Returns list of {subject, grade, letter, credits} dicts.
    """
    import re
    subjects = []
    lines = [l.strip() for l in text.split("\n") if l.strip()]

    # --- Pass 1: multi-line subject blocks ---
    # Pattern: a line starts with a digit index, accumulate subject name
    # until we hit the credits + grade line pattern
    # Table row: index  subject_text  credits  percent  letter  points  traditional
    # e.g.: "1 Білімді ... 6 85.0 B+ 3.33 Жақсы"
    # But in PDF extraction lines can be split across multiple lines.
    # Strategy: join all lines, then split by numbered entries.

    full = " ".join(lines)

    # Find subject rows: starts with row number, ends before next row number
    # Pattern: ^(\d+)\s+(subject words)\s+(\d+)\s+([\d.]+)\s+([A-F][+-]?)\s+([\d.]+)
    row_pattern = re.compile(
        r'(?<!\d)(\d{1,2})\s+'           # row number
        r'([\wА-яҚҚӘәҒғҢңҰұҮүІіҺһÖöÜü\s\(\)\/,-]{5,120?}?)\s+'  # subject name (lazy)
        r'(\d{1,2})\s+'                   # credits
        r'([\d]{2,3}\.?\d*)\s+'           # percentage grade (e.g. 85.0)
        r'([A-F][+-]?)\s+'               # letter grade (A, B+, C-, etc.)
        r'([\d.]+)',                       # GPA points
        re.UNICODE
    )

    seen_names = set()
    for m in row_pattern.finditer(full):
        subject_name = re.sub(r'\s+', ' ', m.group(2)).strip()
        credits = int(m.group(3))
        percentage = float(m.group(4))
        letter = m.group(5)

        # Skip if grade out of range or subject too short
        if not (50 <= percentage <= 100):
            continue
        if len(subject_name) < 5:
            continue
        # Deduplicate
        key = subject_name[:30]
        if key in seen_names:
            continue
        seen_names.add(key)

        subjects.append({
            "subject": subject_name[:80],
            "grade": percentage,
            "letter": letter,
            "credits": credits,
        })

    # --- Pass 2: fallback line-by-line for simpler formats ---
    if not subjects:
        skip_keywords = {"GPA", "Кредит", "Баға", "Пайыз", "Əріп", "Балл", "Дəстүр",
                         "Факультет", "Білім", "Оқыту", "Тіл", "Аты"}
        for line in lines:
            parts = line.split()
            if len(parts) < 3:
                continue
            if any(kw in line for kw in skip_keywords):
                continue
            for p in reversed(parts):
                try:
                    grade = float(p.replace(",", "."))
                    if 50 <= grade <= 100:
                        subject = " ".join(parts[:-1])[:80]
                        subjects.append({"subject": subject, "grade": grade, "letter": None, "credits": None})
                        break
                except ValueError:
                    continue

    return subjects[:25]


def _extract_gpa_from_text(text: str) -> float | None:
    """Extract GPA value directly stated in transcript text."""
    import re
    # Matches: "GPA   3.43" or "GPA/ GPA/ GPA   3.43"
    m = re.search(r'GPA[^\d]+([\d]+\.[\d]+)', text)
    if m:
        try:
            return round(float(m.group(1)), 2)
        except ValueError:
            pass
    return None


# ─── Teacher endpoints ───────────────────────────────────────────────────────

@router.get("/teacher/ranking", response_model=List[TeacherRankingEntry])
def get_teacher_ranking(
    group_id: int = None,
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    """Teacher view: all students with grade letter and 4→5 improvement candidates."""
    query = db.query(StudentProfile)
    if group_id:
        query = query.filter(StudentProfile.group_id == group_id)
    students = query.all()

    result = []
    for s in students:
        grades = db.query(Grade).filter(Grade.student_id == s.id).all()
        if not grades:
            avg = 0.0
            trend = "stable"
        else:
            avg = _avg_score(grades)
            # Trend: compare last 2 vs first 2
            scores = [g.total_score / max(1, g.max_score) * 100 for g in grades]
            if len(scores) >= 2:
                trend = "up" if scores[-1] > scores[0] else ("down" if scores[-1] < scores[0] else "stable")
            else:
                trend = "stable"

        result.append(TeacherRankingEntry(
            student_id=s.id,
            full_name=s.user.full_name,
            specialization=s.specialization,
            group_name=s.group.name if s.group else None,
            avg_score=round(avg, 1),
            grade_letter=_grade_letter(avg),
            can_improve=(70 <= avg < 80),  # Grade 4 zone, close to 5
            trend=trend,
            test_count=len(grades),
        ))

    result.sort(key=lambda x: x.avg_score, reverse=True)
    return result
