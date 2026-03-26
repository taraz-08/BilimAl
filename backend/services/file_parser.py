"""
Extract plain text from uploaded PDF or DOCX files.
"""
import io
from fastapi import UploadFile


async def extract_text(file: UploadFile) -> str:
    content = await file.read()
    filename = file.filename or ""

    if filename.lower().endswith(".pdf"):
        return _extract_pdf(content)
    elif filename.lower().endswith(".docx"):
        return _extract_docx(content)
    else:
        # Try treating as plain text
        return content.decode("utf-8", errors="ignore")


def _extract_pdf(content: bytes) -> str:
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(stream=content, filetype="pdf")
        text = "\n".join(page.get_text() for page in doc)
        return text.strip()
    except ImportError:
        return "(PyMuPDF not installed — install with: pip install pymupdf)"
    except Exception as e:
        return f"(PDF extraction error: {e})"


def _extract_docx(content: bytes) -> str:
    try:
        from docx import Document
        doc = Document(io.BytesIO(content))
        return "\n".join(para.text for para in doc.paragraphs).strip()
    except ImportError:
        return "(python-docx not installed — install with: pip install python-docx)"
    except Exception as e:
        return f"(DOCX extraction error: {e})"
