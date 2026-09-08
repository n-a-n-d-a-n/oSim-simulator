"""FastAPI endpoints for Live System Observation."""

import sys
import psutil
from fastapi import APIRouter, HTTPException, status

from backend.live_agent import LiveSystemService, CollectorError
from backend.app.schemas.live import SystemSnapshotResponse, LiveStatusResponse

router = APIRouter(prefix="/live", tags=["Live System Observation"])


@router.get(
    "/status",
    response_model=LiveStatusResponse,
    summary="Check availability of Live System Observation",
    description="Returns availability status and host operating system platform details.",
)
def get_live_status():
    service = LiveSystemService()
    is_avail = service.is_available()
    return LiveStatusResponse(
        available=is_avail,
        platform=sys.platform,
        psutil_version=getattr(psutil, "__version__", None),
        message="Live host observation subsystem online (READ-ONLY)" if is_avail else "Host observation unavailable",
    )


@router.get(
    "/snapshot",
    response_model=SystemSnapshotResponse,
    summary="Capture point-in-time real system snapshot",
    description=(
        "Executes a one-shot, read-only capture of host CPU, memory, and process telemetry. "
        "Strictly read-only; does not modify or control any host processes."
    ),
)
def get_live_snapshot():
    try:
        service = LiveSystemService()
        snapshot = service.capture_snapshot()
        return snapshot.to_dict()
    except CollectorError as err:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Host telemetry collection failed: {err}",
        ) from err
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error while observing host system: {exc}",
        ) from exc
