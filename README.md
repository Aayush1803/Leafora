# Crop Disease Detection — FastAPI Backend

Production-ready inference API for a custom PyTorch CNN that classifies
38 crop disease categories from the PlantVillage dataset.

> **Note:** This is the Color-model demo. A future unified model will replace it.
> The model detects only the 38 supported PlantVillage classes it was trained on; 
> it does not detect every crop disease in the real world.
> 
> **Disclaimer:** This tool is for research / educational purposes only.
> Do not use model predictions as the sole basis for agricultural or
> medical decisions.

---

## Project Structure

```
crop-disease-backend/
├── app/
│   ├── __init__.py       # package marker
│   ├── main.py           # FastAPI app, routes, CORS, lifespan
│   ├── model.py          # CropDiseaseCNN architecture (mirrors training)
│   ├── inference.py      # model loader singleton + predict() helper
│   └── classes.py        # 38 class name list in training order
├── models/
│   └── best_color_model.pth   ← place your trained weights here
├── test_local.py         # local smoke-test script
├── requirements.txt      # minimal production dependencies
├── Procfile              # Railway start command
├── .gitignore
└── README.md
```

---

## Local Setup

### 1. Clone / navigate to the backend folder

```bash
cd crop-disease-backend
```

### 2. Create a virtual environment

```bash
python -m venv .venv

# Windows PowerShell
.venv\Scripts\Activate.ps1

# macOS / Linux
source .venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

> **Note:** `torch` and `torchvision` are pinned to CPU-only builds in
> `requirements.txt`. If you want GPU inference locally, install the
> matching CUDA build from [pytorch.org](https://pytorch.org/get-started/locally/).

### 4. Add your model weights

Copy `best_color_model.pth` into the `models/` directory:

```bash
# Example (adjust path to wherever you saved the file)
cp /path/to/best_color_model.pth models/
```

---

## Running the API Locally

```bash
uvicorn app.main:app --reload
```

The server starts at **http://localhost:8000**.

Interactive docs (Swagger UI): http://localhost:8000/docs  
Alternative docs (ReDoc):      http://localhost:8000/redoc

---

## API Endpoints

### `GET /health`

Liveness check.

**Response**
```json
{
  "status": "ok",
  "model": "color-cnn"
}
```

---

### `POST /predict`

Classify a plant-leaf image.

| Field  | Type            | Description                    |
|--------|-----------------|--------------------------------|
| `file` | `multipart/form-data` | JPG / JPEG / PNG, max 10 MB |

**Success Response (200)**
```json
{
  "predicted_class": "Tomato___Late_blight",
  "confidence": 0.9812,
  "top_predictions": [
    { "class": "Tomato___Late_blight",      "confidence": 0.9812 },
    { "class": "Tomato___Early_blight",     "confidence": 0.0143 },
    { "class": "Tomato___Bacterial_spot",   "confidence": 0.0031 }
  ]
}
```

**Error Responses**

| Code | Reason |
|------|--------|
| 422  | Unsupported file type, invalid image, or file too large |
| 503  | Model weights file not found at startup |
| 500  | Unexpected server error |

---

## Example `curl` Request

```bash
# Health check
curl http://localhost:8000/health

# Predict
curl -X POST http://localhost:8000/predict \
  -F "file=@/path/to/leaf_image.jpg"
```

PowerShell equivalent:

```powershell
# Predict
Invoke-RestMethod `
  -Uri "http://localhost:8000/predict" `
  -Method Post `
  -Form @{ file = Get-Item "C:\path\to\leaf_image.jpg" }
```

---

## Running the Local Smoke-Test

Make sure your model weights are in `models/` before running.

```bash
# Offline mode — tests model loading + inference only (no server required)
python test_local.py --offline

# Full test — also hits the live API (start uvicorn first)
python test_local.py

# Against a different URL
python test_local.py --url http://localhost:8000
```

The test script verifies:
- ✓ Model loads from `models/best_color_model.pth`
- ✓ A 200×200 synthetic JPEG is pre-processed to shape `[1, 3, 128, 128]`
- ✓ Prediction returns exactly 3 top predictions
- ✓ File validation correctly accepts/rejects various MIME types and sizes
- ✓ `GET /health` returns `{"status": "ok", "model": "color-cnn"}`
- ✓ `POST /predict` returns a valid JSON prediction

---

## Railway Deployment

### Prerequisites
- Railway account: https://railway.app
- Railway CLI: `npm i -g @railway/cli`  (optional, can use the web dashboard)

### Steps

1. **Create a new Railway project** and link this repository (or push via CLI).

2. **Upload the model weights.**  
   The `.pth` file is ~10–50 MB and too large for most Git repositories.
   Options:
   - **Railway Volume**: Mount a persistent volume and place the `.pth` there,
     then update `_MODEL_PATH` in `inference.py` to point to the mount path
     (e.g. `/data/best_color_model.pth`).
   - **Git LFS**: Track `models/*.pth` with `git lfs track "*.pth"` and push.
     Railway supports Git LFS.
   - **Environment variable / download at startup**: Not recommended for large files.

3. **Set the start command.**  
   Railway auto-detects `Procfile`. It will run:
   ```
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

4. **Environment variables** (set in Railway dashboard → Variables):

   | Variable | Value | Notes |
   |----------|-------|-------|
   | `PYTHONUNBUFFERED` | `1` | Flush logs immediately |

5. **Deploy** — push to the linked branch or click "Deploy" in the dashboard.

6. **Verify** by opening the Railway-assigned URL:
   ```
   https://<your-app>.up.railway.app/health
   https://<your-app>.up.railway.app/docs
   ```

### Memory / Resource Notes

- The model is ~50 MB; Railway's free tier (512 MB RAM) is sufficient.
- CPU-only inference takes ~50–200 ms per request depending on instance size.
- Upgrade to a paid Railway plan for consistent performance under load.

---

## Class Labels

The model classifies 38 disease / health categories across 14 crops:

| # | Label |
|---|-------|
| 0 | Apple___Apple_scab |
| 1 | Apple___Black_rot |
| 2 | Apple___Cedar_apple_rust |
| 3 | Apple___healthy |
| 4 | Blueberry___healthy |
| 5 | Cherry_(including_sour)___Powdery_mildew |
| 6 | Cherry_(including_sour)___healthy |
| 7 | Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot |
| 8 | Corn_(maize)___Common_rust_ |
| 9 | Corn_(maize)___Northern_Leaf_Blight |
| 10 | Corn_(maize)___healthy |
| 11 | Grape___Black_rot |
| 12 | Grape___Esca_(Black_Measles) |
| 13 | Grape___Leaf_blight_(Isariopsis_Leaf_Spot) |
| 14 | Grape___healthy |
| 15 | Orange___Haunglongbing_(Citrus_greening) |
| 16 | Peach___Bacterial_spot |
| 17 | Peach___healthy |
| 18 | Pepper,_bell___Bacterial_spot |
| 19 | Pepper,_bell___healthy |
| 20 | Potato___Early_blight |
| 21 | Potato___Late_blight |
| 22 | Potato___healthy |
| 23 | Raspberry___healthy |
| 24 | Soybean___healthy |
| 25 | Squash___Powdery_mildew |
| 26 | Strawberry___Leaf_scorch |
| 27 | Strawberry___healthy |
| 28 | Tomato___Bacterial_spot |
| 29 | Tomato___Early_blight |
| 30 | Tomato___Late_blight |
| 31 | Tomato___Leaf_Mold |
| 32 | Tomato___Septoria_leaf_spot |
| 33 | Tomato___Spider_mites Two-spotted_spider_mite |
| 34 | Tomato___Target_Spot |
| 35 | Tomato___Tomato_Yellow_Leaf_Curl_Virus |
| 36 | Tomato___Tomato_mosaic_virus |
| 37 | Tomato___healthy |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Web framework | FastAPI 0.115 |
| ASGI server | Uvicorn |
| ML framework | PyTorch 2.4 (CPU) |
| Image processing | Pillow + torchvision |
| Deployment | Railway |

---

*Built for the HCL Crop Disease Detection project.*
