"""OSim FastAPI Application."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.api.v1 import api_v1_router

app = FastAPI(
    title="OSim — Interactive Operating System Resource Management Simulator API",
    description="Educational OS simulation REST API providing CPU scheduling, memory, paging, and deadlock simulations.",
    version="1.0.0",
)

# Enable CORS for frontend local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API v1 router
app.include_router(api_v1_router)


@app.get("/api/health", tags=["Health"])
def health_check():
    return {"status": "ok", "app": "OSim", "version": "1.0.0"}
