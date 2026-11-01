"""
Hợp đồng request/response của AI service.

Backend đọc các field này (xem `be/.../dto/ai/AiModerationResponse.java` và
`WebhookPayload.java`) nên tên field là hợp đồng — đổi tên ở đây là đổi
hợp đồng, phải sửa cả BE.
"""
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class DocumentResponse(BaseModel):
    status: str  # "pass" | "fail"
    violations: List[Dict[str, Any]]
    summaries: Optional[Dict[str, Any]] = None
    timings: Optional[Dict[str, float]] = None  # ms cho từng bước chính


class JobSubmitResponse(BaseModel):
    job_id: str
    status: str
    message: str


class JobStatusResponse(BaseModel):
    job_id: str
    status: str
    filename: str
    created_at: float
    progress: float
    started_at: Optional[float] = None
    completed_at: Optional[float] = None
    elapsed_seconds: Optional[float] = None
    processing_time_seconds: Optional[float] = None
    error: Optional[str] = None


class SummarizeTextRequest(BaseModel):
    """Request model cho summarize text API."""

    text: str = Field(..., description="Text cần summarize", min_length=1)
    speed: bool = Field(
        False, description="Dùng speed mode (nhanh hơn nhưng chất lượng thấp hơn)"
    )


class SummarizeTextResponse(BaseModel):
    """Response model cho summarize text API."""

    input_tokens: int
    budgets: Dict[str, int]
    runtime_ms_total: float
    results: Dict[str, Dict[str, Any]]
