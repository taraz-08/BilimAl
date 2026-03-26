from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from models.user import User
from dependencies import require_teacher
from services.ocr_grading import extract_text_from_image, grade_extracted_text

router = APIRouter(prefix="/handwriting", tags=["handwriting"])


@router.post("/grade")
async def grade_handwriting(
    image: UploadFile = File(...),
    topic: str = Form(...),
    max_points: int = Form(10),
    current_user: User = Depends(require_teacher),
):
    """
    Upload a photo of handwritten essay → OCR → AI grading.
    Returns extracted text + score + feedback.
    """
    contents = await image.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(400, "Файл өлшемі 10MB-дан аспауы керек")

    try:
        extracted_text = extract_text_from_image(contents)
    except Exception as e:
        raise HTTPException(503, f"Vision API қатесі: {str(e)}")

    if not extracted_text:
        raise HTTPException(422, "Суреттен мәтін анықталмады. Анығырақ сурет жіберіңіз.")

    try:
        grading = grade_extracted_text(extracted_text, topic, max_points)
    except Exception as e:
        raise HTTPException(503, f"AI бағалау қатесі: {str(e)}")

    return {
        "extracted_text": extracted_text,
        "score": grading["score"],
        "max_points": max_points,
        "feedback": grading["feedback"],
        "strengths": grading["strengths"],
        "improvements": grading["improvements"],
    }
