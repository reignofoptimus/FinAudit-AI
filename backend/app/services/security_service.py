import os
import re
import html
import time
from typing import Optional, Any
from collections import defaultdict
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from fastapi import status

# HTML / Script tag sanitizer
TAG_RE = re.compile(r"<[^>]+>")
INJECTION_PATTERNS = [
    re.compile(r"ignore\s+(all\s+)?previous\s+instructions?", re.IGNORECASE),
    re.compile(r"system\s+prompt\s+override", re.IGNORECASE),
    re.compile(r"disregard\s+(all\s+)?prior", re.IGNORECASE),
    re.compile(r"you\s+are\s+now\s+in\s+dan\s+mode", re.IGNORECASE),
    re.compile(r"developer\s+mode\s+enabled", re.IGNORECASE),
    re.compile(r"jailbreak", re.IGNORECASE),
]

def sanitize_text(val: Optional[str], max_length: int = 500) -> Optional[str]:
    """
    Sanitize text input by removing HTML/script tags and null bytes.
    Enforces maximum length to prevent payload bloat.
    """
    if val is None:
        return None
    if not isinstance(val, str):
        val = str(val)
    # Strip null bytes
    cleaned = val.replace("\x00", "")
    # Remove HTML tags
    cleaned = TAG_RE.sub("", cleaned)
    # Escape special HTML entities
    cleaned = html.escape(cleaned.strip())
    return cleaned[:max_length]

def sanitize_prompt_input(val: Any) -> str:
    """
    Neutralize known prompt injection attempts before injecting data into LLMs.
    """
    text = str(val)
    for pattern in INJECTION_PATTERNS:
        text = pattern.sub("[REDACTED_PROMPT_DIRECTIVE]", text)
    return text

def sanitize_filename(filename: str) -> str:
    """
    Prevent directory traversal by extracting basename and removing risky characters.
    """
    base = os.path.basename(filename)
    # Keep only safe alphanumeric, dash, underscore, dot
    safe = re.sub(r"[^a-zA-Z0-9_.-]", "_", base)
    # Disallow leading dot or path traversal
    safe = safe.lstrip(".")
    return safe or "unnamed_file"

def validate_file_magic(content: bytes, filename: str) -> bool:
    """
    Verify magic bytes to prevent masqueraded executable/HTML files.
    """
    ext = os.path.splitext(filename)[1].lower()
    if ext == ".pdf":
        return content.startswith(b"%PDF-")
    elif ext == ".xlsx":
        # ZIP archive magic bytes (OpenXML)
        return content.startswith(b"PK\x03\x04")
    elif ext == ".xls":
        # Compound file binary format
        return content.startswith(b"\xd0\xcf\x11\xe0")
    elif ext == ".csv":
        # CSV text: cannot contain binary null bytes, must decode as text
        if b"\x00" in content[:4096]:
            return False
        try:
            content[:4096].decode("utf-8")
            return True
        except UnicodeDecodeError:
            try:
                content[:4096].decode("latin-1")
                return True
            except Exception:
                return False
    return False

class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    In-memory sliding window rate limiter per client IP.
    Protects against brute force login attacks and AI/report endpoint flooding.
    """
    def __init__(self, app):
        super().__init__(app)
        self.requests = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        path = request.url.path
        now = time.time()

        limit = None
        # Brute force protection on authentication routes (10 attempts / min)
        if path.endswith("/auth/login") or path.endswith("/auth/register"):
            limit = (10, 60, "auth")
        # Resource exhaustion protection on heavy report generation (10 / min)
        elif path.endswith("/reports/generate"):
            limit = (10, 60, "heavy_report")
        # Protection on heavy pipeline scans (15 / min)
        elif any(path.endswith(p) for p in ["/anomalies/run", "/matching/run", "/discrepancies/run", "/duplicates/run", "/missing-docs/run"]):
            limit = (15, 60, "pipeline_scans")
        # File upload limits (20 / min)
        elif path.endswith("/documents/upload"):
            limit = (20, 60, "upload")

        if limit:
            max_req, window, bucket = limit
            key = f"{client_ip}:{bucket}"
            # Evict timestamps outside sliding window
            self.requests[key] = [t for t in self.requests[key] if now - t < window]
            if len(self.requests[key]) >= max_req:
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={
                        "detail": f"Rate limit exceeded for {bucket}. Too many requests from your IP. Please retry in 60 seconds."
                    },
                    headers={"Retry-After": "60"}
                )
            self.requests[key].append(now)

        return await call_next(request)
