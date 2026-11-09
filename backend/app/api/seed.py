import os
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.models.user import User
from app.services.auth_service import get_current_user
from app.sample_data.seeder import seed_database
from app.sample_data.generate_sample_files import create_all_sample_files

router = APIRouter(prefix="/seed", tags=["Sample Data & Seeding"])

@router.post("/reseed")
def trigger_reseed(db: Session = Depends(get_db)):
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
            if os.path.isfile(fpath):
                files.append({
                    "filename": f,
                    "size_bytes": os.path.getsize(fpath),
                    "file_type": os.path.splitext(f)[1].replace(".", "").upper()
                })
    return files

@router.get("/sample-files/{filename}")
def download_sample_file(filename: str):
    fpath = os.path.join(settings.SAMPLE_DIR, filename)
    if not os.path.exists(fpath):
        create_all_sample_files()
    if not os.path.exists(fpath):
        raise HTTPException(status_code=404, detail="Sample file not found")
        
    media_type = "application/pdf" if filename.endswith(".pdf") else "text/csv" if filename.endswith(".csv") else "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    return FileResponse(path=fpath, media_type=media_type, filename=filename)
