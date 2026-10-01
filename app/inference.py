"""
inference.py — Model loading and image prediction logic.

Design decisions:
- Model is loaded ONCE at module import time (singleton pattern).
- All inference runs under torch.no_grad() on CPU.
- Preprocessing matches the training pipeline exactly:
    resize → 128×128, convert to RGB tensor, normalize with
    ImageNet-style mean/std that was used during training.
"""

import io
import logging
import os
from pathlib import Path

import torch
import torch.nn.functional as F
from PIL import Image, UnidentifiedImageError
from torchvision import transforms

from app.model import CropDiseaseCNN
from app.classes import CLASS_NAMES

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Preprocessing pipeline — MUST match what was used during training.
# Training used: resize 128×128, ToTensor (scales to [0,1]),
# Normalize with mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]
# (standard ImageNet statistics, commonly used for plant-disease datasets).
# ---------------------------------------------------------------------------
TRANSFORM = transforms.Compose([
    transforms.Resize((128, 128)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225],
    ),
])

# ---------------------------------------------------------------------------
# Accepted image MIME types / extensions
# ---------------------------------------------------------------------------
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/jpg", "image/png"}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png"}
MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB


# ---------------------------------------------------------------------------
# Singleton model — loaded once when the module is first imported.
# ---------------------------------------------------------------------------
_model: CropDiseaseCNN | None = None
_device = torch.device("cpu")

# Default path relative to this file's location.  Railway mounts the
# repo root, so models/best_color_model.pth is always reachable.
_MODEL_PATH = Path(__file__).resolve().parent.parent / "models" / "best_color_model.pth"


def load_model(model_path: Path | None = None) -> CropDiseaseCNN:
    """
    Load the trained model from disk and cache it as a module-level singleton.
    Safe to call multiple times — only loads from disk on the first call.
    """
    global _model

    if _model is not None:
        return _model

    path = model_path or _MODEL_PATH

    if not path.exists():
        raise FileNotFoundError(
            f"Model file not found at {path}. "
            "Place best_color_model.pth inside the models/ directory."
        )

    logger.info("Loading model from %s …", path)

    # Load state dict saved with torch.save(model.state_dict(), ...)
    # If the file was saved with torch.save(model, ...) this also works
    # because we reconstruct the class first.
    checkpoint = torch.load(path, map_location=_device, weights_only=False)

    model = CropDiseaseCNN(num_classes=38)

    # Support both: full model object saved OR state_dict saved
    if isinstance(checkpoint, dict):
        # Might be a raw state_dict or a checkpoint dict with a 'model_state_dict' key
        if "model_state_dict" in checkpoint:
            model.load_state_dict(checkpoint["model_state_dict"])
        else:
            model.load_state_dict(checkpoint)
    else:
        # The checkpoint IS the model object
        model = checkpoint

    model.to(_device)
    model.eval()

    _model = model
    logger.info("Model loaded successfully. Running on %s.", _device)
    return _model


def get_model() -> CropDiseaseCNN:
    """Return the cached model, raising RuntimeError if not yet loaded."""
    if _model is None:
        raise RuntimeError("Model has not been loaded. Call load_model() first.")
    return _model


# ---------------------------------------------------------------------------
# Prediction helpers
# ---------------------------------------------------------------------------

def preprocess_image(image_bytes: bytes) -> torch.Tensor:
    """
    Decode raw image bytes → normalised 4-D tensor  [1, 3, 128, 128].
    Raises ValueError for corrupt/unsupported images.
    """
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except UnidentifiedImageError as exc:
        raise ValueError("Uploaded file is not a valid image or is corrupted.") from exc
    except Exception as exc:
        raise ValueError(f"Failed to open image: {exc}") from exc

    tensor = TRANSFORM(image)          # shape: [3, 128, 128]
    return tensor.unsqueeze(0)         # shape: [1, 3, 128, 128]


def predict(image_bytes: bytes, top_k: int = 3) -> dict:
    """
    Run inference on raw image bytes.

    Returns
    -------
    dict with keys:
        predicted_class : str
        confidence      : float  (0–1, rounded to 6 dp)
        top_predictions : list of {"class": str, "confidence": float}
    """
    model = get_model()
    tensor = preprocess_image(image_bytes)

    with torch.no_grad():
        logits = model(tensor)                   # [1, 38]
        probabilities = F.softmax(logits, dim=1) # [1, 38]

    probs = probabilities.squeeze(0)             # [38]

    top_probs, top_indices = torch.topk(probs, k=min(top_k, len(CLASS_NAMES)))

    top_predictions = [
        {
            "class": CLASS_NAMES[idx.item()],
            "confidence": round(prob.item(), 6),
        }
        for prob, idx in zip(top_probs, top_indices)
    ]

    return {
        "predicted_class": top_predictions[0]["class"],
        "confidence": top_predictions[0]["confidence"],
        "top_predictions": top_predictions,
    }


def validate_file(filename: str, content_type: str, size_bytes: int) -> None:
    """
    Raise ValueError with a descriptive message if the uploaded file
    fails any validation check.
    """
    ext = Path(filename).suffix.lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(
            f"Unsupported file extension '{ext}'. "
            f"Accepted: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    if content_type not in ALLOWED_CONTENT_TYPES:
        raise ValueError(
            f"Unsupported content type '{content_type}'. "
            f"Accepted: {', '.join(sorted(ALLOWED_CONTENT_TYPES))}"
        )

    if size_bytes > MAX_UPLOAD_BYTES:
        mb = MAX_UPLOAD_BYTES // (1024 * 1024)
        raise ValueError(f"File exceeds maximum upload size of {mb} MB.")
