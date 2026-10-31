# LEAFORA — Crop Disease Detection Backend

Production inference API for **LEAFORA's custom `CropDiseaseCNN`**, a PyTorch Convolutional Neural Network trained to classify **211 crop disease categories** across diverse agricultural crops.

> **Offline Evaluation Results (Held-Out Test Set, 19,946 Samples):**
> - **Test Accuracy:** 87.95% (17,543 / 19,946)
> - **Weighted F1:** 88.47% (Weighted Precision: 89.28%, Weighted Recall: 87.95%)
> - **Macro F1:** 44.00% (penalized by 44 long-tail classes with $\le 8$ test samples)
> - **Parameters:** 703,603 (2.8 MB PyTorch checkpoint)
>
> *These are offline evaluation metrics on held-out test data, not a guarantee of live prediction accuracy in all ambient field conditions.*

> **Disclaimer:** This tool is intended for research, educational, and decision-support purposes only. Do not use model predictions as the sole basis for legal, commercial, or agricultural chemical applications.

---

## Project Structure

```
crop-disease-backend/
├── app/
│   ├── __init__.py       # Package marker
│   ├── main.py           # FastAPI app, routes, CORS, lifespan context
│   ├── model.py          # 211-class CropDiseaseCNN architecture
│   ├── inference.py      # Model-loader singleton, validation, predict()
│   └── classes.py        # Legacy 38-class list (rollback reference only)
├── models/
│   ├── veyra_cnn_best.pth     ← Active model weights (211 classes, 2.8 MB)
│   ├── model_config.json      ← Class mapping + architecture metadata
│   └── best_color_model.pth   ← Old 38-class weights (rollback reference only)
├── test_local.py         # Local offline and live smoke-test suite
├── requirements.txt      # Production dependencies (CPU-only PyTorch wheel)
├── Procfile              # Uvicorn start command
└── README.md
```

---

## Model Details

| Property | Value |
|----------|-------|
| **Architecture** | `CropDiseaseCNN` (4 convolutional blocks, 7 Conv2D layers, BatchNorm, AdaptiveAvgPool) |
| **Output Classes** | **211** canonical agricultural disease and healthy-state categories |
| **Input Shape** | RGB, $128 \times 128$ px |
| **Normalization** | ImageNet statistics: mean `[0.485, 0.456, 0.406]`, std `[0.229, 0.224, 0.225]` |
| **Active Checkpoint** | `models/veyra_cnn_best.pth` (2.8 MB) |
| **Configuration** | `models/model_config.json` |
| **Test Accuracy** | **87.95%** (19,946 test samples) |
| **Weighted F1** | **88.47%** |
| **Macro F1** | **44.00%** |
| **Inference Device** | CPU (`torch.inference_mode()`) |
| **Inference Latency**| 45–95 ms per image on commodity single vCPU |

---

## Local Setup & Execution

### 1. Create and Activate Virtual Environment

```powershell
# Windows PowerShell
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Linux / macOS
python3 -m venv .venv
source .venv/bin/activate
```

### 2. Install Dependencies

The `requirements.txt` file is pre-configured with `--extra-index-url https://download.pytorch.org/whl/cpu` to install the lightweight CPU-only build of PyTorch while sourcing web packages from PyPI:

```bash
pip install -r requirements.txt
```

### 3. Run the Smoke Test Suite

```bash
python test_local.py --offline
```
*Expected: `All 19 checks passed!`*

### 4. Start Local Development Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Interactive API documentation: `http://localhost:8000/docs` (Swagger UI).

---

## API Quick Reference

### Liveness Check: `GET /health`
```bash
curl http://localhost:8000/health
```
```json
{
  "status": "ok",
  "model": "CropDiseaseCNN",
  "classes": 211,
  "model_loaded": true,
  "device": "cpu"
}
```

### Prediction: `POST /predict`
```bash
curl -X POST http://localhost:8000/predict \
  -F "file=@/path/to/leaf_image.jpg"
```
```json
{
  "predicted_class": "tomato_late_blight",
  "confidence": 0.9812,
  "top_predictions": [
    { "class": "tomato_late_blight",  "confidence": 0.9812 },
    { "class": "tomato_early_blight", "confidence": 0.0143 },
    { "class": "tomato_leaf_mold",    "confidence": 0.0031 }
  ]
}
```

---

## Deployment Configuration (Render)

The active production backend is deployed as a Web Service on **Render**:
* **Base Production URL:** `https://vriksh.onrender.com`
* **Connected Web Frontend:** [https://LEAFORA-lilac-three.vercel.app](https://LEAFORA-lilac-three.vercel.app)
* **Build Command:** `pip install -r requirements.txt`
* **Start Command (`Procfile`):** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
* **Python Version:** Configured via `.python-version` (Python 3.11)
* **Instance Memory:** Runs within Render's free 512 MB tier (average memory footprint ~320 MB).

---

## Cross-Documentation Links

For comprehensive engineering specifications, see:
* [System Architecture (`../docs/ARCHITECTURE.md`)](../docs/ARCHITECTURE.md)
* [Model Card (`../docs/MODEL_CARD.md`)](../docs/MODEL_CARD.md)
* [REST API Specification (`../docs/API.md`)](../docs/API.md)
* [Cloud Deployment (`../docs/DEPLOYMENT.md`)](../docs/DEPLOYMENT.md)
