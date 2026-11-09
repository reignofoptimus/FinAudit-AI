import numpy as np
import pandas as pd
from typing import List, Dict, Any
from sklearn.ensemble import IsolationForest
from sqlalchemy.orm import Session
from app.models.transaction import Transaction
from app.models.anomaly import AnomalyResult
from app.config import settings

def run_ml_anomaly_detection(db: Session, company_id: int) -> Dict[str, Any]:
    """
    Extracts features for all company transactions, trains IsolationForest,
    scores each transaction, and generates explainable audit insights.
    """
    # Clear existing unreviewed anomalies
    db.query(AnomalyResult).filter(
        AnomalyResult.is_reviewed == False,
        AnomalyResult.transaction.has(company_id=company_id)
    ).delete(synchronize_session=False)

    txs = db.query(Transaction).filter(
        Transaction.company_id == company_id
    ).all()

    if len(txs) < 10:
        return {
            "status": "warning",
            "message": "Insufficient transaction volume (minimum 10 required for ML Isolation Forest).",
            "anomalies_detected": 0
        }

    # Build DataFrame
    records = []
    for t in txs:
        records.append({
            "id": t.id,
            "amount": float(t.amount),
            "date": t.transaction_date,
            "day_of_week": t.transaction_date.weekday(),  # 5=Sat, 6=Sun
            "day_of_month": t.transaction_date.day,
            "vendor": t.vendor_name or "Unknown",
            "source_type": t.source_type
        })
    df = pd.DataFrame(records)

    # Feature Engineering
    # 1. Vendor historical statistics
    vendor_stats = df.groupby("vendor")["amount"].agg(["mean", "std", "count"]).reset_index()
    vendor_stats.rename(columns={"mean": "v_mean", "std": "v_std", "count": "v_count"}, inplace=True)
    vendor_stats["v_std"] = vendor_stats["v_std"].fillna(0.0)

    df = df.merge(vendor_stats, on="vendor", how="left")
    
    # Calculate z-score relative to vendor (safe div)
    df["v_zscore"] = np.where(
        df["v_std"] > 0,
        (df["amount"] - df["v_mean"]) / df["v_std"],
        np.where(df["v_mean"] > 0, (df["amount"] - df["v_mean"]) / df["v_mean"], 0.0)
    )

    # Log amount for scale invariance
    df["log_amount"] = np.log1p(df["amount"])
    
    # Weekend indicator (1 if Sat or Sun)
    df["is_weekend"] = df["day_of_week"].apply(lambda d: 1 if d >= 5 else 0)

    # Global amount z-score
    g_mean = df["amount"].mean()
    g_std = df["amount"].std()
    df["global_zscore"] = (df["amount"] - g_mean) / (g_std if g_std > 0 else 1.0)

    # Features for Isolation Forest
    X = df[["log_amount", "v_zscore", "global_zscore", "day_of_week", "is_weekend"]].fillna(0.0).values

    # Train Isolation Forest
    contamination = min(0.12, max(0.03, settings.ANOMALY_CONTAMINATION))
    iso_forest = IsolationForest(
        n_estimators=100,
        contamination=contamination,
        random_state=42
    )
    iso_forest.fit(X)

    # Decision function: lower values mean more anomalous
    scores = iso_forest.decision_function(X)
    predictions = iso_forest.predict(X)  # -1 for outliers, 1 for inliers

    # Normalize scores to 0 - 100 risk score (100 = extreme anomaly)
    # Typically decision_function is around -0.3 to +0.3
    min_score, max_score = scores.min(), scores.max()
    score_range = max_score - min_score if (max_score - min_score) > 0 else 1.0

    anomalies_created = 0
    tx_map = {t.id: t for t in txs}

    for idx, row in df.iterrows():
        is_outlier = predictions[idx] == -1
        raw_score = float(scores[idx])
        # Invert so lower raw_score yields higher normalized score
        normalized_score = round(float((max_score - raw_score) / score_range * 100.0), 1)

        # Flag if Isolation Forest says outlier OR normalized score > 68 or extreme z-score
        if is_outlier or normalized_score >= 68.0 or row["v_zscore"] >= 3.0:
            tx_obj = tx_map[int(row["id"])]
            
            # Formulate explainable reasons
            reasons = []
            if row["amount"] > 35000:
                reasons.append(f"High absolute amount: ${row['amount']:,.2f}")
            if row["v_zscore"] >= 2.0:
                reasons.append(f"Amount is {row['v_zscore']:.1f} standard deviations above vendor '{row['vendor']}' average (${row['v_mean']:,.2f})")
            if row["is_weekend"] == 1:
                day_name = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][int(row["day_of_week"])]
                reasons.append(f"Transaction occurred outside normal business days on {day_name}")
            if row["global_zscore"] >= 2.5:
                reasons.append(f"Transaction exceeds 98th percentile of all company expenditures")
            if not reasons:
                reasons.append(f"Statistical isolation outlier based on combined spending frequency and amount profile")

            risk_level = "high" if normalized_score >= 80 or row["amount"] > 40000 else "medium"

            factor_text = " • ".join(reasons)

            anom_record = AnomalyResult(
                transaction_id=tx_obj.id,
                anomaly_score=normalized_score,
                raw_isolation_score=raw_score,
                risk_level=risk_level,
                anomaly_factors=factor_text,
                model_name="IsolationForest (n=100, contamination=0.08)",
                is_reviewed=False
            )
            db.add(anom_record)
            tx_obj.is_anomaly = True
            anomalies_created += 1

    db.commit()
    return {
        "status": "success",
        "total_evaluated": len(txs),
        "anomalies_detected": anomalies_created,
        "model": "IsolationForest",
        "contamination": contamination
    }
