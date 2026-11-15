from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.transaction import Transaction
from app.models.duplicate import DuplicateRecord
from app.models.activity_log import ActivityLog
from app.schemas.finding import DuplicateGroupOut, DuplicateRecordOut, FindingResolveRequest
from app.services.auth_service import get_current_user
from app.services.duplicate_service import run_duplicate_detection

router = APIRouter(prefix="/duplicates", tags=["Duplicate Detection"])

@router.post("/run")
def trigger_duplicate_detection(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    company_id = current_user.company_id or 1
    res = run_duplicate_detection(db, company_id)
    db.add(ActivityLog(
        user_id=current_user.id,
        action="RUN_DUPLICATE_DETECTION",
        entity_type="duplicate_record",
        details=f"Duplicate scan completed: {res.get('duplicate_groups_detected')} groups flagged"
    ))
    db.commit()
    return res

@router.get("", response_model=List[DuplicateGroupOut])
def get_duplicate_groups(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    company_id = current_user.company_id or 1
    query = db.query(DuplicateRecord).join(Transaction).filter(
        Transaction.company_id == company_id
    )

    if status and status != "all":
        query = query.filter(DuplicateRecord.status == status)

    records = query.order_by(DuplicateRecord.created_at.desc()).all()

    # Group by group_id
    groups_dict = {}
    for r in records:
        gid = r.group_id
        if gid not in groups_dict:
            groups_dict[gid] = {
                "group_id": gid,
                "duplicate_type": r.duplicate_type,
                "confidence_score": r.confidence_score,
                "flag_reason": r.flag_reason,
                "status": r.status,
                "records": []
            }
        groups_dict[gid]["records"].append(r)

    return list(groups_dict.values())

@router.post("/{group_id}/resolve")
def resolve_duplicate_group(
    group_id: str,
    payload: FindingResolveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    records = db.query(DuplicateRecord).filter(DuplicateRecord.group_id == group_id).all()
    if not records:
        raise HTTPException(status_code=404, detail="Duplicate group not found")

    new_status = "false_positive" if payload.action == "dismiss" else "resolved"
    for r in records:
        r.status = new_status
        r.resolution_notes = payload.resolution_notes

    db.add(ActivityLog(
        user_id=current_user.id,
        action="RESOLVE_DUPLICATE",
        entity_type="duplicate_group",
        details=f"Auditor marked duplicate group {group_id} as {new_status}"
    ))

    db.commit()
    return {"status": "success", "group_id": group_id, "new_status": new_status}
