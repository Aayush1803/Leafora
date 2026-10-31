"""
inference.py — Model loading and image prediction logic for LEAFORA.

Design decisions
----------------
- Model (CropDiseaseCNN, 211 classes) is loaded ONCE at startup via a singleton.
- Class labels are read from models/model_config.json (checkpoint's class_to_idx),
  sorted by index, so label order is always authoritative.
- Preprocessing exactly matches training: RGB → resize 128×128 → ToTensor → Normalize.
- Device: CUDA if available, otherwise CPU (deployment-safe).
- Inference runs under torch.inference_mode() for maximum efficiency.
- The old checkpoint (best_color_model.pth, 38 classes) is preserved as a rollback.

Rollback
--------
To revert to the old model, update _MODEL_PATH and _CONFIG_PATH to point to
models/best_color_model.pth. The old weights and app/classes.py are NOT deleted.
"""

import io
import json
import logging
from pathlib import Path

import torch
import torch.nn.functional as F
from PIL import Image, UnidentifiedImageError
from torchvision import transforms

from app.model import CropDiseaseCNN

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Paths — resolved relative to this file so the backend works on any host.
# ---------------------------------------------------------------------------
_BACKEND_ROOT = Path(__file__).resolve().parent.parent        # crop-disease-backend/
_MODEL_DIR    = _BACKEND_ROOT / "models"

# LEAFORA CNN model (211 classes, 2.8 MB)
_MODEL_PATH  = _MODEL_DIR / "veyra_cnn_best.pth"
_CONFIG_PATH = _MODEL_DIR / "model_config.json"

# ---------------------------------------------------------------------------
# Accepted image MIME types / extensions
# ---------------------------------------------------------------------------
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/jpg", "image/png"}
ALLOWED_EXTENSIONS    = {".jpg", ".jpeg", ".png"}
MAX_UPLOAD_BYTES      = 10 * 1024 * 1024   # 10 MB

# ---------------------------------------------------------------------------
# Singleton state
# ---------------------------------------------------------------------------
_model:        CropDiseaseCNN | None = None
_class_names:  list[str]             = []
_device:       torch.device          = torch.device("cuda" if torch.cuda.is_available() else "cpu")
_num_classes:  int                   = 0

# ---------------------------------------------------------------------------
# Preprocessing pipeline — MUST match training exactly.
# Training used: RGB, resize 128×128, ToTensor, Normalize(ImageNet stats).
# ---------------------------------------------------------------------------
_TRANSFORM = transforms.Compose([
    transforms.Resize((128, 128)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229,  0.224,  0.225],
    ),
])


# ---------------------------------------------------------------------------
# Model loader
# ---------------------------------------------------------------------------

def load_model(
    model_path:  Path | None = None,
    config_path: Path | None = None,
) -> CropDiseaseCNN:
    """
    Load the LEAFORA CNN from disk and cache it as a module-level singleton.
    Safe to call multiple times — only loads from disk on the first call.

    Parameters
    ----------
    model_path  : override checkpoint path (default: models/veyra_cnn_best.pth)
    config_path : override config path     (default: models/model_config.json)
    """
    global _model, _class_names, _num_classes

    if _model is not None:
        return _model

    ckpt_path = model_path  or _MODEL_PATH
    cfg_path  = config_path or _CONFIG_PATH

    if not ckpt_path.exists():
        raise FileNotFoundError(
            f"Model checkpoint not found at {ckpt_path}. "
            "Copy models/veyra_cnn_best.pth into the models/ directory."
        )
    if not cfg_path.exists():
        raise FileNotFoundError(
            f"Model config not found at {cfg_path}. "
            "Copy models/model_config.json into the models/ directory."
        )

    # --- Load config (class mapping, architecture params) ---
    logger.info("Loading model config from %s …", cfg_path)
    with open(cfg_path, "r", encoding="utf-8") as f:
        config = json.load(f)

    num_classes = config["num_classes"]        # 211
    class_to_idx = config["class_to_idx"]      # {name: idx, …}

    # Build idx→name list sorted by index — authoritative ordering.
    class_names = [
        label
        for label, _ in sorted(class_to_idx.items(), key=lambda item: item[1])
    ]
    assert len(class_names) == num_classes, (
        f"class_to_idx length ({len(class_names)}) != num_classes ({num_classes})"
    )

    # --- Load checkpoint ---
    logger.info("Loading checkpoint from %s (device=%s) …", ckpt_path, _device)
    # Try weights_only=True first (safe, avoids arbitrary pickle execution).
    # Fall back to weights_only=False for checkpoints saved as full objects.
    try:
        checkpoint = torch.load(ckpt_path, map_location=_device, weights_only=True)
    except Exception:
        checkpoint = torch.load(ckpt_path, map_location=_device, weights_only=False)

    model = CropDiseaseCNN(num_classes=num_classes)

    if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
        model.load_state_dict(checkpoint["model_state_dict"])
    elif isinstance(checkpoint, dict):
        model.load_state_dict(checkpoint)
    else:
        # Checkpoint is a full model object (rare)
        model = checkpoint

    model.to(_device)
    model.eval()

    _model        = model
    _class_names  = class_names
    _num_classes  = num_classes

    logger.info(
        "LEAFORA model loaded — %d classes, running on %s.",
        num_classes, _device,
    )
    return _model


def get_model() -> CropDiseaseCNN:
    """Return the cached model, raising RuntimeError if not yet loaded."""
    if _model is None:
        raise RuntimeError("Model has not been loaded. Call load_model() first.")
    return _model


def get_class_names() -> list[str]:
    """Return the class-name list loaded with the model."""
    return _class_names


# ---------------------------------------------------------------------------
# Preprocessing
# ---------------------------------------------------------------------------

def preprocess_image(image_bytes: bytes) -> torch.Tensor:
    """
    Decode raw image bytes → normalised 4-D tensor [1, 3, 128, 128].
    Raises ValueError for corrupt or unsupported images.
    """
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except UnidentifiedImageError as exc:
        raise ValueError("Uploaded file is not a valid image or is corrupted.") from exc
    except Exception as exc:
        raise ValueError(f"Failed to open image: {exc}") from exc

    tensor = _TRANSFORM(image)       # [3, 128, 128]
    return tensor.unsqueeze(0)       # [1, 3, 128, 128]


# ---------------------------------------------------------------------------
# Prediction
# ---------------------------------------------------------------------------

def predict(image_bytes: bytes, top_k: int = 3) -> dict:
    """
    Run inference on raw image bytes.

    Returns
    -------
    dict with keys:
        predicted_class : str    — top-1 class name
        confidence      : float  — top-1 raw softmax score (0–1, 6 dp)
        top_predictions : list   — [{\"class\": str, \"confidence\": float}, …]

    Notes
    -----
    Confidence scores are raw softmax outputs, not calibrated probabilities.
    """
    model      = get_model()
    class_list = get_class_names()

    if not class_list:
        raise RuntimeError("Class names not loaded. Was load_model() called?")

    tensor = preprocess_image(image_bytes).to(_device)

    with torch.inference_mode():
        logits        = model(tensor)                     # [1, 211]
        probabilities = F.softmax(logits, dim=1)          # [1, 211]

    probs = probabilities.squeeze(0)                      # [211]
    k     = min(top_k, len(class_list))
    top_probs, top_indices = torch.topk(probs, k=k)

    top_predictions = [
        {
            "class":      class_list[idx.item()],
            "confidence": round(prob.item(), 6),
        }
        for prob, idx in zip(top_probs, top_indices)
    ]

    return {
        "predicted_class": top_predictions[0]["class"],
        "confidence":      top_predictions[0]["confidence"],
        "top_predictions": top_predictions,
    }


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------

def validate_file(
    filename: str,
    content_type: str,
    size_bytes: int,
    image_bytes: bytes | None = None,
) -> None:
    """
    Raise ValueError with a descriptive message if the uploaded file
    fails any validation check.

    Parameters
    ----------
    filename     : original filename (used for extension check).
    content_type : MIME type declared by the client (not trusted alone).
    size_bytes   : size of the upload in bytes.
    image_bytes  : if supplied, the raw bytes are decoded with Pillow to
                   verify the actual image format — extension and MIME type
                   are not trusted as the sole indicator of content.
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

    # Deep validation: verify the actual image format by attempting to decode.
    # This catches files that have a valid extension/MIME but are not images.
    if image_bytes is not None:
        try:
            img = Image.open(io.BytesIO(image_bytes))
            fmt = (img.format or "").upper()
            if fmt not in {"JPEG", "PNG"}:
                raise ValueError(
                    f"File content is '{fmt}', not a supported image format (JPEG or PNG)."
                )
        except UnidentifiedImageError:
            raise ValueError("Uploaded file is not a valid image or is corrupted.")
        except ValueError:
            raise
        except Exception as exc:
            raise ValueError(f"Failed to verify image content: {exc}") from exc
