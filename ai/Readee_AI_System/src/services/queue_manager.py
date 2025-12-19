"""
Queue Manager for sequential document processing.
Chỉ xử lý 1 request tại một thời điểm để tránh GPU memory issues.
"""
import asyncio
import logging
import uuid
import time
from typing import Dict, Any, Optional, Callable, List
from enum import Enum
from dataclasses import dataclass, field
from pathlib import Path
import json
import httpx

logger = logging.getLogger(__name__)


class JobStatus(str, Enum):
    """Job status enum."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class Job:
    """Job data structure."""
    job_id: str
    file_path: str
    filename: str
    status: JobStatus = JobStatus.PENDING
    created_at: float = field(default_factory=time.time)
    started_at: Optional[float] = None
    completed_at: Optional[float] = None
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    progress: float = 0.0  # 0.0 to 1.0
    callback_url: Optional[str] = None  # Webhook URL để gọi khi job completed


class QueueManager:
    """
    Queue manager để xử lý document processing tuần tự.
    Chỉ xử lý 1 job tại một thời điểm.
    """
    
    def __init__(self):
        self.queue: asyncio.Queue = asyncio.Queue()
        self.jobs: Dict[str, Job] = {}  # job_id -> Job
        self.current_job_id: Optional[str] = None
        self.worker_task: Optional[asyncio.Task] = None
        self.processing_callback: Optional[Callable] = None
        self._lock = asyncio.Lock()
        
    async def start_worker(self, processing_callback: Callable):
        """
        Start worker để xử lý jobs từ queue.
        
        Args:
            processing_callback: Async function(job_id, file_path, filename) -> Dict[str, Any]
        """
        self.processing_callback = processing_callback
        if self.worker_task is None or self.worker_task.done():
            self.worker_task = asyncio.create_task(self._worker_loop())
            logger.info("Queue worker started")
    
    async def _worker_loop(self):
        """Worker loop để xử lý jobs tuần tự."""
        logger.info("Queue worker loop started")
        while True:
            try:
                # Lấy job từ queue (blocking)
                job = await self.queue.get()
                
                if job is None:  # Sentinel để stop worker
                    logger.info("Queue worker received stop signal")
                    break
                
                async with self._lock:
                    self.current_job_id = job.job_id
                    job.status = JobStatus.PROCESSING
                    job.started_at = time.time()
                    self.jobs[job.job_id] = job
                
                logger.info(f"Processing job {job.job_id}: {job.filename}")
                
                try:
                    # Gọi processing callback
                    if self.processing_callback:
                        result = await self.processing_callback(
                            job.job_id,
                            job.file_path,
                            job.filename
                        )
                        
                        async with self._lock:
                            job.status = JobStatus.COMPLETED
                            job.completed_at = time.time()
                            job.result = result
                            job.progress = 1.0
                            self.jobs[job.job_id] = job
                        
                        logger.info(
                            f"Job {job.job_id} completed successfully in "
                            f"{job.completed_at - job.started_at:.2f}s"
                        )
                        
                        # Gọi webhook callback nếu có
                        if job.callback_url:
                            asyncio.create_task(self._call_webhook(job.job_id, job.callback_url, result, None))
                    else:
                        raise RuntimeError("Processing callback not set")
                        
                except Exception as e:
                    error_msg = str(e)
                    logger.error(f"Job {job.job_id} failed: {error_msg}", exc_info=True)
                    
                    async with self._lock:
                        job.status = JobStatus.FAILED
                        job.completed_at = time.time()
                        job.error = error_msg
                        self.jobs[job.job_id] = job
                    
                    # Gọi webhook callback với error nếu có
                    if job.callback_url:
                        asyncio.create_task(self._call_webhook(job.job_id, job.callback_url, None, error_msg))
                
                finally:
                    async with self._lock:
                        self.current_job_id = None
                
                # Mark task as done
                self.queue.task_done()
                
            except Exception as e:
                logger.error(f"Error in worker loop: {e}", exc_info=True)
                await asyncio.sleep(1)  # Wait before retrying
    
    async def submit_job(self, file_path: str, filename: str, callback_url: Optional[str] = None) -> str:
        """
        Submit job vào queue.
        
        Args:
            file_path: Đường dẫn file cần xử lý
            filename: Tên file
            callback_url: Optional webhook URL để gọi khi job completed/failed
            
        Returns:
            job_id: ID của job
        """
        job_id = str(uuid.uuid4())
        job = Job(
            job_id=job_id,
            file_path=file_path,
            filename=filename,
            callback_url=callback_url
        )
        
        async with self._lock:
            self.jobs[job_id] = job
        
        await self.queue.put(job)
        logger.info(
            f"Job {job_id} submitted to queue (filename: {filename}, callback_url: {callback_url}). "
            f"Total jobs in queue: {self.queue.qsize()}, Total jobs tracked: {len(self.jobs)}"
        )
        
        return job_id
    
    async def _call_webhook(self, job_id: str, callback_url: str, result: Optional[Dict[str, Any]], error: Optional[str]):
        """
        Gọi webhook callback khi job completed hoặc failed.
        
        Args:
            job_id: ID của job
            callback_url: URL để gọi
            result: Kết quả nếu thành công
            error: Error message nếu failed
        """
        try:
            payload = {
                "job_id": job_id,
                "status": "completed" if result else "failed",
            }
            
            if result:
                payload["result"] = result
            if error:
                payload["error"] = error
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    callback_url,
                    json=payload,
                    headers={"Content-Type": "application/json"}
                )
                response.raise_for_status()
                logger.info(f"Webhook callback successful for job {job_id} to {callback_url}")
                
        except Exception as e:
            logger.error(
                f"Failed to call webhook for job {job_id} to {callback_url}: {e}",
                exc_info=True
            )
    
    async def get_job_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """
        Lấy status của job.
        
        Returns:
            Dict với status, progress, result (nếu completed), error (nếu failed)
            None nếu job không tồn tại
        """
        async with self._lock:
            job = self.jobs.get(job_id)
            if job is None:
                logger.warning(
                    f"Job {job_id} not found. Total jobs in memory: {len(self.jobs)}. "
                    f"Job IDs: {list(self.jobs.keys())[:10]}"  # Log first 10 IDs
                )
                return None
            
            response = {
                "job_id": job.job_id,
                "status": job.status.value,
                "filename": job.filename,
                "created_at": job.created_at,
                "progress": job.progress,
            }
            
            if job.started_at:
                response["started_at"] = job.started_at
                if job.status == JobStatus.PROCESSING:
                    elapsed = time.time() - job.started_at
                    response["elapsed_seconds"] = elapsed
            
            if job.completed_at:
                response["completed_at"] = job.completed_at
                if job.started_at:
                    response["processing_time_seconds"] = job.completed_at - job.started_at
            
            if job.status == JobStatus.COMPLETED and job.result:
                response["result"] = job.result
            
            if job.status == JobStatus.FAILED and job.error:
                response["error"] = job.error
            
            return response
    
    async def get_job_result(self, job_id: str) -> Optional[Dict[str, Any]]:
        """
        Lấy kết quả của job (chỉ khi completed).
        
        Returns:
            Result dict nếu completed, None nếu chưa completed hoặc không tồn tại
        """
        async with self._lock:
            job = self.jobs.get(job_id)
            if job is None:
                return None
            
            if job.status == JobStatus.COMPLETED:
                return job.result
            elif job.status == JobStatus.FAILED:
                return {"error": job.error}
            else:
                return None  # Still processing or pending
    
    async def get_queue_info(self) -> Dict[str, Any]:
        """Lấy thông tin về queue."""
        async with self._lock:
            pending_count = self.queue.qsize()
            total_jobs = len(self.jobs)
            completed_count = sum(1 for j in self.jobs.values() if j.status == JobStatus.COMPLETED)
            failed_count = sum(1 for j in self.jobs.values() if j.status == JobStatus.FAILED)
            processing_count = sum(1 for j in self.jobs.values() if j.status == JobStatus.PROCESSING)
            pending_jobs_count = sum(1 for j in self.jobs.values() if j.status == JobStatus.PENDING)
            
            return {
                "queue_size": pending_count,
                "current_job_id": self.current_job_id,
                "total_jobs": total_jobs,
                "completed_jobs": completed_count,
                "failed_jobs": failed_count,
                "processing_jobs": processing_count,
                "pending_jobs": pending_jobs_count,
            }
    
    async def list_jobs(self, limit: int = 50) -> List[Dict[str, Any]]:
        """
        List tất cả jobs (để debug).
        
        Args:
            limit: Số lượng jobs tối đa để trả về
            
        Returns:
            List of job info dicts
        """
        async with self._lock:
            jobs_list = []
            for job_id, job in list(self.jobs.items())[:limit]:
                jobs_list.append({
                    "job_id": job.job_id,
                    "filename": job.filename,
                    "status": job.status.value,
                    "created_at": job.created_at,
                    "started_at": job.started_at,
                    "completed_at": job.completed_at,
                    "has_result": job.result is not None,
                    "has_error": job.error is not None,
                    "callback_url": job.callback_url,
                })
            return jobs_list
    
    async def cleanup_old_jobs(self, max_age_hours: int = 24):
        """
        Xóa các job cũ để giải phóng memory.
        
        Args:
            max_age_hours: Xóa jobs cũ hơn N giờ (mặc định 24h)
        """
        async with self._lock:
            current_time = time.time()
            max_age_seconds = max_age_hours * 3600
            
            jobs_to_remove = []
            for job_id, job in self.jobs.items():
                # Chỉ xóa completed hoặc failed jobs
                if job.status in (JobStatus.COMPLETED, JobStatus.FAILED):
                    age = current_time - (job.completed_at or job.created_at)
                    if age > max_age_seconds:
                        jobs_to_remove.append(job_id)
            
            for job_id in jobs_to_remove:
                del self.jobs[job_id]
            
            if jobs_to_remove:
                logger.info(f"Cleaned up {len(jobs_to_remove)} old jobs")
    
    async def stop_worker(self):
        """Stop worker (gửi sentinel vào queue)."""
        await self.queue.put(None)
        if self.worker_task:
            await self.worker_task
        logger.info("Queue worker stopped")


# Global queue manager instance
_queue_manager: Optional[QueueManager] = None


def get_queue_manager() -> QueueManager:
    """Get global queue manager instance."""
    global _queue_manager
    if _queue_manager is None:
        _queue_manager = QueueManager()
    return _queue_manager

