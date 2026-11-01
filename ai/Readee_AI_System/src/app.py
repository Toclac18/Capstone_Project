# src.config phải được import TRƯỚC torch: nó đặt PYTORCH_CUDA_ALLOC_CONF
# và TOKENIZERS_PARALLELISM, các biến chỉ có tác dụng nếu đặt trước khi
# torch/transformers khởi tạo.
import src.config  # noqa: F401  (import vì side effect: nạp .env + env flags)

import asyncio
import logging
import os
from contextlib import asynccontextmanager, suppress

import torch
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.document_router import router as document_router
from src.api.summary_router import router as summary_router
from src.services.document_pipeline import process_document_internal
from src.services.queue_manager import get_queue_manager

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    force=True,  # Override existing config
)
logger = logging.getLogger(__name__)

CLEANUP_INTERVAL_SECONDS = 3600
JOB_MAX_AGE_HOURS = 24


def _log_system_info() -> None:
    logger.info("=" * 60)
    logger.info("System Information:")
    logger.info(f"  CUDA available: {torch.cuda.is_available()}")
    if not torch.cuda.is_available():
        logger.warning("  ⚠️  CUDA NOT AVAILABLE - Models will run on CPU (VERY SLOW!)")
        logger.info("=" * 60)
        return

    logger.info(f"  CUDA version: {torch.version.cuda}")
    logger.info(f"  PyTorch version: {torch.__version__}")
    logger.info(f"  GPU count: {torch.cuda.device_count()}")
    for i in range(torch.cuda.device_count()):
        props = torch.cuda.get_device_properties(i)
        logger.info(f"  GPU {i}: {torch.cuda.get_device_name(i)}")
        logger.info(f"    Total Memory: {props.total_memory / 1024**3:.2f} GB")
        logger.info(f"    Compute Capability: {props.major}.{props.minor}")
    logger.info("=" * 60)


async def _processing_callback(job_id: str, file_path: str, filename: str):
    """Queue worker gọi hàm này cho từng job."""
    try:
        return await process_document_internal(job_id, file_path, filename)
    finally:
        # Xóa file tạm sau khi xử lý xong, kể cả khi job lỗi
        if os.path.exists(file_path):
            try:
                os.unlink(file_path)
                logger.info(f"Deleted temporary file: {file_path}")
            except OSError as e:
                logger.warning(f"Failed to delete temporary file {file_path}: {e}")


async def _cleanup_loop(queue_manager) -> None:
    """Xoá job cũ khỏi dict trong RAM mỗi giờ."""
    while True:
        await asyncio.sleep(CLEANUP_INTERVAL_SECONDS)
        try:
            await queue_manager.cleanup_old_jobs(max_age_hours=JOB_MAX_AGE_HOURS)
        except Exception as e:
            logger.error(f"Error in cleanup task: {e}", exc_info=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup/shutdown. Dùng lifespan thay `@app.on_event`: on_event đã
    deprecated trong FastAPI, và nó không cho đảm bảo cleanup task được huỷ
    khi app tắt — task cũ sống sót qua shutdown.
    """
    _log_system_info()

    queue_manager = get_queue_manager()
    await queue_manager.start_worker(_processing_callback)
    logger.info("✓ Queue worker started - documents will be processed sequentially")

    cleanup_task = asyncio.create_task(_cleanup_loop(queue_manager))
    logger.info("✓ Cleanup task started")

    try:
        yield
    finally:
        logger.info("Shutting down queue worker...")
        cleanup_task.cancel()
        with suppress(asyncio.CancelledError):
            await cleanup_task
        await queue_manager.stop_worker()
        logger.info("✓ Queue worker stopped")


app = FastAPI(title="Readee AI System", lifespan=lifespan)

# Service này chỉ được backend gọi server-to-server với X-API-Key, không có
# trang web nào gọi trực tiếp. Mở CORS cho mọi origin là không cần thiết;
# đặt AI_CORS_ORIGINS nếu thật sự cần (phân cách bằng dấu phẩy).
_cors_origins = [
    origin.strip()
    for origin in os.getenv("AI_CORS_ORIGINS", "").split(",")
    if origin.strip()
]
if _cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=_cors_origins,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# /api/v1/process-document — nhận file, trả job_id, kết quả qua webhook/polling
app.include_router(document_router)
# /api/v1/summarize-text, /summarize-text-file — summarize text trực tiếp
app.include_router(summary_router)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "Readee_AI_System",
    }


if __name__ == "__main__":
    import uvicorn

    # "src.app:app", không "app:app": import trong file này là `from src...`
    # nên phải chạy từ thư mục Readee_AI_System.
    #   python -m src.app        hoặc
    #   uvicorn src.app:app --port 8000
    uvicorn.run(
        "src.app:app",
        host=os.getenv("AI_HOST", "0.0.0.0"),
        port=int(os.getenv("AI_PORT", "8000")),
        timeout_keep_alive=600,
        reload=True,
        log_config=None,  # Giữ cấu hình logging ở trên, không để uvicorn ghi đè
        use_colors=False,
    )
