import os
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.models.user import User
from app.services.auth_service import get_current_user, require_role
from app.services.security_service import sanitize_filename
from app.sample_data.seeder import seed_database
from app.sample_data.generate_sample_files import create_all_sample_files

router = APIRouter(prefix="/seed", tags=["Sample Data & Seeding"])

ALLOWED_SAMPLE_EXTENSIONS = {".pdf", ".csv", ".xlsx"}

@router.post("/reseed")
def trigger_reseed(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role(["admin"]))
):
    try:
        seed_database()
        return {"status": "success", "message": "Synthetic audit dataset initialized successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sample-files")
def get_sample_files_list():
    create_all_sample_files()
    files = []
    if os.path.exists(settings.SAMPLE_DIR):
        for f in os.listdir(settings.SAMPLE_DIR):
            fpath = os.path.join(settings.SAMPLE_DIR, f)
            ext = os.path.splitext(f)[1].lower()
            if os.path.isfile(fpath) and ext in ALLOWED_SAMPLE_EXTENSIONS:
                files.append({
                    "filename": f,
                    "size_bytes": os.path.getsize(fpath),
                    "file_type": ext.replace(".", "").upper()
                })
    return files

@router.get("/sample-files/{filename}")
def download_sample_file(filename: str):
    # Prevent directory traversal and unauthorized file downloads (Vulnerabilities 2 & 15)
    safe_name = sanitize_filename(filename)
    ext = os.path.splitext(safe_name)[1].lower()
    if ext not in ALLOWED_SAMPLE_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Invalid file type requested")

    sample_dir = os.path.abspath(settings.SAMPLE_DIR)
    fpath = os.path.abspath(os.path.join(sample_dir, safe_name))
    if not fpath.startswith(sample_dir):
        raise HTTPException(status_code=403, detail="Access denied")

    if not os.path.exists(fpath):
        create_all_sample_files()
    if not os.path.exists(fpath):
        raise HTTPException(status_code=404, detail="Sample file not found")
        
    media_type = "application/pdf" if safe_name.endswith(".pdf") else "text/csv" if safe_name.endswith(".csv") else "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    return FileResponse(path=fpath, media_type=media_type, filename=safe_name)
