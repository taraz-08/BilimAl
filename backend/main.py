from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from config import settings

# Import all models so SQLAlchemy creates the tables
import models  # noqa: F401

from routers import auth, students, tests, submissions, grades, groups, proctoring, handwriting

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="BilimAI Platform API",
    description="AI-powered educational platform backend",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(students.router)
app.include_router(tests.router)
app.include_router(submissions.router)
app.include_router(grades.router)
app.include_router(groups.router)
app.include_router(proctoring.router)
app.include_router(handwriting.router)


@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}
