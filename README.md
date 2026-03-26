# BilimAI – AI-Powered Educational Platform

A full-stack education platform with **React** frontend and **FastAPI** backend, featuring:
- 🌐 **3-language UI** — Kazakh / Russian / English (toggleable per session)
- 🔐 JWT authentication with role-based access (student / teacher)
- 🤖 OpenAI-powered test generation and written-answer grading
- 📊 ML performance prediction (Good / Average / Risk)
- 📁 PDF/DOCX file upload for AI test generation
- 📈 Recharts performance dashboard

---

## Project Structure

```
BilimAI/
├── stitch/           ← Original HTML design mockups (untouched)
├── backend/          ← FastAPI backend
│   ├── main.py
│   ├── config.py
│   ├── database.py
│   ├── models/
│   ├── schemas/
│   ├── routers/
│   └── services/
└── frontend/         ← React + Vite app
    └── src/
        ├── pages/
        ├── components/
        ├── context/
        ├── api/
        └── i18n/
```

---

## Setup

### 1. Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env
# Edit .env — set DATABASE_URL and OPENAI_API_KEY

# Start server (creates DB tables automatically)
uvicorn main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

**Default database:** SQLite (`bilimai.db`) — no PostgreSQL setup needed for local dev.

---

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
copy .env.example .env

# Start dev server
npm run dev
```

App: http://localhost:5173

---

## First Steps

1. Open http://localhost:5173
2. Click **"Жаңа тіркелгі жасау"** (Create account)
3. Register as **Student** or **Teacher**
4. You'll be redirected to the appropriate dashboard

---

## Language Switcher

Click **ҚАЗ / РУС / ENG** in the top right to switch language. Setting is saved to localStorage.

---

## Environment Variables

### Backend (`backend/.env`)
| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | SQLAlchemy DB URL | `sqlite:///./bilimai.db` |
| `SECRET_KEY` | JWT secret (change in prod!) | random |
| `OPENAI_API_KEY` | OpenAI API key (optional) | none — uses mock mode |
| `FRONTEND_URL` | CORS allowed origin | `http://localhost:5173` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token TTL | 1440 (24h) |

### Frontend (`frontend/.env`)
| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Backend API URL | `http://localhost:8000` |

---

## Without OpenAI Key

The app works without an API key using **mock mode**:
- Test generation → returns placeholder questions
- Written answer grading → awards points based on answer length
- Recommendations → rule-based tips only

---

## API Endpoints

| Method | Route | Auth |
|---|---|---|
| POST | `/auth/register` | Public |
| POST | `/auth/login` | Public |
| GET | `/students/me` | Student |
| GET | `/students/grades` | Student |
| GET | `/students/ranking` | Student |
| GET | `/students/recommendations` | Student |
| GET | `/students/prediction` | Student |
| GET/POST | `/tests` | Teacher |
| POST | `/tests/generate` | Teacher |
| POST | `/tests/upload` | Teacher |
| POST | `/tests/{id}/publish` | Teacher |
| POST | `/submissions` | Student |
| GET | `/submissions` | Teacher |
| POST | `/grades/approve` | Teacher |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS v3, Framer Motion, Recharts |
| Backend | FastAPI, SQLAlchemy, Pydantic v2 |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Auth | JWT (python-jose + passlib/bcrypt) |
| AI | OpenAI GPT-4o-mini |
| ML | scikit-learn / weighted composite prediction |
| File parsing | PyMuPDF (PDF), python-docx (DOCX) |
