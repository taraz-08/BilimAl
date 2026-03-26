"""
Seed script: Group 1514-15 IP with 17 students and their lesson scores.
Subject: Ақпараттық коммуникациялық технологиялар (АКТФИЗМАТ)
Dates: 03.02 | 10.02 | 17.02 | 24.02 | 03.03 | 10.03 | 17.03 (2026)
"""
import sys
sys.path.insert(0, '.')

from database import SessionLocal
from models.group import Group
from models.user import User, StudentProfile
from models.submission import Grade, Submission
from models.test import Test
from services.auth import hash_password

db = SessionLocal()

# ── 1. Create group ───────────────────────────────────────────────────────────
group = db.query(Group).filter(Group.name == "1514-15 IP").first()
if not group:
    group = Group(name="1514-15 IP", specialization="Information Technology")
    db.add(group)
    db.flush()
print(f"Group: {group.name} (id={group.id})")

# ── 2. Student data: name → [scores per date] (None = absent) ─────────────────
# Columns: 03.02 | 10.02 | 17.02 | 24.02 | 03.03 | 10.03 | 17.03
students_data = [
    ("Бекайдар Сабина",    [80, 78, 78, None, None, None, None]),
    ("Рахимжан Севинч",    [80, None, 88, 80, 85, 84, 85]),
    ("Сабыржан Д.",        [78, 80, 72, 79, 78, 78, 78]),
    ("Сафарбаева М.",      [72, 72, 72, 75, 78, 75, 75]),
    ("Нурмахамбет А.",     [80, None, 82, 75, None, 75, None]),
    ("Эргашев Ш.",         [None, 75, 78, 75, 78, 75, 78]),
    ("Рахимберді Ж.",      [None, 82, 75, 74, 78, 75, 78]),
    ("Абай М.",            [80, 78, 75, 75, 78, 75, 78]),
    ("Паришова А.",        [80, 85, 75, 75, 78, 75, 78]),
    ("Ерген Е.",           [75, 78, 75, 75, None, 79, 80]),
    ("Каримов Анвар",      [72, 78, 78, 80, 75, None, 78]),
    ("Жақсылық Балауса",   [85, 88, 78, 75, 80, 79, 80]),
    ("Таирбеков Н.",       [70, None, 85, 77, None, 75, 75]),
    ("Эрматваев А.",       [72, 72, 75, 75, 78, 75, None]),
    ("Әбубәкір Д.",        [None, None, None, None, 78, None, 78]),
    ("Айнур",              [None, None, None, None, 78, None, 78]),
    ("Арыстанбек К.",      [80, 78, 75, 75, 78, 77, None]),
]

dates = ["03.02.2026", "10.02.2026", "17.02.2026", "24.02.2026",
         "03.03.2026", "10.03.2026", "17.03.2026"]

# ── 3. Create 7 lesson tests ──────────────────────────────────────────────────
tests = []
for date in dates:
    title = f"АКТФИЗМАТ {date}"
    t = db.query(Test).filter(Test.title == title).first()
    if not t:
        t = Test(title=title, difficulty="undergraduate",
                 time_limit_minutes=60, is_published=True, teacher_id=1)
        db.add(t)
        db.flush()
    tests.append(t)
print(f"Tests ready: {len(tests)}")

# ── 4. Create users + profiles + grades ───────────────────────────────────────
for full_name, scores in students_data:
    # email from name
    slug = full_name.lower().replace(" ", ".").replace(".", "_")
    slug = "".join(c for c in slug if c.isalnum() or c == "_").strip("_")
    email = f"{slug}@bilimai.edu"

    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            full_name=full_name,
            hashed_password=hash_password("student123"),
            role="student",
        )
        db.add(user)
        db.flush()
        print(f"  + user created (id={user.id})")
    else:
        print(f"  ~ user exists (id={user.id})")

    # Student profile
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()
    attended = sum(1 for s in scores if s is not None)
    att_pct = int(attended / len(scores) * 100)

    if not profile:
        profile = StudentProfile(
            user_id=user.id,
            group_id=group.id,
            attendance_percent=att_pct,
        )
        db.add(profile)
        db.flush()
    else:
        profile.group_id = group.id
        profile.attendance_percent = att_pct

    # Add submission + grade for each lesson date
    for i, score in enumerate(scores):
        if score is None:
            continue
        # Check if submission already exists
        sub = db.query(Submission).filter(
            Submission.student_id == profile.id,
            Submission.test_id == tests[i].id,
        ).first()
        if not sub:
            sub = Submission(
                student_id=profile.id,
                test_id=tests[i].id,
                status="submitted",
                time_spent_seconds=0,
            )
            db.add(sub)
            db.flush()
        # Check if grade already exists
        grade = db.query(Grade).filter(Grade.submission_id == sub.id).first()
        if not grade:
            db.add(Grade(
                submission_id=sub.id,
                student_id=profile.id,
                total_score=score,
                max_score=100,
                status="approved",
                teacher_note=f"{dates[i]} сабақ бағасы",
            ))

db.commit()

# ── 5. Print ranking ──────────────────────────────────────────────────────────
print("\n✅ Done! Ranking (1514-15 IP):")
profiles = db.query(StudentProfile).filter(StudentProfile.group_id == group.id).all()
ranking = []
for p in profiles:
    grades = db.query(Grade).filter(Grade.student_id == p.id).all()
    avg = round(sum(g.total_score for g in grades) / len(grades), 1) if grades else 0.0
    ranking.append((p.user.full_name, avg, len(grades)))

ranking.sort(key=lambda x: -x[1])
for i, (name, avg, cnt) in enumerate(ranking, 1):
    print(f"  {i:2}. {avg:5.1f}%  ({cnt} grades)")

db.close()
