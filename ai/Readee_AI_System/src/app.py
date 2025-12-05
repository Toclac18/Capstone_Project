import logging
import torch
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.document_router import router as document_router

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
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

    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)