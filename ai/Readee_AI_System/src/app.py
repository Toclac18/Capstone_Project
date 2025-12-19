import logging
import torch
import asyncio
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.document_router import router as document_router, process_document_internal
from src.services.queue_manager import get_queue_manager

# Setup logging với màu trắng (không dùng màu)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    style='%',
    force=True  # Override existing config
)
# Tắt màu cho tất cả loggers
for handler in logging.root.handlers:
    if hasattr(handler, 'setFormatter'):
        handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
logger = logging.getLogger(__name__)

app = FastAPI(title="Readee AI System")

# Log GPU info khi start app
@app.on_event("startup")
async def startup_event():
    logger.info("=" * 60)
    logger.info("System Information:")
    logger.info(f"  CUDA available: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        logger.info(f"  CUDA version: {torch.version.cuda}")
        logger.info(f"  PyTorch version: {torch.__version__}")
        logger.info(f"  GPU count: {torch.cuda.device_count()}")
        for i in range(torch.cuda.device_count()):
            logger.info(f"  GPU {i}: {torch.cuda.get_device_name(i)}")
            props = torch.cuda.get_device_properties(i)
            logger.info(f"    Total Memory: {props.total_memory / 1024**3:.2f} GB")
            logger.info(f"    Compute Capability: {props.major}.{props.minor}")
    else:
        logger.warning("  ⚠️  CUDA NOT AVAILABLE - Models will run on CPU (VERY SLOW!)")
    logger.info("=" * 60)
    
    # Start queue worker để xử lý documents tuần tự
    async def processing_callback(job_id: str, file_path: str, filename: str):
        """Callback để xử lý job từ queue."""
        try:
            result = await process_document_internal(job_id, file_path, filename)
            return result
        finally:
            # Cleanup: Xóa file tạm sau khi xử lý xong
            if os.path.exists(file_path):
                try:
                    os.unlink(file_path)
                    logger.info(f"Deleted temporary file: {file_path}")
                except Exception as e:
                    logger.warning(f"Failed to delete temporary file {file_path}: {e}")
    
    queue_manager = get_queue_manager()
    await queue_manager.start_worker(processing_callback)
    logger.info("✓ Queue worker started - documents will be processed sequentially")
    
    # Start background task để cleanup old jobs định kỳ
    async def cleanup_task():
        while True:
            await asyncio.sleep(3600)  # Cleanup mỗi giờ
            try:
                await queue_manager.cleanup_old_jobs(max_age_hours=24)
            except Exception as e:
                logger.error(f"Error in cleanup task: {e}", exc_info=True)
    
    asyncio.create_task(cleanup_task())
    logger.info("✓ Cleanup task started")


@app.on_event("shutdown")
async def shutdown_event():
    """Stop queue worker khi app shutdown."""
    logger.info("Shutting down queue worker...")
    queue_manager = get_queue_manager()
    await queue_manager.stop_worker()
    logger.info("✓ Queue worker stopped")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router chính: /api/v1/process-document (đã nối OCR + moderation + summary)
app.include_router(document_router)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "Readee_AI_System",
    }


if __name__ == "__main__":
    import uvicorn
    import sys
    
    # Tắt màu trong uvicorn logs
    uvicorn.run(
        "app:app", 
        host="0.0.0.0", 
        port=8000,
        timeout_keep_alive=600, 
        reload=True,
        log_config=None,  # Disable uvicorn's default colored logging
        use_colors=False  # Disable colors in uvicorn
    )