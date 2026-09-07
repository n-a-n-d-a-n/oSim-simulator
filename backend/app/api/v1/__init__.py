"""API v1 router registry."""

from fastapi import APIRouter
from backend.app.api.v1.cpu import router as cpu_router
from backend.app.api.v1.workloads import router as workloads_router

api_v1_router = APIRouter(prefix="/api/v1")
api_v1_router.include_router(cpu_router)
api_v1_router.include_router(workloads_router)

__all__ = ["api_v1_router"]
