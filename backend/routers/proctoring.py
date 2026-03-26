import base64
import requests
from fastapi import APIRouter, Depends
from config import settings
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from database import get_db
from models.user import User
from models.submission import ProctorViolation
from dependencies import require_student, require_teacher

router = APIRouter(prefix="/proctoring", tags=["proctoring"])


class ViolationIn(BaseModel):
    test_id: Optional[int] = None
    violation_type: str
    screenshot: Optional[str] = None  # base64


class ViolationOut(BaseModel):
    id: int
    student_id: int
    student_name: Optional[str] = None
    test_id: Optional[int]
    violation_type: str
    screenshot: Optional[str]
    created_at: str

    class Config:
        from_attributes = True


class AnalyzeIn(BaseModel):
    frame: str  # base64 JPEG


SUSPICIOUS_OBJECTS = {
    "Mobile phone": "Қолында телефон анықталды",
    "Telephone": "Қолында телефон анықталды",
    "Laptop": "Ноутбук анықталды",
    "Book": "Кітап / анықтамалық анықталды",
    "Tablet computer": "Планшет анықталды",
    "Remote control": "Қашықтан басқарғыш анықталды",
}


@router.post("/analyze")
def analyze_frame(
    payload: AnalyzeIn,
    current_user: User = Depends(require_student),
):
    """Analyze a webcam frame via Google Vision API.
    Returns face count, head pose flags, and detected suspicious objects.
    """
    api_key = settings.VISION_API_KEY or ""
    if not api_key:
        return {"error": "VISION_API_KEY not set"}

    # Strip data URL prefix if present
    b64 = payload.frame
    if "," in b64:
        b64 = b64.split(",", 1)[1]

    url = f"https://vision.googleapis.com/v1/images:annotate?key={api_key}"
    body = {
        "requests": [{
            "image": {"content": b64},
            "features": [
                {"type": "FACE_DETECTION", "maxResults": 5},
                {"type": "OBJECT_LOCALIZATION", "maxResults": 10},
            ],
        }]
    }

    try:
        resp = requests.post(url, json=body, timeout=10)
        resp.raise_for_status()
        data = resp.json()["responses"][0]
    except Exception as e:
        return {"error": str(e)}

    faces = data.get("faceAnnotations", [])
    objects = data.get("localizedObjectAnnotations", [])

    face_count = len(faces)
    head_turned = False
    looking_down = False

    if faces:
        f = faces[0]
        pan = f.get("panAngle", 0)    # left/right  — abs > 30° = turned
        tilt = f.get("tiltAngle", 0)  # up/down      — > 20° = looking down
        head_turned = abs(pan) > 30
        looking_down = tilt > 20

    found_objects = []
    for obj in objects:
        name = obj.get("name", "")
        score = obj.get("score", 0)
        msg = SUSPICIOUS_OBJECTS.get(name)
        if msg and score >= 0.5:
            found_objects.append({"label": name, "message": msg, "score": round(score, 2)})

    return {
        "face_count": face_count,
        "head_turned": head_turned,
        "looking_down": looking_down,
        "objects": found_objects,
    }


@router.post("/violation", status_code=201)
def report_violation(
    payload: ViolationIn,
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    profile = current_user.student_profile
    violation = ProctorViolation(
        student_id=profile.id,
        test_id=payload.test_id,
        violation_type=payload.violation_type,
        screenshot=payload.screenshot,
    )
    db.add(violation)
    db.commit()
    return {"ok": True}


@router.get("/violations", response_model=List[ViolationOut])
def get_violations(
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    violations = (
        db.query(ProctorViolation)
        .order_by(ProctorViolation.created_at.desc())
        .limit(200)
        .all()
    )
    result = []
    for v in violations:
        result.append(ViolationOut(
            id=v.id,
            student_id=v.student_id,
            student_name=v.student.user.full_name if v.student and v.student.user else None,
            test_id=v.test_id,
            violation_type=v.violation_type,
            screenshot=v.screenshot,
            created_at=str(v.created_at),
        ))
    return result
