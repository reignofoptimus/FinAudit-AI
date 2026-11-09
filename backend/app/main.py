import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.api import (
    auth,
    dashboard,
    documents,
    transactions,
    matching,
    duplicates,
    discrepancies,
    missing_docs,
    anomalies,
    vendors,
    reports,
    seed
)
from app.sample_data.seeder import seed_database

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-Powered Financial Audit Assistant REST API"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(dashboard.router, prefix=settings.API_V1_PREFIX)
app.include_router(documents.router, prefix=settings.API_V1_PREFIX)
app.include_router(transactions.router, prefix=settings.API_V1_PREFIX)
app.include_router(matching.router, prefix=settings.API_V1_PREFIX)
app.include_router(duplicates.router, prefix=settings.API_V1_PREFIX)
app.include_router(discrepancies.router, prefix=settings.API_V1_PREFIX)
app.include_router(missing_docs.router, prefix=settings.API_V1_PREFIX)
app.include_router(anomalies.router, prefix=settings.API_V1_PREFIX)
app.include_router(vendors.router, prefix=settings.API_V1_PREFIX)
app.include_router(reports.router, prefix=settings.API_V1_PREFIX)
app.include_router(seed.router, prefix=settings.API_V1_PREFIX)

@app.on_event("startup")
def on_startup():
    # Auto-seed database with realistic demonstration transactions on first startup
    try:
        seed_database()
    except Exception as e:
        print(f"Startup seeding notice: {e}")

@app.get("/")
def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs_url": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}
