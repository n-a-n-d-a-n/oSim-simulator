"""Pydantic schemas for the Live System Observation API."""

from typing import List, Optional
from pydantic import BaseModel, Field


class ProcessObservationSchema(BaseModel):
    pid: int = Field(..., ge=0, description="Process ID (non-negative integer)")
    name: str = Field(..., description="Process binary or executable name")
    parent_pid: Optional[int] = Field(None, ge=0, description="Parent Process ID if accessible")
    status: str = Field(..., description="Operating system process execution status")
    cpu_percent: float = Field(..., ge=0.0, description="Recent CPU utilization percentage")
    memory_bytes: int = Field(..., ge=0, description="Resident Set Size (RSS) memory in bytes")
    thread_count: Optional[int] = Field(None, ge=1, description="Number of active execution threads")
    cpu_time_seconds: Optional[float] = Field(None, ge=0.0, description="Accumulated CPU execution time (user + system)")
    create_time: Optional[float] = Field(None, ge=0.0, description="Process creation timestamp (epoch)")


class CPUObservationSchema(BaseModel):
    total_cpu_percent: float = Field(..., ge=0.0, description="Overall host CPU utilization percentage")
    logical_cpu_count: int = Field(..., ge=1, description="Count of active logical CPU cores")
    per_cpu_percent: List[float] = Field(..., description="Per-core CPU utilization percentages")
    timestamp: float = Field(..., gt=0.0, description="Sample timestamp (epoch)")


class MemoryObservationSchema(BaseModel):
    total_bytes: int = Field(..., gt=0, description="Total physical host memory in bytes")
    used_bytes: int = Field(..., ge=0, description="Total consumed host memory in bytes")
    available_bytes: int = Field(..., ge=0, description="Memory immediately available for allocation")
    percent_used: float = Field(..., ge=0.0, le=100.0, description="Memory utilization percentage")
    timestamp: float = Field(..., gt=0.0, description="Sample timestamp (epoch)")


class SystemSnapshotResponse(BaseModel):
    snapshot_id: str = Field(..., description="Unique deterministic snapshot identifier")
    timestamp: float = Field(..., gt=0.0, description="Point-in-time capture timestamp (epoch)")
    cpu: CPUObservationSchema
    memory: MemoryObservationSchema
    processes: List[ProcessObservationSchema]
    process_count: int = Field(..., ge=0, description="Count of observed active processes")


class LiveStatusResponse(BaseModel):
    available: bool = Field(..., description="True if host observation collectors are functional")
    platform: str = Field(..., description="Operating system name / platform")
    psutil_version: Optional[str] = Field(None, description="Installed psutil version string")
    message: str = Field(..., description="Human-readable status summary")
