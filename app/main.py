"""
main.py — FastAPI application entry point.

Startup behaviour:
  • Model is loaded ONCE via the lifespan context manager.
  • All subsequent requests reuse the in-memory model — no per-request
    disk I/O.

CORS:
  • All origins allowed so the Vercel frontend can call this API.
  • Tighten origins in production by replacing "*" with your Vercel URL.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.inference import load_model, predict, validate_file

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Lifespan — load model once at startup
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load model on startup; nothing special needed on shutdown."""
    logger.info("Application starting up — loading model …")
    try:
        load_model()
        logger.info("Model ready. API is live.")
    except FileNotFoundError as exc:
        logger.critical("STARTUP FAILED: %s", exc)
        # Allow server to start; /predict will return 503 until model exists.
    yield
    logger.info("Application shutting down.")


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Crop Disease Detection API",
    description=(
        "Production inference API for a custom CNN model trained to classify "
        "38 crop disease categories from the PlantVillage dataset."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS — open for Vercel frontend (restrict in production if needed)
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get(
    "/health",
    summary="Health check",
    tags=["Health"],
    response_description="Service liveness and model identifier",
)
async def health():
    """
    Returns 200 OK when the service is running.
    Reflects whether the model is actually loaded and ready.
    """
    from app.inference import _model
    model_ready = _model is not None
    return {
        "status": "ok",
        "model": "color-cnn",
        "model_loaded": model_ready
    }


@app.post(
    "/predict",
    summary="Predict crop disease from an image",
    tags=["Inference"],
    response_description="Top-3 predictions with confidence scores",
)
async def predict_endpoint(file: UploadFile = File(...)):
    """
    Accept a JPG or PNG plant-leaf image and return the top-3 predicted
    disease classes with confidence scores.

    - **file**: image file (JPG / JPEG / PNG, max 10 MB)
    """
    from app.inference import MAX_UPLOAD_BYTES

    if file.size and file.size > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"File exceeds maximum upload size of {MAX_UPLOAD_BYTES // (1024 * 1024)} MB."
        )

    # ---- Read file into memory ----
    image_bytes = await file.read()

    # ---- Validate ----
    try:
        validate_file(
            filename=file.filename or "upload",
            content_type=file.content_type or "",
            size_bytes=len(image_bytes),
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        )

    # ---- Inference ----
    try:
        result = predict(image_bytes, top_k=3)
    except RuntimeError as exc:
        # Model not loaded (e.g., missing .pth at startup)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Model not available: {exc}",
        )
    except ValueError as exc:
        # Corrupt / invalid image content
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        )
    except Exception as exc:
        logger.exception("Unexpected error during inference: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during inference.",
        )

    return JSONResponse(content=result)
