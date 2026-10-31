"""
main.py — FastAPI application entry point.

Startup behaviour:
  • Model is loaded ONCE via the lifespan context manager.
  • All subsequent requests reuse the in-memory model — no per-request
    disk I/O.

CORS:
  • Wildcard origin is intentional: this is a public, read-only inference
    API with no credentials or user data. The model outputs are not
    sensitive. If authentication is added in future, restrict to specific
    origins and disable allow_credentials=False override.
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
    logger.info("Application starting up — loading LEAFORA model …")
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
    title="LEAFORA — Crop Disease Detection API",
    description=(
        "Production inference API for LEAFORA's custom CropDiseaseCNN, "
        "trained to classify 211 crop disease categories across multiple crops. "
        "Offline test accuracy: ~87.95% on 19,946 test samples."
    ),
    version="2.0.0",
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
    response_description="Service liveness and model status",
)
async def health():
    """
    Returns 200 OK when the service is running AND the model is loaded.
    Returns 503 Service Unavailable when the model failed to load at startup.
    """
    from app.inference import _model, _num_classes
    model_ready = _model is not None
    payload = {
        "status":       "ok" if model_ready else "model_unavailable",
        "model":        "veyra-cnn-211",
        "model_loaded": model_ready,
        "num_classes":  _num_classes if model_ready else 0,
    }
    if not model_ready:
        return JSONResponse(content=payload, status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
    return payload


@app.post(
    "/predict",
    summary="Predict crop disease from a leaf image",
    tags=["Inference"],
    response_description="Top-3 predictions with confidence scores",
)
async def predict_endpoint(file: UploadFile = File(...)):
    """
    Accept a JPG or PNG plant-leaf image and return the top-3 predicted
    disease classes with confidence scores (raw softmax, not calibrated).

    - **file**: image file (JPG / JPEG / PNG, max 10 MB)
    """
    from app.inference import MAX_UPLOAD_BYTES

    if file.size and file.size > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"File exceeds maximum upload size of {MAX_UPLOAD_BYTES // (1024 * 1024)} MB.",
        )

    # ---- Read file into memory ----
    image_bytes = await file.read()

    # ---- Validate (extension, MIME, size, then actual image content) ----
    try:
        validate_file(
            filename=file.filename or "upload",
            content_type=file.content_type or "",
            size_bytes=len(image_bytes),
            image_bytes=image_bytes,
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
